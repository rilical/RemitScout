if (!process.env.DOTENV_DISABLE) {
  process.env.DOTENV_DISABLE = '1'
}

if (!process.env.PLANE_A_CORS_ORIGINS) {
  process.env.PLANE_A_CORS_ORIGINS = 'http://localhost:3000'
}

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_codex'
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
}

if (!process.env.PRIVACY_HASH_SALT) {
  process.env.PRIVACY_HASH_SALT = 'test-privacy-salt'
}
