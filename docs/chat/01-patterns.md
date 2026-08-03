# Chat interface patterns

A chat interface is not a list of bubbles. It is a temporal workspace in which content can be
pending, arrive incrementally, ask for a decision, fail, branch, and continue while the user is
reading somewhere else. Tint should make those states legible without owning the system that
produces them.

## The five layers

### 1. Surface

The surface establishes product context: title, participants or agent identity, connectivity,
conversation controls, and responsive regions. A full messenger may add a conversation list;
an inline copilot may expose only a transcript and composer.

Tint needs a neutral `ChatConversation` region rather than a batteries-included `ChatBox`.
Applications remain responsible for sidebars, routes, workspaces, model selection, and session
creation.

### 2. Transcript

The transcript handles order, grouping, loading earlier history, date boundaries, unread state,
sticky following, and keyboard navigation. It is where simple implementations most often fail:

- Unconditional scrolling steals the user’s reading position.
- Announcing every streamed token overwhelms screen readers.
- Tabbing through every link and action makes long histories unusable.
- Prepending history can jump the viewport.
- A message taller than the viewport can trap custom Page Up/Down behavior.

The transcript therefore owns local DOM behavior—focus and scroll observation—but receives
messages and follow state as controlled data.

### 3. Message

A message has stable identity and lifecycle around an ordered list of parts:

```text
message
├── actor / alignment / avatar
├── content
│   ├── text or markdown
│   ├── reasoning disclosure
│   ├── tool activity
│   ├── approval
│   ├── artifact or media
│   └── sources
├── metadata / delivery state
└── actions / feedback
```

Separating message chrome from parts avoids the large conditional message components found in
mature applications. A single assistant turn can stream text, finish a tool, wait for approval,
and then add sources without pretending each event is a separate conversational message.

### 4. Composer

The composer is a form state machine, not just a textarea. Its reusable concerns are:

- Controlled draft value and autosizing.
- IME-safe Enter handling.
- File selection, previews, upload progress, removal, and validation feedback.
- Send versus stop affordances.
- Disabled, submitting, streaming, and error states.
- Optional toolbars, suggestions, dictation, mentions, and prompt commands.

Tint exposes compound pieces and events. Draft persistence, upload execution, prompt expansion,
typing signals, and transport stay in the application.

### 5. Rich activity

AI and agent chat introduces content that is operational rather than purely conversational:
reasoning, tools, approvals, sources, generated files, artifacts, and recoverable failures.
These should be first-class typed parts so they can expose state and accessibility consistently.
Applications can add custom parts through a renderer without weakening built-in type safety.

## State models

### Message lifecycle

| State | User meaning | Required presentation |
| --- | --- | --- |
| `queued` | Accepted locally but not sent | Subtle pending state and optional cancel/remove action |
| `sending` | Request is being transmitted | Busy state without implying response content |
| `streaming` | Response is arriving | Stable message container, activity cue, stop action, `aria-busy` |
| `complete` | Terminal success | Normal content and eligible actions |
| `stopped` | User or system stopped generation | Preserve partial content and make retry available |
| `error` | Terminal failure | Preserve useful content, explain failure, expose recovery |

Transport events may be more granular. The application reduces them into these presentation
states before passing them to Tint.

### Tool lifecycle

| State | Surface |
| --- | --- |
| `pending` | Tool is planned but has not started |
| `running` | Live status with a concise label and optional expandable input |
| `approval-required` | Explicit decision panel; never masquerade as a normal message action |
| `succeeded` | Compact summary with expandable structured output |
| `failed` | Error adjacent to the tool, isolated from the rest of the assistant message |
| `cancelled` | Terminal neutral state preserving what happened |

### Composer lifecycle

`idle → submitting → streaming → idle` is the common path. `disabled` and `error` are explicit
states rather than boolean combinations. The application decides when transitions happen; Tint
decides how each state is presented.

## Grouping

Consecutive human messages may share an actor, avatar, and timestamp context. Use
`solo | first | middle | last` as the visual group position. Grouping is a pure derivation from
actor identity, time threshold, message kind, and boundaries such as dates or system events.

AI messages should default to flat, spacious presentation rather than speech bubbles. Human
messaging may use contained bubbles. The same message component supports both via alignment,
group position, density, and slots; it does not infer product type globally.

## Scrolling and history

Adopt a sticky-follow model:

1. New content follows only while the viewport is near the end.
2. Scrolling away disables follow and reveals a return-to-latest affordance.
3. Streaming does not repeatedly force the viewport down after follow is disabled.
4. Prepending older messages preserves the first visible anchor and its offset.
5. Returning to latest re-enables follow deliberately.

The application controls `followOutput`; the list reports `onFollowOutputChange`. This supports
both locally managed and store-backed applications without hiding scroll state in a provider.

## Rich content order

Message parts preserve server/application order. Tint must not reorder reasoning, tools, text,
or sources to impose a preferred model protocol. Recommended compositions can place sources
last or collapse completed tools, but raw order remains available.

Every part requires a stable `id`. React array indexes are not acceptable during streaming
because parts may be inserted, replaced, or completed independently.

## Adopt, adapt, reject

| Pattern | Decision | Reason |
| --- | --- | --- |
| Small message/avatar/content primitives | Adopt | Useful in both simple and rich surfaces |
| Compound transcript and composer components | Adopt | Keeps structure customizable without rebuilding behavior |
| Discriminated message-part union | Adopt | Handles streaming and rich AI content without giant optional interfaces |
| One-tab-stop transcript with drill-in | Adopt | Scales keyboard navigation to long histories |
| Controlled values and event callbacks | Adopt | Fits Tint and avoids backend coupling |
| Sticky-to-bottom with visible opt-out | Adopt | Respects reading position during live output |
| Renderer registry for custom parts | Adapt | Use one controlled `renderPart` escape hatch before adding a global registry |
| Global chat provider | Reject for v1 | Hides data dependencies and drifts into runtime ownership |
| Backend adapter on the component | Reject | Transport is outside a presentation library |
| Monolithic `ChatBox` | Reject | Product layout and runtime decisions cannot be universal |
| Raw HTML Markdown rendering | Reject | Unsafe by default and difficult to compose |
| Hover-only message actions | Reject | Inaccessible on touch and keyboard |

## Recommended library posture

Tint should sit between tiny copy-paste primitives and integrated chat SDKs:

- More opinionated and consistently typed than raw shadcn-style copied components.
- Less stateful than MUI X Chat, assistant-ui, CopilotKit, or Stream.
- Richer in AI presentation semantics than a general-purpose design system.
- Independent of a model SDK, event protocol, backend vendor, or application store.

