# Interaction patterns

How Nebula interfaces behave. These patterns are shared across applications. The
domain content changes from app to app; the behaviour does not. Terms follow
[vocabulary.md](vocabulary.md).

## Workspace shell anatomy

The shell is the common frame around every application. Only the content region
is required; every other region appears only when it is useful.

| Region | Role | Tint today |
|---|---|---|
| Navigation | Persistent destinations and context; collapsible | `@nebula/tint/shell`, `@nebula/tint/navigation` |
| Command palette and search | Global, keyboard-first | `@nebula/tint/shell` |
| Collection pane | Resizable list, tree or table of entities | `@nebula/tint/tree`, `@nebula/tint/table`, `SplitPane` |
| Content | The primary task surface | Domain components |
| Inspector | Secondary details for the selection | `@nebula/tint/table` record panel and inspector tabs |
| Status bar and background activity | Jobs, connection, sync; never blocks the foreground | `@nebula/tint/status`, `@nebula/tint/activity` |

Requirements:

- Deep links restore the route, the selection and the open inspector.
- Navigating away and back keeps the scroll position, filters, drafts and
  selection where that is practical.
- Split views and tabs are used only when the workflow compares or switches
  between items.

## Interaction states

Every control is designed in all the states that apply to it. A state is never
discovered later in an accessibility report.

| State | Signal |
|---|---|
| Default | Base tokens |
| Hover | A subtle surface shift. Never the only route to an action |
| Focus | A visible ring: `--tint-focus`, `--tint-focus-width`, `--tint-focus-offset`. Never hidden or clipped |
| Active (pressed) | An immediate response |
| Selected | `selection` plus a non-colour cue such as a check, weight or indicator |
| Disabled | Muted, with the reason available on focus. `aria-disabled` when it should stay focusable |
| Read-only | Still selectable and copyable, and visibly not editable |
| Pending | Bound to a real in-flight request, with cancel where it is supported |
| Succeeded / Failed | The outcome in words. A failure says what happened and what to do |
| Stale | The data's age is shown; refresh is offered |

## Operational state

Never fabricate execution, progress, connectivity, synchronization or agent
activity. These are distinct states, and each needs its own visual treatment:

| Condition | Show |
|---|---|
| No data (loaded, and empty) | Why it is empty, and the next action if there is one |
| Not loaded yet | A skeleton or spinner tied to the request |
| Unavailable (the service failed) | The error, with retry |
| Stale | Last-updated time, with refresh |
| Permission denied | What is restricted and who can grant it. Never an empty list |
| Offline or reconnecting | The connection state, plus which actions are queued and which are blocked |
| Operation pending | Determinate progress only when real measurements exist |
| Operation failed | The cause, recovery steps and preserved input |

- Background work stays inspectable and can be cancelled where the server
  supports it.
- Use optimistic updates only when rollback is reliable, and show the rollback
  when it happens.

## Human and agent content

- Keep these visibly distinct: user-authored messages, agent-authored messages,
  external or imported data, and system events.
- Agent execution shows its real state: queued, running, waiting for approval,
  succeeded, failed, cancelled. Tool calls and their results can be inspected.
- No typing indicator or "thinking" state is shown unless execution is actually
  happening.
- Approval boundaries are explicit controls with a clear consequence, never an
  implied "continue".
- Artifacts (generated files, images, code) appear as separate inspectable items,
  not inline prose.
- Agents compose registered Tint components through typed contracts. They do not
  invent styling or markup ([architecture/extensibility.md](architecture/extensibility.md)).

Tint's `@nebula/tint/chat` (`ChatTool`, `ChatApproval`, `ChatArtifact`,
`ChatReasoning`) implements most of this for conversational views.

## Feed and associated channel (proposed)

> **Status: proposed pattern.** It comes from the 2026-11-28 design sketch. No
> Gateway feed contract exists, and Tint's feed model (`core/feed`) is mock-only.
> Nothing here may be implemented as if it were an existing contract.

A **feed** and its associated **channel** are two complementary views of one
connected information space.

- **Feed:** discovery, aggregation and consumption. Items arrive from feed sources.
- **Channel:** discussion, participation and agent interaction about those items.

The rules that hold the pattern together:

1. **Feed items reference underlying content.** A feed item points to an entity,
   a resource or an event, and does not copy it. The same item can appear in
   more than one feed, subject to permissions.
2. **A feed is not a channel, and a feed item is not a message.** They have
   separate identities and lifecycles, even when one shell shows them side by side.
3. **Discussion references the item.** Channel messages can carry a reference to
   a feed item. Users and agents reply to the referencing message (`Reply` and
   `Thread` as in [vocabulary.md](vocabulary.md)).
4. **Navigation keeps context:**
   - Opening a feed item keeps the feed's scroll position and selection.
   - Choosing "Discuss" opens the associated channel context on the message that
     references the item.
   - A reference navigates back to the original item, and the original item
     links to its discussion.
5. **Counts come from relationships.** Discussion counts on an item are derived
   from the actual references and replies, never stored separately or estimated.
6. **Refreshing never moves the reader.** New items are announced (a polite live
   region and a "N new items" control) and inserted without shifting the item
   being read.
7. **Search crosses both, with permissions.** Search covers source content and the
   associated discussion. Results the user cannot read are never shown, counted
   or hinted at.
8. **Keyboard and screen-reader parity.** Users can move from an item to its
   discussion and back, and from a reply to the item it references, without a
   pointer. Each reference has an accessible name that says what it points to.

### Component candidates

Candidates to reconcile against [components.md](../components.md) before
building. These are not instructions to create new components.

| Candidate | Closest existing Tint component | Gap |
|---|---|---|
| `FeedView` | `FeedLayout` (wall, list, magazine, ticker, carousel, feed) | None for rendering. Live-update insertion rules (rule 6) not verified |
| `FeedItem` | `FeedEntryRow`, `FeedEntryCard`, `FeedEntryView` | No discussion summary slot |
| `FeedSourceLabel` | `SourceHealthBadge` | Shows health, not provenance or attribution |
| `EntityReference` | None (`MediaReference` is a Gateway contract for URL previews) | A new primitive; needs the Reference contract |
| `ChannelView` | None in Tint. The gateway has app-level `MessageTimeline` and `ThreadPane` | Should it move into Tint? |
| `MessageList` | `ChatMessageList` | Channel semantics (multi-author) vs chat semantics (assistant) |
| `MessageComposer` | `ChatComposer` | No reference attachment |
| `ReplyContext` | None | Needed for rule 3 |
| `DiscussionSummary` | None | Needs derived counts (rule 5) |
| `ChannelSearch` | None | Needs permission-aware search |

### Open decisions

- **Cardinality.** One associated channel per feed, per source, or per item
  discussion?
- **Persistence.** Is the reference a message attachment, a graph edge (Apache
  AGE), or both?
- **Ownership.** Does a discussion belong to the channel, the feed item or the
  underlying entity? This decides retention and permissions.
- **Naming.** Tint's feed `Channel` and the Gateway `Channel`. One type or two?

## Narrow widths

Do not just shrink the desktop layout.

- Collapse secondary navigation into a menu.
- Turn inspectors into drawers or dedicated routes.
- Keep the primary task surface and the reading order.
- Allow horizontal overflow only for content that is genuinely two-dimensional,
  such as tables, canvases and timelines.
- Keep target sizes accessible ([style-guide.md](style-guide.md#controls-and-targets-r4)).

## Confirmation and undo

- Prefer undo for reversible actions.
- Confirm only destructive or irreversible ones, and name the object and the
  consequence.
- Avoid modal dialogs when inline or non-blocking feedback works.
