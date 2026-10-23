import { mount, unmount, tick } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'
import { fireEvent, getByRole } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import type { ChatMessageData } from '../../../core/chat'
import ChatMessage from './ChatMessage.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(yes => { resolve = yes })
  return { promise, resolve }
}
function message(id = 'message-1', text = 'original'): ChatMessageData {
  return { id, actor: { id: 'assistant', name: 'Assistant', kind: 'assistant' }, createdAt: 0, status: 'complete',
    parts: [{ id: 'text', type: 'text', text }, { id: 'reasoning', type: 'reasoning', text: 'Excluded reasoning', copyable: true }] }
}
function fixture(write: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('navigator', { clipboard: { writeText: write } })
  const state = new SvelteMap([['message', message()]])
  const onAction = vi.fn()
  target = document.createElement('div'); document.body.append(target)
  mounted = mount(ChatMessage, { target, props: { get message() { return state.get('message')! }, onAction } })
  return { state, onAction }
}
afterEach(async () => {
  if (mounted) await unmount(mounted)
  mounted = null; document.body.innerHTML = ''; vi.unstubAllGlobals()
})

test.each(['identity', 'source'] as const)('message copy cannot acknowledge a replacement %s or emit its action', async (change) => {
  const pending = deferred(), { state, onAction } = fixture(vi.fn().mockReturnValue(pending.promise))
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy message' }))
  state.set('message', change === 'identity' ? message('message-2') : message('message-1', 'new text')); await tick()
  pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Copy message' })).toBeInTheDocument()
  expect(onAction).not.toHaveBeenCalled()
})

test('retired message copy cannot call the host after teardown', async () => {
  const pending = deferred(), { onAction } = fixture(vi.fn().mockReturnValue(pending.promise))
  await fireEvent.click(getByRole(target, 'button', { name: 'Copy message' }))
  await unmount(mounted!); mounted = null
  pending.resolve(); await pending.promise; await tick()
  expect(onAction).not.toHaveBeenCalled()
})

test('one current message copy acknowledges its captured ID and excludes reasoning', async () => {
  const pending = deferred(), write = vi.fn().mockReturnValue(pending.promise), { onAction } = fixture(write)
  const button = getByRole(target, 'button', { name: 'Copy message' })
  await fireEvent.click(button); await fireEvent.click(button)
  expect(write).toHaveBeenCalledTimes(1); expect(write).toHaveBeenCalledWith('original')
  pending.resolve(); await pending.promise; await tick()
  expect(getByRole(target, 'button', { name: 'Message copied' })).toBeInTheDocument()
  expect(onAction).toHaveBeenCalledExactlyOnceWith({ messageId: 'message-1', action: 'copy' })
})
