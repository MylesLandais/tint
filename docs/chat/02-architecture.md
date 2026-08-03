# Tint Chat architecture

Tint Chat is a controlled presentation system. It renders conversation state, owns only local
DOM interaction behavior, and reports user intent through callbacks.

## Design principles

1. **Data in, intent out.** Components receive messages, parts, attachments, and states. They
   emit submit, stop, retry, action, follow, attachment, and approval intent.
2. **Parts, not protocol events.** Applications normalize websocket, SSE, AI SDK, or database
   objects into Tint’s stable presentation types.
3. **Composition before configuration.** Compound parts cover structural customization;
   `renderPart` handles application-specific rich content.
4. **Native semantics first.** Regions, articles, forms, textareas, buttons, lists, and
   disclosures remain real HTML elements.
5. **Progressive complexity.** A text transcript needs only messages and a composer. Tools,
   sources, audio, approvals, and custom artifacts are additive.
6. **Safe defaults.** Plain text is the default. Markdown, links, downloads, media, and custom
   parts cross explicit trust boundaries.

## Component hierarchy

```text
ChatConversation
├── application header / navigation (consumer-owned)
├── ChatMessageList
│   ├── ChatDateDivider
│   ├── ChatMessageGroup
│   │   └── ChatMessage
│   │       ├── ChatMessageAvatar
│   │       ├── ChatMessageContent
│   │       │   └── ordered rich-part renderers
│   │       ├── ChatMessageMeta
│   │       └── ChatMessageActions
│   ├── ChatTypingIndicator
│   └── ChatScrollToBottom
└── ChatComposer
    ├── ChatComposerAttachments
    ├── ChatComposerInput
    ├── ChatComposerToolbar
    ├── ChatStopButton
    └── ChatSendButton
```

The application may use the compounds or compose their parts directly. Tint does not require a
`ChatProvider`; data dependencies stay visible in props.

## Data flow

```text
backend / SDK / local runtime
        │
        ▼
application reducer and normalization
        │  ChatMessageData[] / controlled composer state
        ▼
Tint presentation components
        │  callbacks describing user intent
        ▼
application commands, uploads, transport, and persistence
```

Tint may provide pure helpers later—such as grouping messages or reducing a list of parts—but
v1 does not define a stream protocol or application store.

## Ownership boundary

### Tint owns

- Rendered structure, Tailwind presentation, native prop forwarding, and state attributes.
- Message grouping presentation and part rendering.
- Local focus navigation and drill-in behavior.
- Resize/scroll observation and scroll-to-bottom affordances.
- Textarea autosizing and IME-safe keyboard interpretation.
- Accessible labels, relationships, live status, and reduced-motion presentation.
- Error isolation around rich/custom part renderers.

### The application owns

- Creating, loading, searching, switching, and persisting conversations.
- Sending, stopping, reconnecting, retrying, and reconciling messages.
- Optimistic IDs and mapping server IDs.
- Streaming event reduction and tool lifecycle orchestration.
- Upload execution and attachment authorization.
- Tool execution, approval policy, and generative UI registration.
- Authentication, permissions, moderation, analytics, and localization strings.

## Styling and customization

The public Tint repository remains Tailwind-first:

- Components use utility classes internally and merge `className` with `cn`.
- State required by consumers or tests is exposed through stable `data-state`,
  `data-alignment`, `data-group-position`, and `data-part-type` attributes.
- Native props are forwarded to the relevant root element.
- Compound slots accept their own classes and native props.
- Structural renderer callbacks are reserved for meaningful replacement, not minor styling.

The local CSS-free Tint adapter remains a design reference. Cross-framework parity means shared
state names, semantics, interaction contracts, and accessibility outcomes; it does not require
identical class strings or DOM wrappers.

## Rich-part rendering

Built-in renderers cover:

- Plain and Markdown text.
- Code with language/filename metadata and a copy action.
- Images, files, audio, and upload/download state.
- Reasoning disclosure with duration and streaming state.
- Sources/citations with safe external-link behavior.
- Tool input, progress, output, cancellation, and failure.
- Human approval or denial with an optional reason.
- Artifacts with a summary and consumer-provided detailed renderer.
- Recoverable and terminal errors.

`renderPart(part, context)` can override any built-in or custom part. If it throws, Tint shows an
isolated part error rather than losing the entire message list.

Custom parts use `{ type: "custom", kind, data }`. The generic
`ChatMessageData<TCustomPart>` preserves application-specific narrowing without requiring Tint
to know every generative UI schema.

## Public API

The reviewed contract now lives with the implementation in `src/components/chat/types.ts`.
Components and types are exported from both the package root and `tint/chat`. Interaction tests
cover the controlled composer, message rendering, transcript navigation and anchoring, rich
scenario progression, and local error recovery.

The package remains presentation-only: public callbacks report intent, while applications retain
ownership of stores, transports, persistence, and tool execution.
