;(async () => {
  process.env.AWS_REGION = 'us-east-1'
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'test'
  process.env.NODE_ENV = 'production'
  process.env.ENVIRONMENT = 'dev'
  process.env.PGSSLMODE = 'require'
  process.env.DATABASE_URL = ''
  process.env.PLANE_A_DB_HOST = 'remit-scout-dev-remitscoutauroracluster4aa33bab-am3xjbcrzsnh.cluster-csfk2aykg227.us-east-1.rds.amazonaws.com'
  process.env.PLANE_A_DB_PORT = '5432'
  process.env.PLANE_A_DB_NAME = 'remit_scout'
  process.env.PLANE_A_DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:716156543157:secret:remit-scout/dev/database/master-97IeeR'
  process.env.REDIS_URL = 'rediss://master.rer1b7mgk87k71dl.0bgood.use1.cache.amazonaws.com:6379'
  process.env.REDIS_SECRET_ARN = ''
  process.env.REDIS_SSM_NAME = ''
  process.env.PLANE_C_BASE_URL = 'https://9z79jztem7.execute-api.us-east-1.amazonaws.com'
  process.env.QUOTE_REFRESH_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-quote-refresh'
  process.env.FX_RATE_REFRESH_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-fx-rate-refresh'
  process.env.EXPORT_JOB_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-export-job'
  process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-ingest-fanout'
  process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-notifications'
  process.env.PLANE_B_OPS_ALERT_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-ops-alerts'
  process.env.GOLD_LIVE_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-gold-live'
  process.env.ALERT_EVALUATION_QUEUE_URL='https://sqs.us-east-1.amazonaws.com/716156543157/remit-scout-dev-alert-evaluation'
  process.env.BRONZE_S3_BUCKET='remit-scout-bronze-dev'
  process.env.EXPORTS_S3_BUCKET='remit-scout-exports-dev'

  const { resolveDatabaseUrl } = await import('./shared/aws-params')
  const { runStartupChecks } = await import('./shared/startup')
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
    sslModeEnv: 'PGSSLMODE',
    required: true,
  })
  console.log('DATABASE_URL_PLANE_A=', process.env.DATABASE_URL_PLANE_A)

  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B',
    secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
    hostEnv: 'PLANE_A_DB_HOST',
    portEnv: 'PLANE_A_DB_PORT',
    nameEnv: 'PLANE_A_DB_NAME',
    usernameEnv: 'PLANE_A_DB_USERNAME',
    passwordEnv: 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    sslModeEnv: 'PGSSLMODE',
    required: true,
  })
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_C',
    secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
    hostEnv: 'PLANE_A_DB_HOST',
    portEnv: 'PLANE_A_DB_PORT',
    nameEnv: 'PLANE_A_DB_NAME',
    usernameEnv: 'PLANE_A_DB_USERNAME',
    passwordEnv: 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    sslModeEnv: 'PGSSLMODE',
    required: true,
  })

  const { config } = await import('./shared/config')
  console.log('config.db.planeAUrl=', config.db.planeAUrl)
  console.log('config.runtime.isStrictConfig=', config.runtime.isStrictConfig)

  try {
    await runStartupChecks({
      requirements: {
        requirePlaneA: true,
        requirePlaneB: true,
        requirePlaneCDb: true,
        requirePlaneC: true,
        requireRedis: true,
        requireQueues:
          config.queues.quoteRefreshMode !== 'off' ||
          config.queues.fxRateRefreshMode !== 'off' ||
          config.queues.exports.mode !== 'off' ||
          config.queues.ingestFanout.mode !== 'off' ||
          config.queues.notifications.mode !== 'off' ||
          config.queues.opsAlerts.mode !== 'off' ||
          config.queues.goldLive.mode !== 'off' ||
          config.alerts.evaluation.enabled,
        requireQuoteRefreshQueue: config.queues.quoteRefreshMode !== 'off',
        requireFxRateRefreshQueue: config.queues.fxRateRefreshMode !== 'off',
        requireExportJobQueue: config.queues.exports.mode !== 'off',
        requireIngestFanoutQueue: config.queues.ingestFanout.mode !== 'off',
        requireNotificationsQueue: config.queues.notifications.mode !== 'off',
        requireOpsAlertsQueue: config.queues.opsAlerts.mode !== 'off',
        requireGoldLiveQueue: config.queues.goldLive.mode !== 'off',
        requireAlertEvaluationQueue: config.alerts.evaluation.enabled,
        requireStorage: config.queues.exports.mode !== 'off',
        requireExportsBucket: config.queues.exports.mode !== 'off',
        requireJwtSecret: true,
      },
    })
    console.log('startupChecksOk')
  } catch (error) {
    console.error('startupFailed', error instanceof Error ? error.message : String(error))
  }
})()
