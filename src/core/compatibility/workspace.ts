/** One-release transport/configuration boundary; new values take precedence. */
export type WorkspaceProtocol = 'current' | 'legacy'
export const workspaceProxyPrefixes = ['/api/workspace', '/api/workbench'] as const
export function workspaceRoute(path: string, protocol: WorkspaceProtocol = 'current'): string {
  return `${workspaceProxyPrefixes[protocol === 'legacy' ? 1 : 0]}/${path}`
}
export function workspaceClientHeader(protocol: WorkspaceProtocol = 'current'): string {
  return protocol === 'legacy' ? 'X-Workbench-Client' : 'X-Workspace-Client'
}
export function resolveWorkspaceTarget(environment: Readonly<Record<string, string | undefined>>): string {
  return environment.NEBULA_WORKSPACE_URL ?? environment.ENDLESS_WORKBENCH_URL ?? 'http://127.0.0.1:45177'
}
