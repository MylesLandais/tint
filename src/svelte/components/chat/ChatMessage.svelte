<script lang="ts">
  import { untrack } from 'svelte'
  import { Copy, Reply, RotateCcw, Volume2 } from '@lucide/svelte'
  import { chatMessageText, chatTimestamp, replySnippet, stripBidi, type ChatCustomPart } from '../../../core/chat'
  import Avatar from '../identity/Avatar.svelte'
  import ChatPart from './ChatPart.svelte'
  import type { ChatMessageProps } from './types'

  let { message, replyToMessage, alignment = 'start', groupPosition = 'solo',
    showActor = true, showAvatar = true, renderPart, renderMessageFooter, onAction, onToolApproval,
    enableSpeak = false, speakingMessageId, speakGeneration, onSpeak, onClearSpeak,
    onRenderError, class: className, className: legacyClassName, ...rest
  }: ChatMessageProps<ChatCustomPart> = $props()
  let root: HTMLElement | null = null
  let copied = $state(false)
  let hasSpoken = $state(false)
  let actorName = $derived(stripBidi(message.actor.name))
  let timestamp = $derived(chatTimestamp(message.createdAt))
  let copyText = $derived(chatMessageText(message))
  let busy = $derived(message.status === 'sending' || message.status === 'streaming')
  let isSpeaking = $derived(speakingMessageId === message.id)
  let hasAudio = $derived(message.parts.some((part) => part.type === 'audio'))
  let canSpeak = $derived(enableSpeak && !busy && (hasAudio || copyText.trim().length > 0))
  let canRetry = $derived(message.status === 'error' || message.status === 'stopped')
  let hasInlineRetry = $derived(!renderPart && message.parts.some((part) => part.type === 'error' && part.recoverable))
  let showReplay = $derived(hasAudio || isSpeaking || hasSpoken)
  let messageFooter = $derived(renderMessageFooter?.(message))

  function register(node: HTMLElement) {
    root = node
    return { destroy: () => { root = null } }
  }

  function emit(action: 'copy' | 'retry' | 'reply' | 'speak') { onAction?.({ messageId: message.id, action }) }
  async function copy() {
    try { await navigator.clipboard.writeText(copyText); copied = true }
    catch { copied = false }
    emit('copy')
  }
  function speak() {
    hasSpoken = true
    onSpeak?.(message.id)
    const audio = root?.querySelector('audio')
    if (audio) { audio.currentTime = 0; void audio.play().catch(() => undefined) }
    emit('speak')
  }
  const initialId = untrack(() => message.id)
  $effect(() => { if (message.id !== initialId) { copied = false; hasSpoken = false } })
</script>

<article use:register {...rest} aria-label={`${actorName}, ${timestamp.label || 'message'}`} aria-busy={busy || undefined}
  data-chat-message="" data-message-id={message.id} data-status={message.status} data-alignment={alignment}
  data-group-position={groupPosition} data-speaking={isSpeaking ? '' : undefined}
  class={['chat-message group/message flex min-w-0 gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-tint-accent focus-visible:ring-offset-4', alignment === 'end' && 'flex-row-reverse', alignment === 'center' && 'justify-center', className, legacyClassName]}>
  {#if alignment !== 'center'}
    {#if showAvatar}<span class={['mt-0.5 grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl', alignment === 'end' ? 'bg-tint-accent text-tint-on-accent' : 'border border-tint-border bg-tint-panel text-tint-accent']} aria-hidden="true"><Avatar identity={message.actor} size="sm" decorative class="size-8" /></span>
    {:else}<span class="size-8 shrink-0" aria-hidden="true"></span>{/if}
  {/if}
  <div class={['min-w-0', alignment === 'end' ? 'max-w-[min(82%,42rem)]' : 'max-w-[min(92%,48rem)] flex-1', alignment === 'center' && 'max-w-xl text-center']}>
    {#if showActor}
      <header class={['mb-1.5 flex items-center gap-2 text-xs', alignment === 'end' && 'justify-end']}>
        <span class="font-medium">{actorName}</span>
        {#if message.timestampLabel !== undefined}<span class="break-words text-tint-muted">{stripBidi(message.timestampLabel)}</span>
        {:else if timestamp.dateTime}<time datetime={timestamp.dateTime} class="text-tint-muted">{timestamp.label}</time>{/if}
      </header>
    {/if}
    {#if replyToMessage}
      <div data-chat-reply-context="" class={['mb-1 flex min-w-0 items-center gap-1.5 border-l-2 border-tint-border pl-2 text-xs text-tint-muted', alignment === 'end' && 'flex-row-reverse border-r-2 border-l-0 pr-2 pl-0']}>
        <Reply size={12} class="shrink-0" /><span class="shrink-0 font-medium">{stripBidi(replyToMessage.actor.name)}</span><span class="truncate">{replySnippet(replyToMessage)}</span>
      </div>
    {/if}
    <div class={alignment === 'end' ? 'rounded-2xl rounded-tr-md bg-tint-accent px-4 py-3 text-tint-on-accent' : alignment === 'center' ? 'rounded-xl border border-tint-border bg-tint-panel px-4 py-3' : 'py-1'}>
      <div data-chat-message-content="" class="min-w-0 space-y-3">
        {#each message.parts as part (part.id)}
          <ChatPart {part} {message} {renderPart} {onAction} {onToolApproval} onRetry={() => emit('retry')}
            {speakingMessageId} {speakGeneration} {onSpeak} {onClearSpeak} {onRenderError} />
        {/each}
        {#if message.parts.length === 0 && message.status === 'streaming'}<div class="flex items-center gap-2 py-1 text-sm text-tint-muted"><span class="animate-pulse">◌</span>Thinking…</div>{/if}
      </div>
    </div>
    <footer class={['mt-1.5 flex min-h-7 items-center gap-2', alignment === 'end' && 'justify-end']}>
      {#if message.status === 'streaming'}<span role="status" class="text-xs text-tint-muted">Responding</span>{/if}
      {#if message.status === 'stopped'}<span class="text-xs text-tint-muted">Stopped</span>{/if}
      <div data-chat-message-actions="" class="flex items-center gap-1">
        {#if canSpeak}<button type="button" onclick={speak} aria-pressed={isSpeaking || undefined} aria-label={showReplay ? `Replay ${actorName}` : `Play ${actorName}`} class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface"><Volume2 size={14} />{showReplay ? 'Replay' : 'Play'}</button>{/if}
        <button type="button" onclick={() => void copy()} aria-label={copied ? 'Message copied' : 'Copy message'} class="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-tint-muted hover:bg-tint-surface"><Copy size={14} /></button>
        <button type="button" onclick={() => emit('reply')} class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface"><Reply size={14} />Reply</button>
        {#if canRetry && !hasInlineRetry}<button type="button" onclick={() => emit('retry')} class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface"><RotateCcw size={14} />Retry</button>{/if}
      </div>
      {@render messageFooter?.()}
    </footer>
  </div>
</article>

<style>
  .chat-message button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
