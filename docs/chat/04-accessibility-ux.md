# Accessibility and UX contract

Tint Chat targets WCAG 2.2 AA. Accessibility is behavioral API, not a cleanup pass after visual
components are complete.

## Semantic regions

| Surface | Required semantics |
| --- | --- |
| Conversation | Labeled `section` or `role="region"` |
| Transcript scroller | Named `role="log"`, explicitly `aria-live="off"` |
| Message | Focusable `article` labeled with the actor name |
| Date divider | `role="separator"` with an accessible date |
| Composer | Named `form` containing a real `textarea` and buttons |
| Streaming message | `aria-busy="true"` until terminal |
| Tool or message failure | Contextual `role="alert"` only when immediate interruption is warranted |
| Background status | Visually hidden `role="status"` |

`role="log"` implies `aria-live="polite"`, which would read every streamed token aloud, so the
scroller overrides it to `off`. A separate visually hidden `role="status"` region carries the
turn boundaries instead — “Assistant is responding”, “Assistant finished responding” — one
announcement per transition, none per token. The reader's own messages are never announced back
to them; the region skips the last message when its actor is `currentActorId` or `kind: 'human'`.

## Transcript keyboard model

The transcript is one tab stop, following the model documented by
[MUI X Chat](https://mui.com/x/react-chat/accessibility/).

| Key | Behavior |
| --- | --- |
| Tab / Shift+Tab | Enter or leave the transcript as a single stop |
| Arrow Up / Arrow Down | Move to the previous or next message |
| Home / End | Move to the first or latest loaded message |
| Enter | Drill into links, buttons, disclosures, and actions in the focused message |
| Escape | Return focus from message content to its message article |
| Page Up / Page Down | Preserve native scrolling |

Before interaction, the tab stop follows the latest message. Once a user moves it, the selected
message is remembered. Interactive descendants remain pointer-accessible but leave the tab order
until drill-in. `enableRovingFocus={false}` is available for custom list renderers.

## Composer keyboard model

- Enter submits only when `submitOnEnter` is enabled.
- Shift+Enter always inserts a newline.
- Enter never submits while an IME composition is active.
- A disabled or empty composer does not submit, and neither does one whose only attachments are
  still uploading or have failed — those have no resolvable `url` yet and are excluded from the
  submit payload.
- During streaming, the primary action becomes Stop when `onStop` exists.
- After successful submission, focus remains in the composer. `submitting` and `disabled` make the
  textarea read-only rather than `disabled`, because the browser blurs a disabled element to
  `<body>` and would eject the reader from the conversation on every send.
- Validation errors are associated with the input and announced once.
- File picker, remove, retry, and record controls have visible labels or accessible names.

Touch and coarse-pointer devices must not depend on focusing an outer composer shell or hovering
to reveal essential controls.

## Scrolling

The transcript considers itself following only near the bottom, using a small pixel threshold
rather than exact equality. A `ResizeObserver` on the message container handles content that
grows after render — a late image, an opened disclosure, markdown settling — which would
otherwise push the newest text below the fold while the list still believed it was pinned.

When following stops:

- New messages do not move the viewport.
- A visible affordance reports unseen content and returns to latest.
- Screen-reader announcements remain polite; visual position and announcement are separate.

When older history is prepended, the list preserves an anchor element and its offset. Loading
indicators must not replace existing content.

## Rich content

- Reasoning uses a native disclosure pattern and does not auto-open merely because tokens arrive.
- Code exposes language/filename context and a named copy button.
- Sources expose meaningful link text, hostname context, and safe external-link behavior.
- Tool input/output is collapsed behind a native disclosure, summarized in the header, and
  truncated past a size cap so a large result cannot flood the DOM. The built-in renderer shows
  JSON; a richer representation is a `renderPart` override.
- Approval uses explicit Approve and Deny actions, describes consequences, and retains the chosen
  result after submission.
- Audio uses the native player for play/pause and time, offers a transcript disclosure, and draws
  any supplied waveform as static decorative bars — nothing that animates for a reader who asked
  for less motion.
- Images require non-empty alt text unless explicitly decorative.
- Custom renderers receive the message context needed to label interactive controls correctly.

## Motion, color, density, and responsiveness

- Honor `prefers-reduced-motion`: every spinner carries `motion-reduce:animate-none` and falls
  back to the static icon. Streaming cursors and skeletons must not flash indefinitely.
- Status is never communicated only through color or animation.
- Focus indicators remain visible against incoming, outgoing, tool, and error surfaces.
- Compact density cannot reduce interactive targets below usable touch size. Every control clears
  the 24×24 CSS pixel minimum of WCAG 2.2 SC 2.5.8, including the attachment remove button inside
  its chip.
- Below the `sm` breakpoint, message actions stay permanently visible rather than appearing on
  hover, and approvals remain fully readable without horizontal scrolling.
- Long code, URLs, filenames, and structured tool output wrap or scroll inside their own region
  instead of widening the conversation.

## Security boundary

- Plain text is the default renderer.
- Markdown is sanitized; raw HTML is off by default.
- Links reject unsafe protocols and use `rel="noreferrer noopener"` when opening a new context.
- Filenames are presented as text, never interpreted as markup.
- Bidi embeddings, overrides, and isolates (U+202A–U+202E, U+2066–U+2069) are stripped from actor
  names, filenames, source titles, and custom-part kinds via `stripBidi`, so a filename cannot lie
  about its extension. Directional *marks* are preserved — they carry no reordering power and
  appear in genuine mixed-direction names.
- File type and size hints are presentation only; applications must validate again before upload.
- Every message part renders inside an error boundary — built-in renderers as well as `renderPart`
  overrides. A part that throws is replaced by a notice; the rest of the transcript survives. The
  failure reaches `onRenderError`, or the console when no handler is supplied.
- Unrecognized values are shown, never dereferenced or dropped. A `ChatToolStatus` outside the
  union renders as its own humanized label; an unknown `part.type` renders a visible “cannot
  display” notice rather than vanishing. Both arrive from the network, where the TypeScript union
  guarantees nothing.

## Performance

- Stable message and part IDs are required.
- Streaming updates should replace only the active part, not recreate the whole transcript.
  `ChatMessage` is memoized and the list uses one delegated focus handler rather than a closure
  per message, so replacing a single message in the array re-renders only that message.
- Markdown and syntax highlighting may be deferred until a part settles.
- Renderer callbacks should be stable; docs must show `useCallback` or module-scope renderers.
- Virtualization is deferred from v1, but the DOM/ARIA contract must not prevent a future
  virtualized list.

