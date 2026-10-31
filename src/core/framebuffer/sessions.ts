import { workspaceClientHeader, workspaceRoute, type WorkspaceProtocol } from '../compatibility/workspace'
export type { WorkspaceProtocol } from '../compatibility/workspace'
export type WorkspaceSessionDiscovery = { accounts: string[]; protocol: WorkspaceProtocol }

export function workspaceSessionIds(value: unknown): string[] {
  if (!value || typeof value !== 'object' || !('sessions' in value) || !Array.isArray(value.sessions)) {
    throw new Error('Invalid Workspace session response')
  }
  return [...new Set(value.sessions.flatMap((session: unknown) => {
    if (!session || typeof session !== 'object' || !('account_id' in session)) return []
    return typeof session.account_id === 'string' && session.account_id ? [session.account_id] : []
  }))]
}

export function workspaceFrameUrl(pageUrl: string, accountId: string, protocol: WorkspaceProtocol = 'current'): string {
  const url = new URL(workspaceRoute(`frames/${encodeURIComponent(accountId)}`, protocol), pageUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.href
}

function readSessions(protocol: WorkspaceProtocol, signal?: AbortSignal): Promise<Response> {
  return fetch(workspaceRoute('list_sessions', protocol), {
    method: 'POST', headers: { 'Content-Type': 'application/json', [workspaceClientHeader(protocol)]: 'workspace' },
    body: '{}', signal,
  })
}

/** Discover the matching read/stream namespace without retrying ambiguous errors. */
export async function discoverWorkspaceSessions(signal?: AbortSignal): Promise<WorkspaceSessionDiscovery> {
  let protocol: WorkspaceProtocol = 'current'
  let response = await readSessions(protocol, signal)
  if (response.status === 404) { protocol = 'legacy'; response = await readSessions(protocol, signal) }
  if (!response.ok) throw new Error('Game runtime unavailable')
  return { accounts: workspaceSessionIds(await response.json()), protocol }
}

export async function fetchWorkspaceSessions(signal?: AbortSignal, protocol?: WorkspaceProtocol): Promise<string[]> {
  if (protocol === undefined) return (await discoverWorkspaceSessions(signal)).accounts
  const response = await readSessions(protocol, signal)
  if (!response.ok) throw new Error('Game runtime unavailable')
  return workspaceSessionIds(await response.json())
}
