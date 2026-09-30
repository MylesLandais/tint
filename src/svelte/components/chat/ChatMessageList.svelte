<script lang="ts">
  import { tick, untrack } from 'svelte'
  import { chatGroupPositions, chatStatusAnnouncement, type ChatCustomPart, type ChatId } from '../../../core/chat'
  import ChatMessage from './ChatMessage.svelte'
  import type { ChatMessageListProps } from './types'

  const FOLLOW_THRESHOLD = 72
  const INTERACTIVE = 'button, a, textarea, input, select, summary, audio, video, [role="button"], [role="radio"], [role="slider"], [contenteditable="true"]'
  let { messages, currentActorId, label = 'Messages', loading = false, hasEarlier = false,
    followOutput, enableRovingFocus = true, emptyState, renderPart, renderMessageFooter, viewportRef,
    onFollowOutputChange, onLoadEarlier, onMessageAction, onToolApproval,
    enableSpeak = false, speakingMessageId, onSpeakingMessageIdChange, onRenderError,
    class: className, className: legacyClassName, ...rest
  }: ChatMessageListProps<ChatCustomPart> = $props()
  let viewport: HTMLDivElement | null = null
  let previousLayout: { firstId?: ChatId; scrollHeight: number } = { firstId: undefined, scrollHeight: 0 }
  let internalFollowing = $state(true)
  let following = $derived(followOutput ?? internalFollowing)
  let activeIndex = $state(untrack(() => Math.max(messages.length - 1, 0)))
  let tabStopMoved = false
  let hasUnseen = $state(false)
  let seenLastId = untrack(() => messages.at(-1)?.id)
  const playbackControlled = untrack(() => speakingMessageId !== undefined)
  let internalSpeaking = $state<ChatId | null>(null)
  let speaking = $derived(playbackControlled ? speakingMessageId ?? null : internalSpeaking)
  let speakGeneration = $state(0)
  let positions = $derived(chatGroupPositions(messages))
  let byId = $derived(new Map(messages.map((message) => [message.id, message])))
  let announcement = $derived(chatStatusAnnouncement(messages, currentActorId))

  function setFollowing(next: boolean) {
    if (followOutput === undefined) internalFollowing = next
    onFollowOutputChange?.(next)
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    if (!viewport) return
    viewport.scrollTo?.({ top: viewport.scrollHeight, behavior })
    viewport.scrollTop = viewport.scrollHeight
    setFollowing(true)
  }

  $effect(() => {
    const firstId = messages[0]?.id
    const currentMessages = messages
    const shouldFollow = following
    let cancelled = false
    void tick().then(() => {
      if (cancelled || !viewport) return
      const old = previousLayout
      const prepended = old.firstId !== undefined && firstId !== old.firstId &&
        currentMessages.some((message) => message.id === old.firstId)
      if (prepended) viewport.scrollTop += viewport.scrollHeight - old.scrollHeight
      else if (shouldFollow) viewport.scrollTop = viewport.scrollHeight
      previousLayout = { firstId, scrollHeight: viewport.scrollHeight }
    })
    return () => { cancelled = true }
  })

  $effect(() => {
    const last = Math.max(messages.length - 1, 0)
    if (!tabStopMoved) activeIndex = last
    else activeIndex = Math.min(activeIndex, last)
  })

  $effect(() => {
    const lastId = messages.at(-1)?.id
    if (following) { seenLastId = lastId; hasUnseen = false }
    else if (lastId !== seenLastId) hasUnseen = true
  })

  function focusMessage(index: number) {
    const items = viewport?.querySelectorAll<HTMLElement>('[data-chat-message]')
    if (!items?.length) return
    const next = Math.max(0, Math.min(index, items.length - 1))
    tabStopMoved = true
    activeIndex = next
    items[next]?.focus()
  }

  function registerViewport(node: HTMLDivElement) {
    viewport = node
    viewportRef?.(node)
    const onScroll = () => {
      const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight <= FOLLOW_THRESHOLD
      if (nearBottom !== following) setFollowing(nearBottom)
      previousLayout.scrollHeight = node.scrollHeight
    }
    const onFocus = (event: FocusEvent) => {
      const message = (event.target as HTMLElement).closest<HTMLElement>('[data-chat-message]')
      if (!message) return
      const items = node.querySelectorAll<HTMLElement>('[data-chat-message]')
      const index = Array.prototype.indexOf.call(items, message) as number
      if (index >= 0) { tabStopMoved = true; activeIndex = index }
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (!enableRovingFocus) return
      const target = event.target as HTMLElement
      const message = target.closest<HTMLElement>('[data-chat-message]')
      if (!message) return
      const interactive = target.closest(INTERACTIVE)
      if (!interactive) {
        if (event.key === 'ArrowDown') { event.preventDefault(); focusMessage(activeIndex + 1) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); focusMessage(activeIndex - 1) }
        else if (event.key === 'Home') { event.preventDefault(); focusMessage(0) }
        else if (event.key === 'End') { event.preventDefault(); focusMessage(messages.length - 1) }
        else if (event.key === 'Enter') {
          const control = message.querySelector<HTMLElement>(INTERACTIVE)
          if (control) { event.preventDefault(); control.focus() }
        }
      } else if (event.key === 'Escape') { event.preventDefault(); message.focus() }
    }
    node.addEventListener('scroll', onScroll)
    node.addEventListener('focusin', onFocus)
    node.addEventListener('keydown', onKeydown)
    return { destroy: () => {
      node.removeEventListener('scroll', onScroll)
      node.removeEventListener('focusin', onFocus)
      node.removeEventListener('keydown', onKeydown)
      viewport = null
      viewportRef?.(null)
    } }
  }

  function registerContent(node: HTMLDivElement) {
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
      if (!following || !viewport) return
      viewport.scrollTop = viewport.scrollHeight
      previousLayout.scrollHeight = viewport.scrollHeight
    })
    observer?.observe(node)
    return { destroy: () => { observer?.disconnect() } }
  }

  function requestSpeak(messageId: ChatId) {
    speakGeneration += 1
    if (!playbackControlled) internalSpeaking = messageId
    onSpeakingMessageIdChange?.(messageId)
  }

  function clearSpeak(messageId: ChatId) {
    if (speaking !== messageId) return
    if (!playbackControlled) internalSpeaking = null
    onSpeakingMessageIdChange?.(null)
  }
</script>

<div class="relative min-h-0 flex-1">
  <div use:registerViewport {...rest} role="log" aria-label={label} aria-live="off" data-chat-message-list="" data-following={following}
    class={['h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6', className, legacyClassName]}>
    {#if hasEarlier}<div class="mb-6 flex justify-center"><button type="button" onclick={onLoadEarlier} disabled={loading}
      class="rounded-full border border-tint-border bg-tint-panel px-3 py-1.5 text-xs font-medium text-tint-muted">{loading ? 'Loading…' : 'Load earlier messages'}</button></div>{/if}
    {#if messages.length === 0}
      {#if emptyState}{@render emptyState()}{:else}<section data-chat-empty-state="" class="m-auto max-w-sm px-6 py-12 text-center text-sm text-tint-muted">Start a conversation</section>{/if}
    {:else}
      <div use:registerContent class="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {#each messages as message, index (message.id)}
          {@const position = positions[index] ?? 'solo'}
          {@const startsGroup = position === 'solo' || position === 'first'}
          <ChatMessage {message} replyToMessage={message.parentMessageId ? byId.get(message.parentMessageId) : undefined}
            alignment={message.actor.id === currentActorId ? 'end' : message.actor.kind === 'system' ? 'center' : 'start'}
            groupPosition={position} showActor={startsGroup} showAvatar={startsGroup}
            tabindex={enableRovingFocus ? index === activeIndex ? 0 : -1 : undefined}
            {renderPart} {renderMessageFooter} enableSpeak={enableSpeak} speakingMessageId={speaking} {speakGeneration}
            onSpeak={requestSpeak} onClearSpeak={clearSpeak}
            onAction={onMessageAction} onToolApproval={onToolApproval} {onRenderError} />
        {/each}
      </div>
    {/if}
  </div>
  {#if !following}<div class="pointer-events-none absolute right-0 bottom-4 left-0 flex justify-center"><button type="button" data-chat-scroll-to-bottom="" onclick={() => scrollToBottom()}
    class="pointer-events-auto rounded-full border border-tint-border bg-tint-panel px-3 py-2 text-xs font-medium shadow-lg">{hasUnseen ? 'New messages' : 'Jump to latest'}</button></div>{/if}
  <div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>
