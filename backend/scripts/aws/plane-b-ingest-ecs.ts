import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'

export const handler = async (): Promise<void> => {
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B',
    secretArnEnv: 'PLANE_B_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_B_DB_SSM_NAME',
    hostEnv: 'PLANE_B_DB_HOST',
    portEnv: 'PLANE_B_DB_PORT',
    nameEnv: 'PLANE_B_DB_NAME',
    usernameEnv: 'PLANE_B_DB_USERNAME',
    passwordEnv: 'PLANE_B_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_B', 'database_url'],
  })

  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
      required: true,
    },
  ])

  // Use TS source when available (dev/tsx), fall back to built output in prod.
  const candidates = [
    '../../plane-b/src/ingest',
    '../../plane-b/ingest',
    '../../dist/plane-b/ingest',
  ] as const
  let runIngestion: typeof import('../../plane-b/src/ingest').runIngestion | undefined
  let lastError: unknown
  for (const candidate of candidates) {
    try {
      ({ runIngestion } = await import(candidate))
      break
    } catch (error) {
      lastError = error
    }
  }
  if (!runIngestion) {
    const message = lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(
      `Failed to load plane-b ingestion module (tried ${candidates.join(', ')}): ${message}`,
    )
  }
  await runIngestion()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
