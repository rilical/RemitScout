import fs from 'fs'
import path from 'path'
import { config as loadDotenv } from 'dotenv'

const isAwsRuntime = Boolean(
  process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION ||
    process.env.ECS_CONTAINER_METADATA_URI ||
    process.env.ECS_CONTAINER_METADATA_URI_V4,
)

const loadEnvFile = (filePath: string, override: boolean) => {
  if (!fs.existsSync(filePath)) {
    return
  }
  loadDotenv({ path: filePath, override })
}

if (!isAwsRuntime && process.env.DOTENV_DISABLE !== '1') {
  const cwd = process.cwd()
  const explicit = process.env.ENV_FILE
  if (explicit && explicit.trim()) {
    loadEnvFile(path.resolve(cwd, explicit.trim()), true)
  } else {
    loadEnvFile(path.resolve(cwd, '.env'), false)
    loadEnvFile(path.resolve(cwd, '.env.local'), true)
  }
}
