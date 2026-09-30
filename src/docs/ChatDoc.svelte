<script lang="ts">
  import { onDestroy } from 'svelte'
  import { ChatComposer, ChatConversation, ChatMessageList, ChatPreference } from '../svelte/components/chat'
  import type {
    ChatApprovalData, ChatAttachmentData, ChatComposerState, ChatId, ChatMessageActionPayload,
    ChatMessageData, ChatPreferenceOption, ChatSubmitPayload, ChatToolApprovalPayload,
  } from '../core/chat'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const me = { id: 'reader', name: 'You', kind: 'human' } as const
  const assistant = { id: 'assistant', name: 'Tint Assistant', kind: 'assistant' } as const
  const initial: ChatMessageData[] = [
    { id: 'welcome', actor: assistant, createdAt: '2026-08-02T15:00:00Z', status: 'complete', parts: [
      { id: 'intro', type: 'text', format: 'markdown', text: 'Welcome! **Send a message**, inspect this safe [source](https://example.com), or try the controls below.' },
      { id: 'code', type: 'code', language: 'ts', code: 'const answer = 42' },
      { id: 'source', type: 'sources', sources: [{ id: 'docs', title: 'Example source', url: 'https://example.com', description: 'An external citation.' }] },
      { id: 'reasoning', type: 'reasoning', text: 'A concise summary of how the sample answer was prepared.', title: 'Reasoning summary' },
    ] },
    { id: 'tool', actor: assistant, createdAt: '2026-08-02T15:00:10Z', status: 'complete', parts: [
      { id: 'tool-run', type: 'tool', tool: { id: 'lookup', name: 'lookup', title: 'Look up sample data', status: 'succeeded', input: { query: 'Tint' }, output: { matches: 1 } } },
      { id: 'approval', type: 'approval', approval: { id: 'run-demo', title: 'Run the sample action?', description: 'This only updates local demo state.', status: 'pending', allowReason: true } },
      { id: 'voice', type: 'audio', src: '/audio/maya.wav', title: 'Cached sample clip', transcript: 'Welcome to the Tint chat demo.' },
    ] },
  ]
  const preferenceOptions: ChatPreferenceOption[] = [
    { id: 'brief', label: 'Brief response', parts: [{ id: 'brief-text', type: 'text', text: 'A short answer with the main point.' }] },
    { id: 'detailed', label: 'Detailed response', parts: [
      { id: 'detailed-text', type: 'text', format: 'markdown', text: 'A **detailed** answer with a small example.' },
      { id: 'detailed-code', type: 'code', language: 'ts', code: 'const answer = 42' },
    ] },
  ]

  let messages = $state<ChatMessageData[]>(structuredClone(initial))
  let draft = $state('')
  let attachments = $state<ChatAttachmentData[]>([])
  let composerState = $state<ChatComposerState>('idle')
  let replyTo = $state<ChatId | null>(null)
  let hasEarlier = $state(true)
  let selectedPreference = $state<ChatId | undefined>()
  let preferenceStatus = $state<'pending' | 'selected'>('pending')
  let eventNote = $state('Ready for your message')
  let nextId = 0
  let responseTimer: ReturnType<typeof setTimeout> | undefined
  onDestroy(() => { if (responseTimer) clearTimeout(responseTimer) })

  function submit(payload: ChatSubmitPayload) {
    if (responseTimer) clearTimeout(responseTimer)
    const id = ++nextId
    const userParts: ChatMessageData['parts'][number][] = []
    if (payload.text) userParts.push({ id: `u-${id}-text`, type: 'text', text: payload.text })
    for (const attachment of payload.attachments) userParts.push({ id: `u-${id}-${attachment.id}`, type: 'file', attachment })
    messages = [...messages,
      { id: `u-${id}`, actor: me, createdAt: Date.now(), status: 'complete', parts: userParts, parentMessageId: replyTo ?? undefined },
      { id: `a-${id}`, actor: assistant, createdAt: Date.now(), status: 'streaming', parts: [{ id: `a-${id}-text`, type: 'text', text: 'Preparing a local response…', status: 'streaming' }] },
    ]
    draft = ''
    attachments = []
    replyTo = null
    composerState = 'streaming'
    eventNote = 'Local response started'
    responseTimer = setTimeout(() => {
      messages = messages.map((message) => message.id === `a-${id}` ? { ...message, status: 'complete', parts: [
        { id: `a-${id}-text`, type: 'text', format: 'markdown', text: `You sent **${payload.text || 'an attachment'}**. This reply came from a local timer.` },
      ] } : message)
      composerState = 'idle'
      eventNote = 'Local response completed'
      responseTimer = undefined
    }, 1600)
  }

  function stop() {
    if (responseTimer) clearTimeout(responseTimer)
    responseTimer = undefined
    messages = messages.map((message) => message.status === 'streaming' ? { ...message, status: 'stopped' } : message)
    composerState = 'idle'
    eventNote = 'Response stopped'
  }

  function messageAction(payload: ChatMessageActionPayload) {
    eventNote = `${payload.action} on ${payload.messageId}`
    if (payload.action === 'reply') replyTo = payload.messageId
    if (payload.action === 'retry') {
      messages = messages.map((message) => message.id === payload.messageId ? {
        ...message, status: 'complete', parts: [{ id: `${message.id}-retry`, type: 'text', text: 'The local response was retried.' }],
      } : message)
    }
  }

  function toolApproval(payload: ChatToolApprovalPayload) {
    const status: ChatApprovalData['status'] = payload.approved ? 'approved' : 'denied'
    messages = messages.map((message) => message.id === payload.messageId ? { ...message,
      parts: message.parts.map((part) => part.type === 'approval' && part.id === payload.partId
        ? { ...part, approval: { ...part.approval, status } } : part),
    } : message)
    eventNote = `${payload.approved ? 'Approved' : 'Denied'} ${payload.approvalId}${payload.reason ? `: ${payload.reason}` : ''}`
  }

  function addFiles(files: readonly File[]) {
    attachments = [...attachments, ...files.map((file) => ({ id: `file-${++nextId}`, name: file.name, mediaType: file.type || 'application/octet-stream', size: file.size, status: 'ready' as const }))]
    eventNote = `${files.length} file${files.length === 1 ? '' : 's'} attached`
  }

  function loadEarlier() {
    hasEarlier = false
    messages = [{ id: 'earlier', actor: me, createdAt: '2026-08-02T14:59:00Z', status: 'complete', parts: [{ id: 'earlier-text', type: 'text', text: 'An earlier message preserved while history is prepended.' }] }, ...messages]
    eventNote = 'Earlier history loaded'
  }

  const api: ApiRow[] = [
    { prop: 'ChatMessageList messages / currentActorId', type: 'ChatMessageData[] / ChatId', description: 'Host-owned transcript, alignment, grouping, and reader identity.' },
    { prop: 'onMessageAction / onToolApproval', type: 'callbacks', description: 'Copy, reply, retry, image, speak, and approval intent; the host updates data.' },
    { prop: 'renderPart / onRenderError', type: 'ChatPartRenderer / callback', description: 'Svelte Snippet override for custom parts, with a per-part error boundary.' },
    { prop: 'renderMessageFooter', type: '(message) => Snippet | null', description: 'Optional host-rendered controls beside each message’s built-in actions; compose ChatMessageAlternatives and ChatMessageEditor for saved versions and inline edits.' },
    { prop: 'hasEarlier / onLoadEarlier / followOutput', type: 'boolean / callbacks', description: 'History loading and optional host-controlled scroll following.' },
    { prop: 'enableSpeak / speakingMessageId', type: 'boolean / ChatId | null', description: 'One controlled conversation playback slot with Play and Replay intent.' },
    { prop: 'ChatComposer value / onValueChange', type: 'string / callback', description: 'Controlled draft text; Enter sends and Shift+Enter inserts a new line.' },
    { prop: 'attachments / onAttachmentAdd / onAttachmentRemove', type: 'ChatAttachmentData[] / callbacks', description: 'Controlled attachments and file intent; in-flight or failed items are excluded from submit.' },
    { prop: 'state / onSubmit / onStop', type: 'ChatComposerState / callbacks', description: 'Host-driven lifecycle and trimmed submit payload; stop is an intent callback.' },
    { prop: 'ChatPreference options / selectedOptionId / onSelect', type: 'ChatPreferenceOption[] / ChatId / callback', description: 'Controlled preference selection with keyboard radio navigation and nested rich parts.' },
  ]
  const usage = `import { ChatConversation, ChatMessageList, ChatComposer } from '@nebula/tint/chat'

let messages = $state<ChatMessageData[]>(initialMessages)
let draft = $state('')

<ChatConversation label="Support conversation">
  <ChatMessageList {messages} currentActorId="me"
    onMessageAction={(intent) => handleMessageIntent(intent)} />
  <ChatComposer value={draft} onValueChange={(next) => draft = next}
    onSubmit={(payload) => sendFromHost(payload)} />
</ChatConversation>`
</script>

{#snippet welcomeFooter()}
  <button type="button" onclick={() => { eventNote = 'Opened host message control' }}>Host control</button>
{/snippet}

<DocPage title="Chat" description="Controlled Svelte conversation primitives for text, Markdown, media, tool output, approvals, and preferences. The live demo uses local state and timers only." importPath="@nebula/tint/chat" {usage} {api}
  accessibility="The transcript is a named log with live reading disabled while tokens stream; a separate polite status reports completed remote turns. Messages have roving keyboard focus, nested actions return focus with Escape, and the composer keeps focus while submitting. Preference cards use a radiogroup with arrow-key navigation. Images have alt text, media has labels and transcripts, and approval buttons have explicit names.">
  <div class="chat-doc-demo">
    <div class="demo-toolbar"><strong>Tint Assistant</strong><span>Local fixture · no network request</span><button type="button" onclick={() => { if (responseTimer) clearTimeout(responseTimer); responseTimer = undefined; messages = structuredClone(initial); draft = ''; attachments = []; composerState = 'idle'; replyTo = null; hasEarlier = true; selectedPreference = undefined; preferenceStatus = 'pending'; eventNote = 'Demo reset' }}>Reset demo</button></div>
    <div class="chat-doc-conversation"><ChatConversation label="Tint chat component demonstration" class="h-full">
      <ChatMessageList {messages} currentActorId="reader" {hasEarlier} onLoadEarlier={loadEarlier} onMessageAction={messageAction} onToolApproval={toolApproval} enableSpeak={true}
        renderMessageFooter={(message) => message.id === 'welcome' ? welcomeFooter : undefined}
        onSpeakingMessageIdChange={(id) => { if (id) eventNote = `Playing ${id}` }} />
      {#if replyTo}<div class="reply-bar">Replying to {replyTo}<button type="button" onclick={() => { replyTo = null }} aria-label="Cancel reply">Cancel</button></div>{/if}
      <ChatComposer value={draft} onValueChange={(value) => { draft = value }} {attachments} state={composerState}
        onSubmit={submit} onStop={stop} onAttachmentAdd={addFiles} onAttachmentRemove={(id) => { attachments = attachments.filter((item) => item.id !== id) }} />
    </ChatConversation></div>
    <p class="event-note" aria-live="polite">Last intent: {eventNote}</p>
    <section class="preference-demo"><ChatPreference title="Which sample response do you prefer?" subtitle="Selection is stored by this page."
      options={preferenceOptions} selectedOptionId={selectedPreference} status={preferenceStatus}
      onSelect={(id) => { selectedPreference = id; preferenceStatus = 'selected'; eventNote = `Preference ${id} selected` }} /></section>
  </div>
</DocPage>

<style>
  .chat-doc-demo { min-width: 0; display: grid; gap: 1rem; }
  .demo-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; padding: .65rem .85rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); color: var(--tint-ink); font-size: .85rem; }
  .demo-toolbar span { flex: 1; min-width: 9rem; color: var(--tint-muted); font-size: .75rem; }
  .demo-toolbar button, .reply-bar button { border: 1px solid var(--tint-border); border-radius: .5rem; background: var(--tint-surface); padding: .4rem .7rem; color: var(--tint-ink); cursor: pointer; }
  .chat-doc-conversation { height: min(68vh, 42rem); min-height: 27rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  .reply-bar { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .4rem .75rem; border-top: 1px solid var(--tint-border); color: var(--tint-muted); font-size: .8rem; }
  .event-note { margin: 0; color: var(--tint-muted); font-size: .8rem; }
  .preference-demo { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); padding: 1rem; }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
