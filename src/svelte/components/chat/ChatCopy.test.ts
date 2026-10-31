import { mount, unmount, tick } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import type { ChatBuiltInMessagePart } from '../../../core/chat'
import ChatPart from './ChatPart.svelte'
import ChatReasoning from './ChatReasoning.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLDivElement
function deferred() {
  let resolve!: () => void, reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
function fixture(initial: ChatBuiltInMessagePart) {
  const state = new SvelteMap<string, ChatBuiltInMessagePart | string>([['part', initial], ['message', 'message-1']])
  target = document.createElement('div'); document.body.append(target)
  mounted = mount(ChatPart, { target, props: {
    get part() { return state.get('part') as ChatBuiltInMessagePart },
    get messageId() { return state.get('message') as string },
  } })
  return state
}
function clipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}
afterEach(async () => {
  if (mounted) await unmount(mounted)
  mounted = null; document.body.innerHTML = ''
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals()
})

test('an old code copy cannot claim the changed source was copied', async () => {
  const pending = deferred(); clipboard(vi.fn().mockReturnValue(pending.promise))
  const state = fixture({ id: 'code', type: 'code', code: '-- synthetic old source' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  state.set('part', { id: 'code', type: 'code', code: '-- synthetic new source' }); await tick()
  pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Copy code' })).toHaveTextContent('Copy')
  expect(target).not.toHaveTextContent('Copied')
})

test.each(['part', 'message'] as const)('identical text on a different %s cannot inherit acknowledgement', async (scope) => {
  const pending = deferred(); clipboard(vi.fn().mockReturnValue(pending.promise))
  const state = fixture({ id: 'code', type: 'code', code: 'same bytes' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  if (scope === 'part') state.set('part', { id: 'other', type: 'code', code: 'same bytes' })
  else state.set('message', 'message-2')
  await tick(); pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Copy code' })).not.toBeDisabled()
})

test('a pending source that changes away and back is still retired', async () => {
  const pending = deferred(); clipboard(vi.fn().mockReturnValue(pending.promise))
  const state = fixture({ id: 'code', type: 'code', code: 'original' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  state.set('part', { id: 'code', type: 'code', code: 'other' }); await tick()
  state.set('part', { id: 'code', type: 'code', code: 'original' }); await tick()
  pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Copy code' })).toHaveTextContent('Copy')
})

test('duplicates are excluded; success expires and rejected copies can be retried', async () => {
  vi.useFakeTimers()
  const pending = deferred(), write = clipboard(vi.fn().mockReturnValueOnce(pending.promise).mockRejectedValueOnce(new Error('denied')).mockResolvedValue(undefined))
  fixture({ id: 'code', type: 'code', code: 'exact\n  bytes' })
  const button = getByRole(target, 'button', { name: 'Copy code' })
  await fireEvent.click(button); await fireEvent.click(button)
  expect(write).toHaveBeenCalledTimes(1); expect(write).toHaveBeenCalledWith('exact\n  bytes'); expect(button).toBeDisabled()
  pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Code copied' })).not.toBeDisabled()
  await vi.advanceTimersByTimeAsync(1500); await tick()
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' })); await tick()
  expect(getByRole(target, 'status')).toHaveTextContent('Copy failed. Try again.')
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' })); await tick()
  expect(getByRole(target, 'button', { name: 'Code copied' })).toBeInTheDocument()
})

test('metadata-only streaming updates preserve the source acknowledgement', async () => {
  const write = clipboard(); const state = fixture({ id: 'code', type: 'code', code: 'exact source', status: 'streaming' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' })); await tick()
  state.set('part', { id: 'code', type: 'code', code: 'exact source', status: 'complete', language: 'lua' }); await tick()
  expect(getByRole(target, 'button', { name: 'Code copied' })).toBeInTheDocument()
  expect(write).toHaveBeenCalledTimes(1)
})

test.each(['resolve', 'reject'] as const)('destroyed pending copy cannot install a completion timer (%s)', async (finish) => {
  const pending = deferred(); clipboard(vi.fn().mockReturnValue(pending.promise))
  fixture({ id: 'code', type: 'code', code: 'source' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  await unmount(mounted!); mounted = null
  const timer = vi.spyOn(globalThis, 'setTimeout')
  if (finish === 'resolve') pending.resolve(); else pending.reject(new Error('denied'))
  await pending.promise.catch(() => {}); await tick()
  expect(timer).not.toHaveBeenCalled()
})

test('a retired failure cannot clear a newer success', async () => {
  const old = deferred(), fresh = deferred()
  clipboard(vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise))
  const state = fixture({ id: 'code', type: 'code', code: 'old' })
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  state.set('part', { id: 'code', type: 'code', code: 'fresh' }); await tick()
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy code' }))
  fresh.resolve(); await fresh.promise; await tick()
  old.reject(new Error('old denied')); await old.promise.catch(() => {}); await tick()
  expect(getByRole(target, 'button', { name: 'Code copied' })).toBeInTheDocument()
  expect(queryByRole(target, 'status')).toBeNull()
})

test('reasoning copy requires explicit opt-in and keeps exact plain text', async () => {
  const write = clipboard()
  const part = { id: 'reasoning', type: 'reasoning' as const, text: 'Line one\n  <b>literal</b>', defaultExpanded: true }
  const state = fixture(part)
  expect(queryByRole(target, 'button', { name: 'Copy reasoning' })).toBeNull()
  expect(target.querySelector('b')).toBeNull()
  state.set('part', { ...part, copyable: true, copyLabel: 'Copy thought process' }); await tick()
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy thought process' }))
  expect(write).toHaveBeenCalledWith(part.text)
  expect(target.querySelector('details')).toHaveAttribute('open')
})

test('disabling reasoning copy retires a pending acknowledgement', async () => {
  const pending = deferred(); clipboard(vi.fn().mockReturnValue(pending.promise))
  const part = { id: 'reasoning', type: 'reasoning' as const, text: 'text', defaultExpanded: true, copyable: true }
  const state = fixture(part)
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy reasoning' }))
  state.set('part', { ...part, copyable: false }); await tick()
  pending.resolve(); await pending.promise; await tick()
  state.set('part', part); await tick()
  expect(getByRole(target, 'button', { name: 'Copy reasoning' })).toHaveTextContent('Copy')
})

test('public reasoning wrapper retains manual disclosure across streaming text and default changes', async () => {
  const state = new SvelteMap([['text', 'initial'], ['status', 'streaming']])
  target = document.createElement('div'); document.body.append(target)
  mounted = mount(ChatReasoning, { target, props: { get part() { return {
    id: 'reasoning', type: 'reasoning' as const, text: state.get('text')!, status: state.get('status') as 'streaming' | 'complete', defaultExpanded: true,
  } } } })
  const details = target.querySelector('details')!; details.open = false; await fireEvent(details, new Event('toggle')); await tick()
  state.set('text', 'continued'); state.set('status', 'complete'); await tick()
  expect(details.open).toBe(false)
})
