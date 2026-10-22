import { fetchWorkspaceSessions, workspaceFrameUrl } from '../framebuffer/sessions'
/** @deprecated Use workspaceSessionIds. */
export { workspaceSessionIds as workbenchSessionIds } from '../framebuffer/sessions'
/** @deprecated Use fetchWorkspaceSessions or discoverWorkspaceSessions. */
export function fetchWorkbenchSessions(signal?: AbortSignal): Promise<string[]> {
  return fetchWorkspaceSessions(signal, 'legacy')
}
/** @deprecated Use workspaceFrameUrl with the discovered protocol. */
export function workbenchFrameUrl(pageUrl: string, accountId: string): string {
  return workspaceFrameUrl(pageUrl, accountId, 'legacy')
}
