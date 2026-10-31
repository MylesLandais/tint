<script lang="ts">
  import { ArrowUp, Paperclip, Square, X } from '@lucide/svelte'
  import { chatSubmitPayload, isSendableAttachment, stripBidi, type ChatImageItem } from '../../../core/chat'
  import ChatComposerInput from './ChatComposerInput.svelte'
  import ChatActionButton from './ChatActionButton.svelte'
  import ChatMediaLightbox from './ChatMediaLightbox.svelte'
  import type { ChatComposerProps } from './types'

  let {
    value, attachments = [], attachmentPresentation = 'chips', state: composerState = 'idle', error,
    placeholder = 'Write a message…', inputLabel = placeholder,
    submitLabel = 'Send message', submitDisabled = false, submitDisabledReason,
    stopLabel = 'Stop response', maxLength,
    submitOnEnter = true, accept, multiple = true, metadata, appearance = 'standard', controls, actions, inputRef,
    onInputKeydown, inputListboxId, inputExpanded = true, inputActiveOptionId,
    onValueChange, onSubmit, onStop, onAttachmentAdd, onAttachmentRemove,
    class: className, className: legacyClassName, ...rest
  }: ChatComposerProps = $props()
  const errorId = $props.id()
  let fileInput: HTMLInputElement | null = null
  let textarea: HTMLTextAreaElement | null = null
  let dragging = $state(false)
  let previewedAttachmentId = $state<string | null>(null)
  let wasSubmitting = false
  let readonly = $derived(composerState === 'disabled' || composerState === 'submitting')
  let streaming = $derived(composerState === 'streaming')
  let sendable = $derived(attachments.filter(isSendableAttachment))
  let canSubmit = $derived(Boolean(value.trim() || sendable.length) && !readonly && !streaming && !submitDisabled)
  let referenceImages = $derived<ChatImageItem[]>(attachments.flatMap((attachment) => {
    const preview = attachment.mediaType.startsWith('image/') ? attachment.previewUrl ?? attachment.url : undefined
    return preview ? [{ id: attachment.id, src: attachment.url ?? preview, alt: stripBidi(attachment.name) }] : []
  }))
  let previewIndex = $derived(referenceImages.findIndex((image) => image.id === previewedAttachmentId))

  $effect(() => {
    // The host can remove or replace attachments while a preview is open.
    if (previewedAttachmentId !== null && (attachmentPresentation !== 'cards' || previewIndex < 0)) previewedAttachmentId = null
  })

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

<form {...rest} data-chat-composer="" data-state={composerState} data-appearance={appearance} data-attachment-presentation={attachmentPresentation} onsubmit={submit}
  ondragover={(event) => { if (onAttachmentAdd) { event.preventDefault(); dragging = true } }}
  ondragleave={leave} ondrop={drop}
  class={['relative border-t border-tint-border bg-tint-panel/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4', className, legacyClassName]}>
  <div class={['mx-auto max-w-[var(--tint-chat-measure,48rem)] rounded border border-[color-mix(in_srgb,var(--tint-muted)_70%,var(--tint-panel))] bg-tint-panel p-2 shadow-sm transition-[border-color,box-shadow] focus-within:border-tint-accent focus-within:shadow-[0_0_0_3px_var(--tint-accent-soft)]', dragging && 'border-tint-accent bg-tint-accent-soft', composerState === 'error' && 'border-tint-danger/60']}>
    {#if attachments.length}
      <div data-chat-composer-attachments="" data-presentation={attachmentPresentation} class="mb-2 flex flex-wrap gap-2">
        {#each attachments as attachment (attachment.id)}
          {@const preview = attachment.mediaType.startsWith('image/') ? attachment.previewUrl ?? attachment.url : undefined}
          {#if attachmentPresentation === 'cards' && preview}
            {@const referenceNumber = referenceImages.findIndex((image) => image.id === attachment.id) + 1}
            <div data-attachment-id={attachment.id} data-chat-attachment-card="">
              <button type="button" data-chat-attachment-preview="" aria-haspopup="dialog"
                aria-label={`Preview reference ${referenceNumber}: ${stripBidi(attachment.name)}`}
                onclick={() => { previewedAttachmentId = attachment.id }}>
                <img src={preview} alt="" />
              </button>
              <div class="attachment-card-meta">
                <div class="attachment-card-label">
                  <span class="text-xs font-semibold">Reference {referenceNumber}</span>
                  <span class="attachment-card-name" title={stripBidi(attachment.name)}>{stripBidi(attachment.name)}</span>
                </div>
                {#if onAttachmentRemove}<ChatActionButton type="button" label={`Remove ${stripBidi(attachment.name)}`}
                  onclick={() => onAttachmentRemove?.(attachment.id)} class="text-tint-muted hover:bg-tint-panel hover:text-tint-ink"><X size={16} /></ChatActionButton>{/if}
              </div>
              {#if attachment.status === 'uploading'}<span class="attachment-card-status" role="status">Uploading {attachment.uploadProgress ?? 0}%</span>{/if}
            </div>
          {:else}
            <div data-attachment-id={attachment.id} class="flex max-w-full items-center gap-2 rounded-lg border border-tint-border bg-tint-surface px-2.5 py-2">
              {#if attachment.status === 'uploading'}<span role="status" aria-label="Uploading" class="animate-spin motion-reduce:animate-none text-tint-accent">◌</span>
              {:else if preview}<img src={preview} alt="" class="size-6 shrink-0 rounded object-cover" />
              {:else}<Paperclip size={16} class="shrink-0 text-tint-muted" />{/if}
              <span class="max-w-48 truncate text-xs font-medium">{stripBidi(attachment.name)}</span>
              {#if attachment.status === 'uploading'}<span class="text-[0.6875rem] text-tint-muted">{attachment.uploadProgress ?? 0}%</span>{/if}
              {#if onAttachmentRemove}<button type="button" onclick={() => onAttachmentRemove?.(attachment.id)} aria-label={`Remove ${stripBidi(attachment.name)}`}
                class="-mr-1 rounded p-1.5 text-tint-muted hover:bg-tint-panel hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tint-accent"><X size={16} /></button>{/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
    <div data-chat-composer-input="" class="px-2 pt-1">
      <ChatComposerInput {value} {onValueChange} {onInputKeydown} submitOnEnter={submitOnEnter && !readonly} inputRef={(node) => { textarea = node; inputRef?.(node) }}
        role={inputListboxId ? 'combobox' : undefined} aria-autocomplete={inputListboxId ? 'list' : undefined}
        aria-expanded={inputListboxId ? inputExpanded : undefined} aria-controls={inputListboxId} aria-activedescendant={inputActiveOptionId}
        aria-label={inputLabel} {placeholder} maxlength={maxLength} {readonly} aria-disabled={readonly || undefined} aria-describedby={error ? errorId : undefined} />
    </div>
    <div data-chat-composer-footer="" class="mt-1 flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-center gap-1">
        {#if controls}<div data-chat-composer-controls="">{@render controls()}</div>{/if}
        {#if onAttachmentAdd}
          <input use:registerFileInput type="file" {accept} {multiple} onchange={attachFromPicker} class="sr-only" tabindex="-1" />
          <ChatActionButton label="Attach files" onclick={() => fileInput?.click()} disabled={readonly || streaming} class="text-tint-muted hover:bg-tint-surface hover:text-tint-ink"><Paperclip size={18} /></ChatActionButton>
        {/if}
        {@render actions?.()}
        <span class="hidden min-w-0 truncate text-[0.6875rem] text-tint-muted sm:inline">{dragging ? 'Drop files to attach' : 'Shift + Enter for a new line'}</span>
      </div>
      {#if streaming && onStop}
        <ChatActionButton label={stopLabel} onclick={onStop} class="bg-tint-ink text-tint-bg hover:bg-tint-muted"><Square size={16} fill="currentColor" /></ChatActionButton>
      {:else}
        <ChatActionButton type="submit" label={submitLabel} title={submitDisabled ? submitDisabledReason : submitLabel} disabled={!canSubmit} pending={composerState === 'submitting'} class="bg-tint-accent text-tint-on-accent hover:bg-tint-accent-hover"><ArrowUp size={18} /></ChatActionButton>
      {/if}
    </div>
  </div>
  {#if error}<p id={errorId} role="alert" class="mx-auto mt-2 max-w-[var(--tint-chat-measure,48rem)] px-2 text-xs text-tint-danger-ink">{error}</p>{/if}
</form>

{#if attachmentPresentation === 'cards'}
  <ChatMediaLightbox open={previewIndex >= 0} images={referenceImages} index={Math.max(0, previewIndex)}
    onClose={() => { previewedAttachmentId = null }}
    onIndexChange={(index) => { previewedAttachmentId = referenceImages[index]?.id ?? null }} />
{/if}

<style>
  [data-chat-composer-attachments][data-presentation='cards'] { max-width: 100%; flex-wrap: nowrap; align-items: flex-start; overflow-x: auto; overscroll-behavior-inline: contain; padding-bottom: .375rem; }
  [data-chat-composer-attachments][data-presentation='cards'] > [data-attachment-id] { flex-shrink: 0; }
  [data-chat-attachment-card] { flex: 0 0 9rem; max-width: 100%; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); }
  [data-chat-attachment-preview] { display: block; width: 100%; height: 7rem; border: 0; padding: 0; background: var(--tint-panel); cursor: pointer; }
  [data-chat-attachment-preview]:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  [data-chat-attachment-preview] img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .attachment-card-meta { display: flex; align-items: center; gap: .125rem; padding: .25rem .25rem .25rem .5rem; }
  .attachment-card-label { display: grid; flex: 1; min-width: 0; gap: .125rem; }
  .attachment-card-name { overflow: hidden; color: var(--tint-muted); font-size: .6875rem; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-card-status { display: block; padding: 0 .5rem .5rem; color: var(--tint-muted); font-size: .6875rem; }
  [data-chat-composer-controls] { display: flex; min-width: 0; align-items: center; gap: .35rem; }
  [data-appearance='agent'] > div:first-child { border-radius: 1rem; padding: .75rem; background: var(--tint-panel); }
  [data-appearance='agent'] [data-chat-composer-input] { padding: .25rem .35rem .75rem; }
  [data-appearance='agent'] :global(textarea) { min-height: 5rem; font-size: .9375rem; line-height: 1.65; }
  [data-appearance='agent'] [data-chat-composer-footer] { border-top: 1px solid var(--tint-border); padding-top: .65rem; gap: .5rem; }
  @media (max-width: 600px) {
    [data-chat-composer-controls] { max-width: 55%; }
    [data-appearance='agent'] [data-chat-composer-footer] > div { flex-wrap: wrap; }
  }
</style>
