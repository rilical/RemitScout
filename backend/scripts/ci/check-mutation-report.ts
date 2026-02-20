import fs from 'node:fs'
import path from 'node:path'

const candidateFiles = [
  path.resolve(process.cwd(), 'reports/mutation/mutation.json'),
  path.resolve(process.cwd(), 'reports/mutation/report.json'),
  path.resolve(process.cwd(), 'reports/mutation/mutation-report.json'),
]

const findReport = (): string | null => {
  for (const file of candidateFiles) {
    if (fs.existsSync(file)) return file
  }
  return null
}

const run = () => {
  const report = findReport()
  if (!report) {
    console.error('Mutation report JSON not found under reports/mutation/')
    process.exit(1)
  }

  const raw = fs.readFileSync(report, 'utf8')
  const survivedMatches = raw.match(/"status"\s*:\s*"Survived"/g) || []
  const survived = survivedMatches.length
  const maxSurvived = Number.parseInt(process.env.MUTATION_MAX_SURVIVED || '0', 10)

  console.log(
    JSON.stringify(
      {
        report,
        survived,
        maxSurvived,
      },
      null,
      2,
    ),
  )

  if (survived > maxSurvived) {
    console.error(
      `Mutation gate failed: survived mutants (${survived}) exceed limit (${maxSurvived})`,
    )
    process.exit(1)
  }
}

run()

