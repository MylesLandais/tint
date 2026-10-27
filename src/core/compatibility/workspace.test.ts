import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveWorkspaceTarget, workspaceProxyPrefixes } from './workspace'
import { resolveWorkspaceResponsive, workbenchLayout, deriveWorkbenchRows } from './table'
import { collectionWorkspaceLayout } from '../table/layout'
import { deriveWorkspaceRows } from '../table/workspace'
import { workbenchFrameUrl, workbenchSessionIds, fetchWorkbenchSessions } from './framebuffer'
import { discoverWorkspaceSessions, fetchWorkspaceSessions, workspaceFrameUrl, workspaceSessionIds } from '../framebuffer/sessions'

afterEach(() => vi.unstubAllGlobals())
const sessions = { sessions: [{ account_id: 'alpha' }, { account_id: 'alpha' }, { account_id: '' }, null, { account_id: 1 }, { account_id: 'beta' }] }
describe('Workspace mixed-version compatibility', () => {
  it('prefers new configuration and explicit false over old values', () => {
    expect(resolveWorkspaceTarget({ NEBULA_WORKSPACE_URL: 'new', ENDLESS_WORKBENCH_URL: 'old' })).toBe('new')
    expect(resolveWorkspaceTarget({ ENDLESS_WORKBENCH_URL: 'old' })).toBe('old')
    expect(resolveWorkspaceTarget({})).toBe('http://127.0.0.1:45177')
    expect(resolveWorkspaceResponsive(false, { workbenchResponsive: true })).toBe(false)
    expect(resolveWorkspaceResponsive(undefined, { workbenchResponsive: true })).toBe(true)
    expect(resolveWorkspaceResponsive(undefined, {})).toBe(false)
    expect(workspaceProxyPrefixes).toEqual(['/api/workspace', '/api/workbench'])
  })
  it('retains aliases and account-safe stream URLs', () => {
    expect(workbenchLayout).toBe(collectionWorkspaceLayout)
    expect(deriveWorkbenchRows).toBe(deriveWorkspaceRows)
    expect(workbenchSessionIds).toBe(workspaceSessionIds)
    expect(workspaceSessionIds(sessions)).toEqual(['alpha', 'beta'])
    expect(() => workspaceSessionIds({ sessions: 'bad' })).toThrow('Invalid Workspace session response')
    expect(workspaceFrameUrl('https://example.test/docs', 'a/b ?')).toBe('wss://example.test/api/workspace/frames/a%2Fb%20%3F')
    expect(workbenchFrameUrl('http://example.test/docs', 'a/b')).toBe('ws://example.test/api/workbench/frames/a%2Fb')
  })
  it('preserves the deprecated helper on a server that rejects unknown namespaces', async () => {
    const fetcher = vi.fn(async (url: string) => url.startsWith('/api/workspace/')
      ? new Response('', { status: 403 }) : new Response(JSON.stringify(sessions)))
    vi.stubGlobal('fetch', fetcher)
    const signal = new AbortController().signal
    expect(await fetchWorkbenchSessions(signal)).toEqual(['alpha', 'beta'])
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledWith('/api/workbench/list_sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Workbench-Client': 'workspace' }, body: '{}', signal })
    await expect(discoverWorkspaceSessions(signal)).rejects.toThrow('Game runtime unavailable')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(await fetchWorkspaceSessions(signal, 'legacy')).toEqual(['alpha', 'beta'])
  })
  it('uses current routes/headers without probing legacy on success', async () => {
    const signal = new AbortController().signal
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(sessions)))
    vi.stubGlobal('fetch', fetcher)
    expect(await discoverWorkspaceSessions(signal)).toEqual({ accounts: ['alpha', 'beta'], protocol: 'current' })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledWith('/api/workspace/list_sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Workspace-Client': 'workspace' }, body: '{}', signal })
  })
  it('falls back only after 404 and retains the stream namespace', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify(sessions)))
    vi.stubGlobal('fetch', fetcher)
    const found = await discoverWorkspaceSessions()
    expect(found).toEqual({ accounts: ['alpha', 'beta'], protocol: 'legacy' })
    expect(fetcher.mock.calls[1]).toEqual(['/api/workbench/list_sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Workbench-Client': 'workspace' }, body: '{}', signal: undefined }])
    expect(workspaceFrameUrl('https://example.test', found.accounts[0]!, found.protocol)).toContain('/api/workbench/frames/alpha')
  })
  it.each([401, 403, 409, 500, 503])('does not mask HTTP %i by falling back', async status => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status }))
    vi.stubGlobal('fetch', fetcher)
    await expect(discoverWorkspaceSessions()).rejects.toThrow('Game runtime unavailable')
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('does not retry missing, malformed or aborted observations', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
      .mockResolvedValueOnce(new Response('not json')).mockResolvedValueOnce(new Response('{"sessions":null}'))
    vi.stubGlobal('fetch', fetcher)
    await expect(discoverWorkspaceSessions()).rejects.toThrow('Aborted')
    await expect(discoverWorkspaceSessions()).rejects.toThrow()
    await expect(discoverWorkspaceSessions()).rejects.toThrow('Invalid Workspace session response')
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
