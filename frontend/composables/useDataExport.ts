export type DataExportJob = {
  id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  expiresAt?: string | null
  error?: string | null
}

export const useDataExport = () => {
  const { request } = useApi()

  const requestExport = async () => {
    return await request<{ success: boolean, job: DataExportJob }>('/data/export', {
      method: 'POST',
    })
  }

  const getExportStatus = async (id: string) => {
    return await request<{ success: boolean, job: DataExportJob }>(`/data/export/${id}`)
  }

  const getExportDownloadUrl = async (id: string) => {
    return await request<{ success: boolean, url: string, expiresIn: number }>(
      `/data/export/${id}/download`,
    )
  }

  return {
    requestExport,
    getExportStatus,
    getExportDownloadUrl,
  }
}
