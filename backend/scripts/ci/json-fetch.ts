const parseJsonishText = (text: string): unknown => {
  const trimmed = text.trim()
  if (!trimmed) return ''

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
    || (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return text
    }
  }

  return text
}

export const jsonFetch = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await res.json().catch(() => ({}))
    return { status: res.status, body: body as T }
  }

  const text = await res.text().catch(() => '')
  return { status: res.status, body: parseJsonishText(text) as T }
}

export { parseJsonishText }
