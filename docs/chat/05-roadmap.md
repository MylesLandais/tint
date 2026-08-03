# Tint Chat implementation roadmap

The first implementation milestone is rich AI-agent presentation, built on universal message
primitives. Human messaging features remain compatible extension points but are not allowed to
inflate v1.

## Implemented foundation and rich parts

- `ChatConversation`, `ChatMessageList`, `ChatMessage`, and `ChatComposer` are exported from the
  package root and `tint/chat`.
- Safe Markdown, code, sources, reasoning, tools, approval, artifacts, image/file/audio, and
  part-level errors have built-in renderers.
- Sticky-follow scrolling, history anchoring, roving focus, drill-in, live status, and IME-safe
  submission are part of the controlled presentation layer.
- A client-only interactive fixture demonstrates send, streaming, stop, retry, tool approval,
  attachment progress, error recovery, replay, and reset.

## Next — application recipes

- Publish controlled-state recipes for plain React state, Zustand, SSE reduction, and AI SDK data
  normalization without making any of them dependencies.
- Add inline copilot, full-height assistant, and voice-agent compositions.
- Add long-history and rapid-stream performance fixtures.

**Exit:** consumers can integrate Tint without reverse-engineering component state assumptions.

## Deferred human-messaging layer

Add only after rich AI v1 is stable:

- Reactions and reaction detail.
- Replies, quoted context, and nested threads.
- Editing, deletion, pinning, forwarding, and moderation actions.
- Presence, typing participants, delivery state, and read receipts.
- Conversation list, search, unread counts, and responsive inbox layout.
- Virtualized high-volume histories.

These features should extend the actor/message model rather than create a second incompatible
chat system.

## Acceptance scenarios

Every implementation phase must retain fixtures for:

1. User text followed by a token-streaming assistant response.
2. Stop with partial content, retry, terminal error, and recovered response.
3. Reasoning followed by a running tool, approval request, tool result, sources, and final text.
4. Approval accepted, denied with reason, failed to submit, and already resolved.
5. Upload pending, progressing, ready, removed, and failed.
6. User reads older history while new content streams.
7. Older history prepends without a viewport jump.
8. Keyboard-only transcript navigation and composer submission during IME composition.
9. Screen-reader streaming announcements that occur once per transition.
10. A custom part renderer that succeeds, throws, and falls back safely.
