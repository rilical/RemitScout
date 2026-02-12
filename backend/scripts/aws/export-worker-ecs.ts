import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'

export const handler = async (): Promise<void> => {
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_A',
    secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
    hostEnv: 'PLANE_A_DB_HOST',
    portEnv: 'PLANE_A_DB_PORT',
    nameEnv: 'PLANE_A_DB_NAME',
    usernameEnv: 'PLANE_A_DB_USERNAME',
    passwordEnv: 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_A', 'database_url'],
  })

  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
      required: true,
    },
    {
      envVar: 'EXPORT_JOB_QUEUE_URL',
      secretArnEnv: 'EXPORT_JOB_QUEUE_SECRET_ARN',
      ssmNameEnv: 'EXPORT_JOB_QUEUE_SSM_NAME',
      jsonKeys: ['url', 'EXPORT_JOB_QUEUE_URL'],
      required: false,
    },
    {
      envVar: 'EXPORTS_S3_BUCKET',
      secretArnEnv: 'EXPORTS_S3_BUCKET_SECRET_ARN',
      ssmNameEnv: 'EXPORTS_S3_BUCKET_SSM_NAME',
      jsonKeys: ['bucket', 'EXPORTS_S3_BUCKET'],
      required: false,
    },
  ])

  const { runExportWorker } = await import('../export-worker')
  await runExportWorker()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
