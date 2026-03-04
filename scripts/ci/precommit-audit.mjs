import { execSync } from 'node:child_process'

// lint-staged passes a list of changed file paths as argv; we ignore them and
// always run a high-severity audit once.
try {
  execSync('pnpm -w audit --audit-level=high --prod', { stdio: 'inherit' })
} catch (err) {
  process.exitCode = 1
}

