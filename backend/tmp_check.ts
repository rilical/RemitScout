import { resolveDatabaseUrl } from './shared/aws-params'

(async () => {
  process.env.PLANE_A_DB_HOST = 'remit-scout-dev-remitscoutauroracluster4aa33bab-am3xjbcrzsnh.cluster-csfk2aykg227.us-east-1.rds.amazonaws.com'
  process.env.PLANE_A_DB_PORT = '5432'
  process.env.PLANE_A_DB_NAME = 'remit_scout'
  process.env.PLANE_A_DB_USERNAME = 'remit_scout'
  process.env.PLANE_A_DB_PASSWORD = 'jqU3LhktF8NghlhznITrXNvvaeW6HDHQ'
  process.env.PLANE_A_DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:716156543157:secret:remit-scout/dev/database/master-97IeeR'

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
})()
