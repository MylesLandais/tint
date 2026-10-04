<script lang="ts">
  import { ArrowUp, Paperclip, Square, X } from '@lucide/svelte'
  import { chatSubmitPayload, isSendableAttachment, stripBidi } from '../../../core/chat'
  import ChatComposerInput from './ChatComposerInput.svelte'
  import ChatActionButton from './ChatActionButton.svelte'
  import type { ChatComposerProps } from './types'

  let {
    value, attachments = [], state: composerState = 'idle', error,
    placeholder = 'Write a message…', inputLabel = placeholder,
    submitLabel = 'Send message', submitDisabled = false, submitDisabledReason,
    stopLabel = 'Stop response', maxLength,
    submitOnEnter = true, accept, multiple = true, metadata, actions, inputRef,
    onInputKeydown, inputListboxId, inputActiveOptionId,
    onValueChange, onSubmit, onStop, onAttachmentAdd, onAttachmentRemove,
    class: className, className: legacyClassName, ...rest
  }: ChatComposerProps = $props()
  const errorId = $props.id()
  let fileInput: HTMLInputElement | null = null
  let textarea: HTMLTextAreaElement | null = null
  let dragging = $state(false)
  let wasSubmitting = false
  let readonly = $derived(composerState === 'disabled' || composerState === 'submitting')
  let streaming = $derived(composerState === 'streaming')
  let sendable = $derived(attachments.filter(isSendableAttachment))
  let canSubmit = $derived(Boolean(value.trim() || sendable.length) && !readonly && !streaming && !submitDisabled)

  $effect(() => {
    if (composerState === 'submitting') { wasSubmitting = true; return }
    if (wasSubmitting) {
      wasSubmitting = false
      if (composerState === 'idle' && document.activeElement === document.body) textarea?.focus()
    }
  })

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!canSubmit) return
    const payload = chatSubmitPayload(value, attachments, metadata)
    if (payload) onSubmit(payload)
  }

  function drop(event: DragEvent) {
    if (!onAttachmentAdd) return
    event.preventDefault()
    dragging = false
    if (event.dataTransfer?.files.length) onAttachmentAdd(Array.from(event.dataTransfer.files))
  }

  function leave(event: DragEvent) {
    const target = event.relatedTarget
    if (!(target instanceof Node) || !(event.currentTarget as HTMLFormElement | null)?.contains(target)) dragging = false
  }

  function attachFromPicker(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    if (input.files?.length) onAttachmentAdd?.(Array.from(input.files))
    input.value = ''
  }

  function registerFileInput(node: HTMLInputElement) {
    fileInput = node
    return { destroy: () => { fileInput = null } }
  }
</script>

<form {...rest} data-chat-composer="" data-state={composerState} onsubmit={submit}
  ondragover={(event) => { if (onAttachmentAdd) { event.preventDefault(); dragging = true } }}
  ondragleave={leave} ondrop={drop}
  class={['relative border-t border-tint-border bg-tint-panel/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4', className, legacyClassName]}>
  <div class={['mx-auto max-w-3xl rounded-2xl border border-tint-border bg-tint-panel p-2 shadow-sm transition-[border-color,box-shadow] focus-within:border-tint-accent focus-within:shadow-[0_0_0_3px_var(--tint-accent-soft)]', dragging && 'border-tint-accent bg-tint-accent-soft', composerState === 'error' && 'border-tint-danger/60']}>
    {#if attachments.length}
      <div data-chat-composer-attachments="" class="mb-2 flex flex-wrap gap-2">
        {#each attachments as attachment (attachment.id)}
          {@const preview = attachment.mediaType.startsWith('image/') ? attachment.previewUrl ?? attachment.url : undefined}
          <div data-attachment-id={attachment.id} class="flex max-w-full items-center gap-2 rounded-lg border border-tint-border bg-tint-surface px-2.5 py-2">
            {#if attachment.status === 'uploading'}<span role="status" aria-label="Uploading" class="animate-spin motion-reduce:animate-none text-tint-accent">◌</span>
            {:else if preview}<img src={preview} alt="" class="size-6 shrink-0 rounded object-cover" />
            {:else}<Paperclip size={16} class="shrink-0 text-tint-muted" />{/if}
            <span class="max-w-48 truncate text-xs font-medium">{stripBidi(attachment.name)}</span>
            {#if attachment.status === 'uploading'}<span class="text-[0.6875rem] text-tint-muted">{attachment.uploadProgress ?? 0}%</span>{/if}
            <button type="button" onclick={() => onAttachmentRemove?.(attachment.id)} aria-label={`Remove ${stripBidi(attachment.name)}`}
              class="-mr-1 rounded p-1.5 text-tint-muted hover:bg-tint-panel hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tint-accent"><X size={16} /></button>
          </div>
        {/each}
      </div>
    {/if}
    <div class="px-2 pt-1">
      <ChatComposerInput {value} {onValueChange} {onInputKeydown} submitOnEnter={submitOnEnter && !readonly} inputRef={(node) => { textarea = node; inputRef?.(node) }}
        role={inputListboxId ? 'combobox' : undefined} aria-autocomplete={inputListboxId ? 'list' : undefined}
        aria-expanded={inputListboxId ? true : undefined} aria-controls={inputListboxId} aria-activedescendant={inputActiveOptionId}
        aria-label={inputLabel} {placeholder} maxlength={maxLength} {readonly} aria-disabled={readonly || undefined} aria-describedby={error ? errorId : undefined} />
    </div>
    <div data-chat-composer-footer="" class="mt-1 flex items-center justify-between gap-3">
      <div class="flex items-center gap-1">
        {#if onAttachmentAdd}
          <input use:registerFileInput type="file" {accept} {multiple} onchange={attachFromPicker} class="sr-only" tabindex="-1" />
          <ChatActionButton label="Attach files" onclick={() => fileInput?.click()} disabled={readonly || streaming} class="text-tint-muted hover:bg-tint-surface hover:text-tint-ink"><Paperclip size={18} /></ChatActionButton>
        {/if}
        {@render actions?.()}
        <span class="hidden text-[0.6875rem] text-tint-muted sm:inline">{dragging ? 'Drop files to attach' : 'Shift + Enter for a new line'}</span>
      </div>
      {#if streaming && onStop}
        <ChatActionButton label={stopLabel} onclick={onStop} class="bg-tint-ink text-tint-bg hover:bg-tint-muted"><Square size={16} fill="currentColor" /></ChatActionButton>
      {:else}
        <ChatActionButton type="submit" label={submitLabel} title={submitDisabled ? submitDisabledReason : submitLabel} disabled={!canSubmit} pending={composerState === 'submitting'} class="bg-tint-accent text-tint-on-accent hover:bg-tint-accent-hover"><ArrowUp size={18} /></ChatActionButton>
      {/if}
    </div>
  </div>
  {#if error}<p id={errorId} role="alert" class="mx-auto mt-2 max-w-3xl px-2 text-xs text-tint-danger-ink">{error}</p>{/if}
</form>
