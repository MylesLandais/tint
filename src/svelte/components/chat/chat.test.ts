import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChatCustomPart, ChatMessageData, ChatPreferenceOption } from '../../../core/chat'
import ChatComposer from './ChatComposer.svelte'
import ChatMessage from './ChatMessage.svelte'
import ChatMessageAlternatives from './ChatMessageAlternatives.svelte'
import ChatMessageEditor from './ChatMessageEditor.svelte'
import ChatMessageList from './ChatMessageList.svelte'
import ChatPart from './ChatPart.svelte'
import ChatPreference from './ChatPreference.svelte'

const assistant = { id: 'assistant', name: 'Assistant', kind: 'assistant' } as const
const human = { id: 'me', name: 'Alex', kind: 'human' } as const
function message(id: string, overrides: Partial<ChatMessageData> = {}): ChatMessageData {
  return { id, actor: assistant, createdAt: '2026-08-02T15:00:00Z', status: 'complete',
    parts: [{ id: `${id}-text`, type: 'text', text: id }], ...overrides }
}

afterEach(() => vi.restoreAllMocks())

describe('Svelte chat composer', () => {
  it('submits a trimmed host payload on Enter, but not during IME composition', async () => {
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    render(ChatComposer, { value: '  Hello Tint  ', onValueChange, onSubmit, metadata: { conversationId: 'c-1' } })
    const input = screen.getByRole('textbox')
    await fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true })
    expect(onSubmit).not.toHaveBeenCalled()
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith({ text: 'Hello Tint', attachments: [], metadata: { conversationId: 'c-1' } })
  })

  it('preserves focus during submission and excludes in-flight uploads', async () => {
    const onSubmit = vi.fn()
    const base = { value: '', onValueChange: vi.fn(), onSubmit,
      attachments: [
        { id: 'ready', name: 'ready.pdf', mediaType: 'application/pdf', status: 'ready' as const },
        { id: 'busy', name: 'busy.pdf', mediaType: 'application/pdf', status: 'uploading' as const },
      ] }
    const view = render(ChatComposer, base)
    const input = screen.getByRole('textbox')
    input.focus()
    await fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(onSubmit).toHaveBeenCalledWith({ text: '', attachments: [base.attachments[0]], metadata: undefined })
    await view.rerender({ ...base, state: 'submitting' })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveAttribute('aria-disabled', 'true')
  })

  it('can hold submission while leaving the draft editable', async () => {
    const onSubmit = vi.fn()
    render(ChatComposer, { value: 'Keep this draft', onValueChange: vi.fn(), onSubmit,
      submitDisabled: true, submitDisabledReason: 'Model is preparing' })
    const input = screen.getByRole('textbox')
    const send = screen.getByRole('button', { name: 'Send message' })
    expect(input).not.toHaveAttribute('readonly')
    expect(send).toBeDisabled()
    expect(send).toHaveAttribute('title', 'Model is preparing')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('Svelte chat parts and message', () => {
  it('renders GFM and strips unsafe links and raw HTML', () => {
    const view = render(ChatPart, { part: { id: 'm', type: 'text', format: 'markdown',
      text: '**Safe** [go](https://example.com) [bad](javascript:alert%281%29) <script>oops</script>' } })
    expect(screen.getByText('Safe')).toHaveTextContent('Safe')
    expect(screen.getByRole('link', { name: 'go' })).toHaveAttribute('rel', 'noreferrer noopener')
    expect(view.container.querySelector('script')).toBeNull()
    expect(view.container.innerHTML).not.toContain('javascript:')
  })

  it('isolates a custom renderer failure to its part', () => {
    const onRenderError = vi.fn()
    render(ChatPart, { part: { id: 'p', type: 'text', text: 'fallback' }, message: message('m'),
      renderPart: () => { throw new Error('broken renderer') }, onRenderError })
    expect(screen.getByRole('alert')).toHaveTextContent('could not be displayed')
    expect(onRenderError).toHaveBeenCalledWith(expect.objectContaining({ message: 'broken renderer' }))
  })

  it('reports approval decisions with message and part IDs, then locks when host changes status', async () => {
    const onToolApproval = vi.fn()
    const part = { id: 'p', type: 'approval' as const, approval: { id: 'a', title: 'Run tool', status: 'pending' as const, allowReason: true } }
    const view = render(ChatPart, { part, messageId: 'm', onToolApproval })
    await fireEvent.input(screen.getByRole('textbox', { name: 'Optional note' }), { target: { value: 'Looks safe' } })
    await fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onToolApproval).toHaveBeenCalledWith({ messageId: 'm', partId: 'p', approvalId: 'a', approved: true, reason: 'Looks safe' })
    await view.rerender({ part: { ...part, approval: { ...part.approval, status: 'approved' } }, messageId: 'm', onToolApproval })
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()
  })

  it('keeps reasoning off the message clipboard and shows only one retry', async () => {
    const clipboard = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } })
    render(ChatMessage, { message: message('m', { status: 'error', parts: [
      { id: 'r', type: 'reasoning', text: 'Internal chain of thought.' },
      { id: 't', type: 'text', text: 'The answer is 42.' },
      { id: 'c', type: 'code', code: 'print(42)' },
      { id: 'e', type: 'error', message: 'Stream failed.', recoverable: true },
    ] }) })
    await fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))
    await waitFor(() => expect(clipboard).toHaveBeenCalledWith('The answer is 42.\n\nprint(42)'))
    expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(1)
  })
})

describe('Svelte chat list and preference', () => {
  it('navigates sparse saved alternatives with stable IDs', async () => {
    const onValueChange = vi.fn()
    const alternatives = [{ id: '0' }, { id: '2' }, { id: '3' }]
    const view = render(ChatMessageAlternatives, { alternatives, value: '2', onValueChange })
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3')
    await fireEvent.click(screen.getByRole('button', { name: 'Previous saved response' }))
    expect(onValueChange).toHaveBeenCalledWith('0')
    await view.rerender({ alternatives, value: '0', onValueChange })
    expect(screen.getByRole('button', { name: 'Previous saved response' })).toBeDisabled()
  })

  it('keeps a controlled edit draft and exposes its error', async () => {
    const onSave = vi.fn(), onCancel = vi.fn(), onValueChange = vi.fn()
    render(ChatMessageEditor, { value: 'My draft', error: 'The message changed', onSave, onCancel, onValueChange })
    const input = screen.getByRole('textbox', { name: 'Edit message' })
    expect(input).toHaveAccessibleDescription('The message changed')
    await fireEvent.input(input, { target: { value: 'My next draft' } })
    expect(onValueChange).toHaveBeenCalledWith('My next draft')
    await fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
    expect(onSave).toHaveBeenCalledOnce()
    await fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('renders host footer controls beside a message and keeps their click intent', async () => {
    const onInspect = vi.fn()
    const renderMessageFooter = (item: ChatMessageData<ChatCustomPart>) => createRawSnippet(() => ({
      render: () => `<button type="button" aria-label="Inspect ${item.id}">Inspect</button>`,
      setup(element) {
        const button = element instanceof HTMLButtonElement ? element : element.querySelector('button')!
        button.addEventListener('click', onInspect)
        return () => button.removeEventListener('click', onInspect)
      },
    }))
    render(ChatMessageList, { messages: [message('one')], renderMessageFooter })
    const footer = screen.getByRole('button', { name: 'Inspect one' })
    expect(footer.closest('footer')).toContainElement(screen.getByRole('button', { name: 'Copy message' }))
    await fireEvent.click(footer)
    expect(onInspect).toHaveBeenCalledOnce()
  })

  it('announces completed remote turns without speaking the live log or the reader’s own messages', async () => {
    const view = render(ChatMessageList, { messages: [message('one')], currentActorId: 'me' })
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'off')
    expect(view.container.querySelector('[aria-live="polite"]')).toHaveTextContent('Assistant finished responding')
    await view.rerender({ messages: [message('mine', { actor: human })], currentActorId: 'me' })
    expect(view.container.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  })

  it('moves focus between messages and leaves nested controls with Escape', async () => {
    render(ChatMessageList, { messages: [message('one'), message('two'), message('three')] })
    const items = screen.getByRole('log').querySelectorAll<HTMLElement>('[data-chat-message]')
    items[2]?.focus()
    await fireEvent.keyDown(items[2]!, { key: 'ArrowUp' })
    expect(items[1]).toHaveFocus()
    await fireEvent.keyDown(items[1]!, { key: 'Enter' })
    expect(items[1]!.querySelector('button')).toHaveFocus()
    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(items[1]).toHaveFocus()
  })

  it('leaves arrow keys inside a nested slider', async () => {
    const renderMessageFooter = () => createRawSnippet(() => ({
      render: () => '<div role="slider" tabindex="0" aria-label="Message volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>',
    }))
    render(ChatMessageList, { messages: [message('one'), message('two')], renderMessageFooter })
    const sliders = screen.getAllByRole('slider', { name: 'Message volume' })
    sliders[1]!.focus()
    await fireEvent.keyDown(sliders[1]!, { key: 'ArrowUp' })
    expect(sliders[1]).toHaveFocus()
  })

  it('chooses a preference with a radio, while nested Copy stays independent', async () => {
    const options: ChatPreferenceOption[] = [
      { id: 'a', label: 'First', parts: [{ id: 'a-code', type: 'code', code: 'one()' }] },
      { id: 'b', label: 'Second', parts: [{ id: 'b-text', type: 'text', text: 'Two' }] },
    ]
    const onSelect = vi.fn()
    const view = render(ChatPreference, { options, onSelect })
    const radios = screen.getAllByRole('radio')
    await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(onSelect).not.toHaveBeenCalled()
    radios[0]?.focus()
    await fireEvent.keyDown(radios[0]!, { key: 'ArrowRight' })
    expect(radios[1]).toHaveFocus()
    await fireEvent.keyDown(radios[1]!, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('b')
    await view.rerender({ options, onSelect, status: 'selected', selectedOptionId: 'b' })
    onSelect.mockClear()
    await fireEvent.click(radios[0]!)
    expect(onSelect).not.toHaveBeenCalled()
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })
})
