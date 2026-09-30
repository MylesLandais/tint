export function workbenchSessionIds(value: unknown): string[] {
  if (!value || typeof value !== 'object' || !('sessions' in value) || !Array.isArray(value.sessions)) {
    throw new Error('Invalid workbench session response')
  }
  return [...new Set(value.sessions.flatMap((session: unknown) => {
    if (!session || typeof session !== 'object' || !('account_id' in session)) return []
    return typeof session.account_id === 'string' && session.account_id ? [session.account_id] : []
  }))]
}

export function workbenchFrameUrl(pageUrl: string, accountId: string): string {
  const url = new URL(`/api/workbench/frames/${encodeURIComponent(accountId)}`, pageUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.href
}

export async function fetchWorkbenchSessions(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch('/api/workbench/list_sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Workbench-Client': 'workspace' },
    body: '{}',
    signal,
  })
  if (!response.ok) throw new Error('Game runtime unavailable')
  return workbenchSessionIds(await response.json())
}
