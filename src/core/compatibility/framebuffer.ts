import { workspaceFrameUrl } from '../framebuffer/sessions'
/** @deprecated Use workspaceSessionIds. */
export { workspaceSessionIds as workbenchSessionIds } from '../framebuffer/sessions'
/** @deprecated Use fetchWorkspaceSessions or discoverWorkspaceSessions. */
export { fetchWorkspaceSessions as fetchWorkbenchSessions } from '../framebuffer/sessions'
/** @deprecated Use workspaceFrameUrl with the discovered protocol. */
export function workbenchFrameUrl(pageUrl: string, accountId: string): string {
  return workspaceFrameUrl(pageUrl, accountId, 'legacy')
}
