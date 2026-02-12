import { runDbWorker } from './export-queue-worker'

export const runExportDbWorker = async (options?: { once?: boolean }) => {
  return runDbWorker(options)
}

if (require.main === module) {
  void runExportDbWorker()
}
