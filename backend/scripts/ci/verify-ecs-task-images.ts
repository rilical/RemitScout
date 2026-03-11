import {
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListServicesCommand,
  type ContainerDefinition,
} from '@aws-sdk/client-ecs'
import { DescribeImagesCommand, ECRClient } from '@aws-sdk/client-ecr'

export type ParsedEcrImageReference = {
  registry: string
  repositoryName: string
  tag?: string
  digest?: string
}

export type EcsTaskImageIssue = {
  serviceName: string
  taskDefinitionArn: string
  containerName: string
  image: string
  reason: string
}

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

export const parseEcrImageReference = (
  image: string,
): ParsedEcrImageReference | null => {
  const normalized = image.trim().replace(/^https?:\/\//, '')
  if (!normalized) return null

  let remainder = normalized
  let digest: string | undefined
  const digestIndex = remainder.indexOf('@')
  if (digestIndex >= 0) {
    digest = remainder.slice(digestIndex + 1)
    remainder = remainder.slice(0, digestIndex)
  }

  const lastSlashIndex = remainder.lastIndexOf('/')
  const lastColonIndex = remainder.lastIndexOf(':')
  let tag: string | undefined
  if (lastColonIndex > lastSlashIndex) {
    tag = remainder.slice(lastColonIndex + 1)
    remainder = remainder.slice(0, lastColonIndex)
  }

  const firstSlashIndex = remainder.indexOf('/')
  if (firstSlashIndex <= 0 || firstSlashIndex === remainder.length - 1) {
    return null
  }

  return {
    registry: remainder.slice(0, firstSlashIndex),
    repositoryName: remainder.slice(firstSlashIndex + 1),
    tag,
    digest,
  }
}

export const isManagedBackendImage = (image: string): boolean => {
  const parsed = parseEcrImageReference(image)
  if (!parsed) return false
  return parsed.repositoryName.startsWith('remit-scout-backend-')
}

type ImageExistenceChecker = (reference: ParsedEcrImageReference) => Promise<boolean>

export const validateContainerImages = async (
  envName: string,
  taskDefinitionArn: string,
  serviceName: string,
  containers: ContainerDefinition[],
  imageExists: ImageExistenceChecker,
): Promise<EcsTaskImageIssue[]> => {
  const issues: EcsTaskImageIssue[] = []
  const expectedRepositoryName = `remit-scout-backend-${envName}`

  for (const container of containers) {
    const image = container.image?.trim() || ''
    if (!image || !isManagedBackendImage(image)) continue

    const parsed = parseEcrImageReference(image)
    if (!parsed) {
      issues.push({
        serviceName,
        taskDefinitionArn,
        containerName: container.name || 'unknown',
        image,
        reason: 'image is not a valid ECR reference',
      })
      continue
    }

    if (parsed.repositoryName !== expectedRepositoryName) {
      issues.push({
        serviceName,
        taskDefinitionArn,
        containerName: container.name || 'unknown',
        image,
        reason: `expected repository ${expectedRepositoryName} but found ${parsed.repositoryName}`,
      })
      continue
    }

    if (parsed.tag?.toLowerCase() === 'latest') {
      issues.push({
        serviceName,
        taskDefinitionArn,
        containerName: container.name || 'unknown',
        image,
        reason: 'latest tag is not allowed in non-dev ECS task definitions',
      })
      continue
    }

    if (!parsed.tag && !parsed.digest) {
      issues.push({
        serviceName,
        taskDefinitionArn,
        containerName: container.name || 'unknown',
        image,
        reason: 'image must pin an immutable tag or digest',
      })
      continue
    }

    const exists = await imageExists(parsed)
    if (!exists) {
      issues.push({
        serviceName,
        taskDefinitionArn,
        containerName: container.name || 'unknown',
        image,
        reason: parsed.tag
          ? `image tag ${parsed.tag} does not exist in ECR`
          : `image digest ${parsed.digest} does not exist in ECR`,
      })
    }
  }

  return issues
}

const listServiceNames = async (ecs: ECSClient, clusterName: string): Promise<string[]> => {
  const serviceNames = new Set<string>()
  let nextToken: string | undefined
  do {
    const response = await ecs.send(new ListServicesCommand({
      cluster: clusterName,
      nextToken,
    }))
    for (const serviceArn of response.serviceArns ?? []) {
      const serviceName = serviceArn?.split('/').pop()?.trim()
      if (serviceName) serviceNames.add(serviceName)
    }
    nextToken = response.nextToken
  } while (nextToken)
  return [...serviceNames]
}

const buildImageExistenceChecker = (ecr: ECRClient): ImageExistenceChecker => {
  const cache = new Map<string, Promise<boolean>>()
  return async (reference) => {
    const key = `${reference.repositoryName}:${reference.tag || reference.digest || ''}`
    const cached = cache.get(key)
    if (cached) return cached

    const request = (async () => {
      try {
        await ecr.send(new DescribeImagesCommand({
          repositoryName: reference.repositoryName,
          imageIds: [reference.tag ? { imageTag: reference.tag } : { imageDigest: reference.digest }],
        }))
        return true
      } catch (error) {
        if (String(error).includes('ImageNotFoundException') || String(error).includes('RepositoryNotFoundException')) {
          return false
        }
        throw error
      }
    })()

    cache.set(key, request)
    return request
  }
}

export const run = async (env: NodeJS.ProcessEnv = process.env): Promise<void> => {
  const envName = String(env.ENV_NAME || env.ENVIRONMENT || '').trim().toLowerCase()
  if (!envName) {
    throw new Error('Missing ENV_NAME or ENVIRONMENT')
  }
  if (envName === 'dev') {
    throw new Error('verify-ecs-task-images should only run in staging/prod')
  }

  const clusterName = String(env.ECS_CLUSTER_NAME || `remit-scout-${envName}`).trim()
  const ecs = new ECSClient({})
  const ecr = new ECRClient({})
  const imageExists = buildImageExistenceChecker(ecr)
  const serviceNames = await listServiceNames(ecs, clusterName)

  const taskDefinitions = new Map<string, string[]>()
  for (const chunk of chunkArray(serviceNames, 10)) {
    const response = await ecs.send(new DescribeServicesCommand({
      cluster: clusterName,
      services: chunk,
    }))
    for (const service of response.services ?? []) {
      const serviceName = service.serviceName?.trim()
      const taskDefinitionArn = service.taskDefinition?.trim()
      if (!serviceName || !taskDefinitionArn) continue
      const existing = taskDefinitions.get(taskDefinitionArn)
      if (existing) {
        existing.push(serviceName)
      } else {
        taskDefinitions.set(taskDefinitionArn, [serviceName])
      }
    }
  }

  const issues: EcsTaskImageIssue[] = []
  for (const [taskDefinitionArn, owners] of taskDefinitions.entries()) {
    const response = await ecs.send(new DescribeTaskDefinitionCommand({
      taskDefinition: taskDefinitionArn,
    }))
    const containers = response.taskDefinition?.containerDefinitions ?? []
    for (const serviceName of owners) {
      issues.push(
        ...(await validateContainerImages(envName, taskDefinitionArn, serviceName, containers, imageExists)),
      )
    }
  }

  if (issues.length > 0) {
    console.error('ECS task image verification failed:')
    for (const issue of issues) {
      console.error(
        `- service=${issue.serviceName} taskDefinition=${issue.taskDefinitionArn} container=${issue.containerName} image=${issue.image} reason=${issue.reason}`,
      )
    }
    throw new Error(`Found ${issues.length} ECS task image issue(s) in ${clusterName}`)
  }

  console.log(`Verified immutable ECS task images for ${clusterName}`)
}

const isDirectExecution = /(^|[/\\])verify-ecs-task-images\.(ts|js)$/.test(process.argv[1] || '')

if (isDirectExecution) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
