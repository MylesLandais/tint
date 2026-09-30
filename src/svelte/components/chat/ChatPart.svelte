<script lang="ts">
  import { untrack, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { AlertCircle, ArrowUpRight, FileText, Music2, RotateCcw, Wrench } from '@lucide/svelte'
  import {
    chatJsonPreview, chatReadableSize, renderChatMarkdown, safeHref, stripBidi,
    type ChatCustomPart, type ChatId, type ChatImageItem, type ChatMessageAction,
    type ChatMessageActionPayload, type ChatMessageData, type ChatMessagePart, type ChatToolApprovalPayload,
  } from '../../../core/chat'
  import HighlightedCode from '../code/HighlightedCode.svelte'
  import MediaPlayer from '../media/MediaPlayer.svelte'
  import ChatMediaLightbox from './ChatMediaLightbox.svelte'
  import type { ChatPartRenderer } from './types'

  type Part = ChatMessagePart<ChatCustomPart>
  let { part, message, renderPart, onAction, onToolApproval, onRetry,
    messageId, onDecision,
    speakingMessageId, speakGeneration, onSpeak, onClearSpeak, onRenderError,
    class: className, className: legacyClassName, ...rest }: Omit<HTMLAttributes<HTMLElement>, 'children' | 'part'> & {
      part: Part
      message?: ChatMessageData<ChatCustomPart>
      messageId?: ChatId
      renderPart?: ChatPartRenderer<ChatCustomPart>
      onAction?: (payload: ChatMessageActionPayload) => void
      onToolApproval?: (payload: ChatToolApprovalPayload) => void
      onRetry?: () => void
      onDecision?: (approved: boolean, reason?: string) => void
      speakingMessageId?: ChatId | null
      speakGeneration?: number
      onSpeak?: (messageId: ChatId) => void
      onClearSpeak?: (messageId: ChatId) => void
      onRenderError?: (error: Error) => void
      className?: string
    } = $props()
  let copied = $state(false)
  let reason = $state('')
  let lightboxIndex = $state<number | null>(null)
  let reasoningOpen = $state(untrack(() => part.type === 'reasoning' && Boolean(part.defaultExpanded)))
  let override = $derived.by((): Snippet | null | undefined => {
    if (!renderPart || !message) return undefined
    return renderPart(part, { message, isStreaming: message.status === 'streaming', onAction, onToolApproval })
  })

  function reportRenderError(cause: unknown) {
    const error = cause instanceof Error ? cause : new Error(String(cause))
    if (onRenderError) onRenderError(error)
    else console.error('[tint] A chat message part failed to render.', error)
  }

  function emit(action: ChatMessageAction, extra: Partial<ChatMessageActionPayload> = {}) {
    const id = message?.id ?? messageId
    if (id) onAction?.({ messageId: id, action, ...extra })
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); copied = true }
    catch { copied = false }
  }

  function preview(value: unknown) { return chatJsonPreview(value) }
  function humanize(status: string) {
    const label = status.replace(/[-_]+/g, ' ').trim().slice(0, 32)
    return label ? label[0]!.toUpperCase() + label.slice(1) : 'Unknown'
  }
  function decision(approved: boolean) {
    if (part.type !== 'approval') return
    const note = part.approval.allowReason && reason ? reason : undefined
    onDecision?.(approved, note)
    const id = message?.id ?? messageId
    if (id) onToolApproval?.({ messageId: id, partId: part.id, approvalId: part.approval.id, approved, reason: note })
  }
  function openImage(index: number, image: ChatImageItem) {
    lightboxIndex = index
    emit('image-open', { partId: part.id, imageId: image.id, imageIndex: index })
  }
</script>

<svelte:boundary onerror={reportRenderError}>
{#if override}
  {@render override()}
{:else if part.type === 'text'}
  {#if part.format === 'markdown'}
    <div {...rest} data-chat-part="markdown" data-status={part.status} class={['markdown min-w-0 break-words text-[0.9375rem] leading-7', className, legacyClassName]}>{@html renderChatMarkdown(part.text)}</div>
  {:else}
    <div {...rest} data-chat-part="text" data-status={part.status} class={['whitespace-pre-wrap text-[0.9375rem] leading-7', className, legacyClassName]}>{part.text}</div>
  {/if}
{:else if part.type === 'code'}
  <section {...rest} data-chat-part="code" data-status={part.status} class={['overflow-hidden rounded-xl border border-tint-code-border bg-tint-code text-tint-code-ink', className, legacyClassName]}>
    <header class="flex items-center justify-between border-b border-tint-code-border px-3 py-2 text-xs text-tint-code-muted">
      <span>{part.filename ?? part.language ?? 'Code'}</span>
      <button type="button" onclick={() => void copy(part.code)} aria-label={copied ? 'Code copied' : 'Copy code'} class="rounded px-2 py-1 hover:bg-tint-code-ink/10">{copied ? 'Copied' : 'Copy'}</button>
    </header>
    <pre class="overflow-x-auto p-4 text-[0.8125rem] leading-6"><HighlightedCode code={part.code} language={part.language} /></pre>
  </section>
{:else if part.type === 'image'}
  <figure {...rest} data-chat-part="image" data-status={part.status} class={['m-0 overflow-hidden rounded-xl border border-tint-border bg-tint-surface', className, legacyClassName]}>
    <button type="button" class="block w-full cursor-zoom-in p-0" aria-label={part.alt ? `Open image: ${stripBidi(part.alt)}` : 'Open image'}
      onclick={() => openImage(0, { id: part.id, src: part.src, alt: part.alt, width: part.width, height: part.height, href: part.href })}>
      <img src={part.src} alt={part.alt} width={part.width} height={part.height} loading="lazy" decoding="async" class="max-h-96 w-full object-contain" />
    </button>
  </figure>
  <ChatMediaLightbox open={lightboxIndex !== null} images={[{ id: part.id, src: part.src, alt: part.alt, width: part.width, height: part.height, href: part.href }]}
    index={lightboxIndex ?? 0} onClose={() => { lightboxIndex = null }} onIndexChange={() => undefined} />
{:else if part.type === 'images'}
  {@const stacked = part.layout === 'stack' && part.images.length > 1}
  <section {...rest} data-chat-part="images" data-status={part.status} data-count={part.images.length} data-chat-images-layout={stacked ? 'stack' : 'grid'} class={['min-w-0 space-y-2', className, legacyClassName]}>
    {#if part.caption}<p class="m-0 text-sm font-medium">{stripBidi(part.caption)}</p>{/if}
    {#if stacked}
      <button type="button" class="flex w-full items-center gap-4 rounded-xl border border-tint-border bg-tint-panel p-3 text-left" aria-label={`Open image stack: ${part.images.length} items`}
        onclick={() => { if (part.images[0]) openImage(0, part.images[0]) }}>
        <span class="relative ml-2 block h-24 w-28 shrink-0" aria-hidden="true">
          {#each part.images.slice(0, 3) as image, index (image.id)}
            <img src={image.src} alt={image.alt} class="absolute inset-y-0 h-24 w-20 rounded-lg border-2 border-tint-panel object-cover shadow-md" style:left={`${index * 12}px`} style:transform={`rotate(${index === 0 ? -6 : index === 1 ? 3 : 0}deg)`} />
          {/each}
        </span>
        <span><strong class="block text-sm">Image stack</strong><small class="text-xs text-tint-muted">{part.images.length} items · Open lightbox</small></span>
      </button>
    {:else}
      <div class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl border border-tint-border bg-tint-border">
        {#each part.images as image, index (image.id)}
          <button type="button" class={['relative block aspect-square overflow-hidden bg-tint-surface p-0', part.images.length === 3 && index === 2 && 'col-span-2 aspect-[2/1]']}
            aria-label={image.alt ? `Open image ${index + 1}: ${stripBidi(image.alt)}` : `Open image ${index + 1}`}
            onclick={() => openImage(index, image)}>
            <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" class="size-full object-cover" />
          </button>
        {/each}
      </div>
    {/if}
    {#if part.actions?.length}
      <div data-chat-images-actions="" class="flex flex-wrap gap-2">
        {#each part.actions as action (action.id)}
          <button type="button" class="rounded-lg border border-tint-border bg-tint-panel px-2.5 py-1.5 text-xs font-medium" onclick={() => emit('image-action', { actionId: action.id, partId: part.id, imageId: action.imageId })}>{stripBidi(action.label)}</button>
        {/each}
      </div>
    {/if}
  </section>
  <ChatMediaLightbox open={lightboxIndex !== null && part.images.length > 0} images={part.images} index={lightboxIndex ?? 0} caption={part.caption}
    onClose={() => { lightboxIndex = null }} onIndexChange={(index) => { lightboxIndex = index }} />
{:else if part.type === 'file'}
  {@const attachment = part.attachment}
  {@const previewUrl = attachment.mediaType.startsWith('image/') ? attachment.previewUrl ?? attachment.url : undefined}
  <article {...rest} data-chat-part="file" data-status={attachment.status ?? part.status} class={['min-w-0 rounded-xl border border-tint-border bg-tint-panel p-3', className, legacyClassName]}>
    <div class="flex items-center gap-3">
      {#if previewUrl}<img src={previewUrl} alt="" class="size-9 shrink-0 rounded-lg object-cover" />{:else}<FileText size={20} class="text-tint-muted" />{/if}
      <div class="min-w-0 flex-1"><div class="truncate text-sm font-medium">{stripBidi(attachment.name)}</div><div class="text-xs text-tint-muted">{[chatReadableSize(attachment.size), attachment.status ? humanize(attachment.status) : undefined].filter(Boolean).join(' · ')}</div></div>
      {#if previewUrl && attachment.status !== 'uploading'}<button type="button" aria-label={`Open image: ${stripBidi(attachment.name)}`} onclick={() => openImage(0, { id: attachment.id, src: attachment.url ?? previewUrl, alt: attachment.name })}>Open</button>{/if}
    </div>
    {#if attachment.status === 'uploading'}<div role="progressbar" aria-label={`Uploading ${stripBidi(attachment.name)}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={attachment.uploadProgress ?? 0} class="mt-2 h-1.5 rounded-full bg-tint-surface"><span class="block h-full rounded-full bg-tint-accent" style:width={`${attachment.uploadProgress ?? 0}%`}></span></div>{/if}
    {#if attachment.error}<p role="alert" class="mt-1 text-xs text-tint-danger-ink">{attachment.error}</p>{/if}
  </article>
  {#if previewUrl}<ChatMediaLightbox open={lightboxIndex !== null} images={[{ id: attachment.id, src: attachment.url ?? previewUrl, alt: stripBidi(attachment.name), href: attachment.url }]}
    index={0} onClose={() => { lightboxIndex = null }} onIndexChange={() => undefined} />{/if}
{:else if part.type === 'audio'}
  <section {...rest} data-chat-part="audio" data-status={part.status} class={['rounded-xl border border-tint-border bg-tint-panel p-3', className, legacyClassName]}>
    <div class="mb-2 flex items-center gap-2 text-xs font-medium text-tint-muted"><Music2 size={16} />Audio</div>
    <MediaPlayer kind="audio" src={part.src} label={part.title ?? 'audio message'} title={part.title} artist={part.artist} artwork={part.artwork}
      artworkAlt={part.artworkAlt} duration={part.duration} waveform={part.waveform}
      playing={message && speakingMessageId !== undefined ? speakingMessageId === message.id : undefined}
      playbackNonce={message && speakingMessageId === message.id ? speakGeneration : undefined}
      onPlay={() => { if (message) onSpeak?.(message.id) }}
      onPause={() => { if (message && speakingMessageId === message.id) onClearSpeak?.(message.id) }}
      onEnded={() => { if (message) onClearSpeak?.(message.id) }} />
    {#if part.transcript}<details class="mt-2 text-sm"><summary class="cursor-pointer text-xs font-medium">Transcript</summary><p class="mt-2 text-tint-muted">{part.transcript}</p></details>{/if}
  </section>
{:else if part.type === 'sources'}
  <section {...rest} data-chat-part="sources" data-status={part.status} class={['space-y-2', className, legacyClassName]}>
    <h4 class="text-xs font-semibold uppercase text-tint-muted">Sources</h4>
    <div class="grid gap-2 sm:grid-cols-2">
      {#each part.sources as source, index (source.id)}
        {@const href = safeHref(source.url)}
        {#if href}<a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
          class="flex items-start gap-2 rounded-lg border border-tint-border bg-tint-panel p-2.5"><span class="text-xs text-tint-accent">{index + 1}</span><span class="min-w-0"><strong class="block truncate text-xs">{stripBidi(source.title)}</strong>{#if source.description}<small class="block text-[0.6875rem] text-tint-muted">{source.description}</small>{/if}</span><ArrowUpRight size={14} /></a>
        {:else}<div class="flex items-start gap-2 rounded-lg border border-tint-border bg-tint-panel p-2.5"><span>{index + 1}</span><span><strong class="block text-xs">{stripBidi(source.title)}</strong>{source.description}</span></div>{/if}
      {/each}
    </div>
  </section>
{:else if part.type === 'reasoning'}
  <details {...rest} data-chat-part="reasoning" data-status={part.status} open={reasoningOpen} ontoggle={(event) => { reasoningOpen = event.currentTarget.open }} class={['rounded-xl border border-tint-border bg-tint-surface', className, legacyClassName]}>
    <summary class="cursor-pointer px-3 py-2.5 text-xs font-medium text-tint-muted">{part.title ?? (part.status === 'pending' || part.status === 'streaming' ? 'Thinking' : 'Reasoning')}{part.durationMs ? ` · ${(part.durationMs / 1000).toFixed(1)}s` : ''}</summary>
    <div class="border-t border-tint-border px-3 py-3 text-sm leading-6 text-tint-muted">{part.text}</div>
  </details>
{:else if part.type === 'tool'}
  <details {...rest} data-chat-part="tool" data-status={part.tool.status} class={['overflow-hidden rounded-xl border border-tint-border bg-tint-panel', className, legacyClassName]}>
    <summary class="flex cursor-pointer items-center gap-3 p-3"><Wrench size={18} /><span class="min-w-0 flex-1"><strong class="block truncate text-sm">{part.tool.title ?? part.tool.name}</strong>{#if part.tool.summary}<small class="block truncate text-xs text-tint-muted">{part.tool.summary}</small>{/if}</span><span class="text-xs font-medium">{humanize(part.tool.status)}</span></summary>
    {#if part.tool.input !== undefined || part.tool.output !== undefined || part.tool.error}
      <div class="space-y-3 border-t border-tint-border bg-tint-surface p-3">
        {#if part.tool.input !== undefined}{@const result = preview(part.tool.input)}<div><h5>Input</h5><pre>{result.text}</pre>{#if result.truncated}<small>Showing the first 8,000 of {result.total} characters.</small>{/if}</div>{/if}
        {#if part.tool.output !== undefined}{@const result = preview(part.tool.output)}<div><h5>Output</h5><pre>{result.text}</pre>{#if result.truncated}<small>Showing the first 8,000 of {result.total} characters.</small>{/if}</div>{/if}
        {#if part.tool.error}<p class="text-xs text-tint-danger-ink">{part.tool.error}</p>{/if}
      </div>
    {/if}
  </details>
{:else if part.type === 'approval'}
  <section {...rest} data-chat-part="approval" data-status={part.approval.status} class={['rounded-xl border border-tint-warning/35 bg-tint-warning-soft p-4', className, legacyClassName]}>
    <h4 class="m-0 text-sm font-semibold text-tint-warning-ink">{part.approval.title}</h4>
    {#if part.approval.description}<p class="mt-1 text-sm leading-6 text-tint-warning-ink">{part.approval.description}</p>{/if}
    {#if part.approval.status === 'pending'}
      {#if part.approval.allowReason}<label class="mt-3 block text-xs font-medium text-tint-warning-ink">Optional note<textarea rows="2" value={reason} oninput={(event) => { reason = event.currentTarget.value }} class="mt-1.5 w-full rounded-lg border border-tint-warning/35 bg-tint-panel px-3 py-2 text-sm text-tint-ink"></textarea></label>{/if}
      <div class="mt-3 flex justify-end gap-2"><button type="button" onclick={() => decision(false)} class="rounded-lg border border-tint-warning/45 bg-tint-panel px-3 py-2 text-xs font-semibold">{part.approval.denyLabel ?? 'Deny'}</button><button type="button" onclick={() => decision(true)} class="rounded-lg bg-tint-accent px-3 py-2 text-xs font-semibold text-tint-on-accent">{part.approval.approveLabel ?? 'Approve'}</button></div>
    {:else}<p class="mt-3 text-xs font-medium text-tint-warning-ink">{part.approval.status === 'approved' ? 'Approved' : 'Denied'}</p>{/if}
  </section>
{:else if part.type === 'artifact'}
  {@const result = preview(part.data)}
  <section {...rest} data-chat-part="artifact" data-status={part.status} class={['overflow-hidden rounded-xl border border-tint-border bg-tint-panel', className, legacyClassName]}>
    <header class="border-b border-tint-border px-3 py-2.5"><h4 class="m-0 truncate text-sm font-medium">{part.title}</h4><p class="m-0 text-xs text-tint-muted">{part.kind}</p></header>
    {#if part.description}<p class="px-3 pt-3 text-sm text-tint-muted">{part.description}</p>{/if}
    <pre class="m-3 overflow-x-auto rounded-lg bg-tint-surface p-3 text-xs">{result.text}</pre>{#if result.truncated}<small class="mx-3">Showing the first 8,000 of {result.total} characters.</small>{/if}
  </section>
{:else if part.type === 'error'}
  <section {...rest} role="alert" data-chat-part="error" data-status={part.status} class={['flex items-start gap-3 rounded-xl border border-tint-danger/35 bg-tint-danger-soft p-3 text-tint-danger-ink', className, legacyClassName]}>
    <AlertCircle size={18} /><div class="min-w-0 flex-1"><p class="m-0 text-sm">{part.message}</p>{#if part.code}<p class="mt-1 text-xs">{part.code}</p>{/if}</div>
    {#if part.recoverable && onRetry}<button type="button" onclick={onRetry} class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"><RotateCcw size={14} />Retry</button>{/if}
  </section>
{:else}
  <div {...rest} role="alert" data-chat-part="unsupported" class={['rounded-lg border border-dashed border-tint-border bg-tint-surface p-3 text-sm text-tint-muted', className, legacyClassName]}>
    {part.type === 'custom' ? `This message contains a “${humanize(part.kind)}” part this version cannot display.` : 'This message contains a part this version cannot display.'}
    {#if part.type === 'custom'}<pre>{preview(part.data).text}</pre>{/if}
  </div>
{/if}
{#snippet failed()}
  <div role="alert" data-chat-part="render-error" class="flex items-center gap-2 rounded-lg border border-tint-danger/35 bg-tint-danger-soft p-3 text-sm text-tint-danger-ink">
    <AlertCircle size={18} />This message part could not be displayed.
  </div>
{/snippet}
</svelte:boundary>

<style>
  .markdown :global(p) { margin: .5rem 0; }
  .markdown :global(p:first-child) { margin-top: 0; }
  .markdown :global(p:last-child) { margin-bottom: 0; }
  .markdown :global(a) { color: var(--tint-accent); text-decoration: underline; }
  .markdown :global(blockquote) { padding-left: 1rem; border-left: 2px solid var(--tint-border); }
  .markdown :global(code) { padding: .125rem .25rem; border-radius: .25rem; background: var(--tint-surface); }
  .markdown :global(pre) { overflow-x: auto; }
  .markdown :global(table) { width: 100%; margin: .75rem 0; border-collapse: collapse; }
  .markdown :global(th), .markdown :global(td) { padding: .5rem; border: 1px solid var(--tint-border); }
  .markdown :global(ul), .markdown :global(ol) { margin: .5rem 0; padding-left: 1.25rem; }
  pre { max-width: 100%; overflow-x: auto; overflow-wrap: anywhere; white-space: pre-wrap; }
  h5 { margin: 0 0 .375rem; color: var(--tint-muted); font-size: .6875rem; text-transform: uppercase; }
  button:focus-visible, summary:focus-visible, a:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
