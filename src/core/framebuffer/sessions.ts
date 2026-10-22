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

/** Discover the matching read/stream namespace without retrying ambiguous errors. */
export async function discoverWorkspaceSessions(signal?: AbortSignal): Promise<WorkspaceSessionDiscovery> {
  const read = (protocol: WorkspaceProtocol) => fetch(workspaceRoute('list_sessions', protocol), {
    method: 'POST', headers: { 'Content-Type': 'application/json', [workspaceClientHeader(protocol)]: 'workspace' },
    body: '{}', signal,
  })
  let protocol: WorkspaceProtocol = 'current'
  let response = await read(protocol)
  if (response.status === 404) { protocol = 'legacy'; response = await read(protocol) }
  if (!response.ok) throw new Error('Game runtime unavailable')
  return { accounts: workspaceSessionIds(await response.json()), protocol }
}

export async function fetchWorkspaceSessions(signal?: AbortSignal): Promise<string[]> {
  return (await discoverWorkspaceSessions(signal)).accounts
}
