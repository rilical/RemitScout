import fs from 'node:fs'
import path from 'node:path'
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds'
import { GetBucketEncryptionCommand, S3Client } from '@aws-sdk/client-s3'

type Finding = {
  kind: 'rds' | 's3' | 'input'
  resource: string
  message: string
}

const trim = (value?: string) => (value || '').trim()
const repoRoot = path.resolve(__dirname, '..', '..', '..')

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))

const parseCsv = (value: string): string[] =>
  unique(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )

const parseClusterIdFromArn = (arn: string): string => {
  const parts = arn.split(':')
  const resource = parts[5] || ''
  const resourceParts = resource.split(':')
  return resourceParts[1] || resource
}

const resolveTargetsFromStack = async (stackName: string) => {
  const client = new CloudFormationClient({})
  const response = await client.send(new DescribeStacksCommand({ StackName: stackName }))
  const outputs = response.Stacks?.[0]?.Outputs ?? []

  const buckets: string[] = []
  let clusterIdentifier = ''

  for (const output of outputs) {
    const key = trim(output.OutputKey)
    const value = trim(output.OutputValue)
    if (!key || !value) continue
    if (/bucketname$/i.test(key) || /s3bucket/i.test(key)) {
      buckets.push(value)
    }
    if (/databaseclusterarn/i.test(key) || /dbclusterarn/i.test(key)) {
      clusterIdentifier = parseClusterIdFromArn(value)
    }
    if (/databaseclusteridentifier/i.test(key) || /dbclusteridentifier/i.test(key)) {
      clusterIdentifier = value
    }
  }

  return {
    buckets: unique(buckets),
    clusterIdentifier: trim(clusterIdentifier),
  }
}

const checkRdsEncryption = async (clusterIdentifier: string): Promise<Finding[]> => {
  if (!clusterIdentifier) return []
  const client = new RDSClient({})
  const response = await client.send(
    new DescribeDBClustersCommand({
      DBClusterIdentifier: clusterIdentifier,
    }),
  )
  const cluster = response.DBClusters?.[0]
  if (!cluster) {
    return [{
      kind: 'rds',
      resource: clusterIdentifier,
      message: 'DB cluster not found',
    }]
  }
  if (cluster.StorageEncrypted !== true) {
    return [{
      kind: 'rds',
      resource: clusterIdentifier,
      message: 'StorageEncrypted is false',
    }]
  }
  return []
}

const checkBucketEncryption = async (bucketName: string): Promise<Finding[]> => {
  const client = new S3Client({})
  try {
    const response = await client.send(
      new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }),
    )
    const rules = response.ServerSideEncryptionConfiguration?.Rules ?? []
    if (rules.length === 0) {
      return [{
        kind: 's3',
        resource: bucketName,
        message: 'No bucket encryption rules configured',
      }]
    }
    return []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [{
      kind: 's3',
      resource: bucketName,
      message,
    }]
  }
}

const writeReport = (findings: Finding[], targets: { clusterIdentifier: string; buckets: string[] }) => {
  const reportPath = process.env.SECURITY_AUDIT_REPORT || 'artifacts/aws-security-posture.json'
  const fullPath = path.resolve(repoRoot, reportPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(
    fullPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      targets,
      findings,
    }, null, 2)}\n`,
  )
  return fullPath
}

const run = async () => {
  const stackName = trim(process.env.STACK_NAME)
  const envBuckets = parseCsv(trim(process.env.S3_BUCKETS_CSV))
  const envCluster = trim(process.env.RDS_CLUSTER_IDENTIFIER)

  const stackTargets = stackName
    ? await resolveTargetsFromStack(stackName)
    : { buckets: [] as string[], clusterIdentifier: '' }

  const buckets = unique([...envBuckets, ...stackTargets.buckets])
  const clusterIdentifier = envCluster || stackTargets.clusterIdentifier
  const findings: Finding[] = []

  if (!clusterIdentifier && buckets.length === 0) {
    findings.push({
      kind: 'input',
      resource: 'targets',
      message: 'No RDS/S3 targets resolved (set STACK_NAME or explicit env vars)',
    })
  }

  findings.push(...await checkRdsEncryption(clusterIdentifier))
  for (const bucket of buckets) {
    findings.push(...await checkBucketEncryption(bucket))
  }

  const report = writeReport(findings, { clusterIdentifier, buckets })
  if (findings.length > 0) {
    console.error('AWS encryption posture audit failed:')
    for (const finding of findings) {
      console.error(`- [${finding.kind}] ${finding.resource}: ${finding.message}`)
    }
    console.error(`Report: ${report}`)
    process.exit(1)
  }

  console.log(`AWS encryption posture audit passed. Report: ${report}`)
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`AWS security posture audit failed: ${message}`)
  process.exit(1)
})
