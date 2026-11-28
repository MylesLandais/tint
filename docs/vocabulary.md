# Product vocabulary

What Nebula's words mean, so every surface and every agent uses the same ones.

> **Interim, hand-written.** The canonical source of meaning is the Nebula
> ontology registry. This page is a readable projection of it, written by hand
> until the registry carries terminology fields
> ([RFC 0044](https://git.nebula-1.com/warbee/workspace/src/branch/dev/docs/rfcs/0044-product-terminology-in-ontology-registry.md),
> proposed). Once that lands, this page is generated, and edits go to the
> registry.

Each term has a status:

- **Active**: implemented. The evidence column names the contract or code.
- **Proposed**: a design candidate with no implementation. Do not build it as
  if it existed. Do not name new types after it without the RFC.
- **Conflict**: the word already means something else in code. Resolve the
  conflict before using the proposed meaning.

Evidence was checked on 2026-11-27 against Tint `4664af3` and Nebula `dev`
(`d21cc2c41`). Evidence paths starting with `channel-v1` and the like are
Nebula's generated contracts (`@nebula/contracts-generated/<name>`).

## Entities, presentation, interaction, components

Keep four vocabularies apart:

| Vocabulary | Examples | Who owns it |
|---|---|---|
| Domain entities | Channel, Message, Thread, Participant, Asset | Ontology and Gateway contracts |
| Presentations | List, tree, gallery, timeline, wall, magazine, canvas | Tint |
| Interactions | Open, inspect, select, search, filter, reply, archive | Tint patterns |
| Components | `ChatMessageList`, `FeedLayout`, `SplitPane` | Tint, listed in [components.md](../components.md) |

A presentation never redefines an entity. A Channel rendered as a tree is still
a Channel, not a folder. A Thread rendered chronologically is still a Thread, not
a "chat session". Changing how something is shown never needs a new entity name.

## Terms

### Channel: active

The persistent social and organizational destination. It owns membership,
permissions and history. Ending an activity in a channel never deletes the
channel.

- **Evidence:**
  - `channel-v1` `Channel`, `ChannelCategory` and the timeline APIs
  - RFC 0037 "Ownership and vocabulary"
  - Tint `core/feed` `Channel` (`{ id, slug, name }`, the routeable place where feed sources land)
  - Tint `core/activity` `ForumChannel`
- **Note:** the Tint feed and activity channel types are mock-only presentation
  contracts. They share the `{ id, slug, name }` convention but are not the
  Gateway `Channel`, and a later change unifies them.
- **Use:** "channel". **Avoid:** "room". That word is retired in code
  (`watch rooms` became `WatchSession`), and comments still saying "room" are
  debt.

### Message: active

An authored entry in a channel timeline.

- **Evidence:** `channel-v1` `ChannelMessage`.
- **Authorship:** the author is a principal. An agent's message carries the
  agent's own principal, never that of whoever prompted it. Interfaces must keep
  human-authored and agent-authored messages visibly distinct.

### Reply: active

A message that responds to another message.

- **Evidence:** `ChannelMessage.reply_to_message_id`.

### Thread: active (decided 2026-11-28)

A conversation: a durable chain of messages or posts, with its participants
(human and agent), attachments, tool activity and the artifacts produced in it.

A Thread can start in three ways:
- **from a channel message**, as a reply thread
- **as a forum post**, the forum presentation
- **standalone**, as a conversation with an agent

Starting a thread from a message is one way to create a Thread. It is not a
separate entity.

- **Evidence:**
  - `channel-v1` message-rooted threads: `ChannelMessage.thread_root_message_id`,
    `ThreadSummary { reply_count, last_activity_seq }` and
    `GET /channels/{id}/threads/{root}/messages`
  - Tint `core/activity` `ForumThread` (mock), the forum presentation
  - the gateway's saved threads and Maya conversations, the standalone
    conversations
- **Contracts today:** the message-rooted thread is the only Gateway contract.
  Standalone conversations have their own types until a shared Thread contract
  lands (RFC 0044).
- **Use:** "thread" in code and copy. "Conversation" is fine as a contextual
  label in conversational views, and "post" in forum views.
- **Use:** "Open thread", "Reply in thread", "New thread".
- **Avoid:** "chat session", "room".

### Participant: active

One principal taking part in one `WatchSession`. Each device has its own
connection. Participation does not imply channel membership.

- **Evidence:** `lib/protocol` `Participant` (watch sessions) and RFC 0037.

### Session: active, scoped

A time-bounded activity in a channel. Today that means `WatchSession`.

- **Evidence:** `lib/protocol` `WatchSession`, `watch-v1`.
- **Note:** "workspace session" (Tint `framebuffer` discovery) is a separate
  runtime concept. Always qualify which session you mean.

### Stream: active, as UI copy

User-facing copy for an inbound feed source ("streams into this channel").

- **Evidence:** the Tint `core/feed` `Source` doc comment says UI copy may say
  "stream", but the code name stays `Source`.
- **Note:** a media stream (HLS or watch playback) is a different, technical
  use. Qualify it.

### Feed: active in Tint (mock), proposed as a domain entity

An ordered aggregation of discoverable items from one or more sources.

- **Evidence:** Tint `core/feed` `FeedDocument` holds channels, sources, entries
  and policy matches with a revision token. It is mock-only: fixtures stand in
  for a server, and there is no Gateway feed contract yet.
- **A Feed is not a Channel.** A channel can be fed by sources and can host
  discussion of feed items, but the feed is the discovery surface and the
  channel is the interaction context.

### Feed item: active in Tint (mock) as `FeedEntry`

An addressable entry in a feed that references content, an entity or an event.

- **Evidence:** Tint `core/feed` `FeedEntry`, which has read state, content kind,
  download status and automation steps. The closest Gateway contract is
  `entity-activity-v1` `ActivityItem`, an entity's publication, story, comment or
  profile change.
- **A feed item is not a Message.** Discussing an item creates messages that
  *reference* it, and the item itself is unchanged.
- **Use:** "item" in UI copy; `FeedEntry` in code.

### Feed source: active in Tint (mock) as `Source`

A configured origin of feed items: a platform endpoint, a bound workflow and a
health state.

- **Evidence:** Tint `core/feed` `Source`, `SourceHealth`.

### Subscription: active (entity-level)

A per-principal setting that controls which information is received or
surfaced.

- **Evidence:** `entity-activity-v1` `SubscriptionResponse { subscribed, state }`
  and `SubscriptionToggleRequest`.
- **Note:** RFC 0037 reserves an "authorization epoch" for future watch
  subscriptions. That use is not implemented.

### Reference: active (media), proposed (general)

**Active meaning:** a resolved preview of a URL in a message.

- **Evidence:** `channel-v1` `MediaReference`, which has `outcome`,
  `canonical_url` and `provider`.

**Proposed meaning:** a typed relationship from a message to any existing entity
(a feed item, an asset, an artifact), so a channel can discuss an item without
copying it.

### Asset: active

An identifiable digital resource that can be referenced, inspected or organized.

- **Evidence:** `AssetRef` in Nebula `lib/data` (creative library).

### Artifact: active, with a Tint collision

A resource produced by an identifiable execution, with provenance.

- **Evidence:** `ArtifactRef` in Nebula `lib/data` (automation), and the Tint
  `chat` component `ChatArtifact`.
- **Collision:** Tint `core/feed` `ArtifactStatus` describes the *download state
  of a feed item's file*. That is narrower than Artifact. Keep the name in code
  until the feed contract moves to the Gateway, and do not reuse it elsewhere.

### Agent: active

A non-human principal that authors messages and runs tools. Its activity is
shown as execution state (pending, running, waiting for approval, failed,
cancelled), never as a person "typing" while nothing is executing.

### Workspace: decided meaning (2026-11-28), no domain type yet

The modular root container. It is a project-like space that holds a set of
channels and resources, with a layout for its viewports. Think of a Notion
teamspace or a Discord guild, with Slack-style channels inside.

What a workspace might be:
- a game-hacking interface
- a live production space with streaming channels (Twitch, Zoom, FaceTime)
- an asset collection
- a set of shared tables (like Notion databases)
- any other arrangement of components

A workspace contains:

| Part | Meaning | Status |
|---|---|---|
| Channels | Persistent interaction contexts: discussion, live stream, feed discussion | Channel is active (`channel-v1`). Channel *kinds* are proposed |
| Resources | Asset collections, shared tables, documents, diagrams | Assets are active. Collections and tables as workspace resources are proposed |
| Layouts | The arrangement of components for the workspace and channel viewports | Proposed. No workspace layout contract exists. Tint's `CollectionWorkspaceLayout` (alias `WorkspaceLayout`) is the collection layout's state, not this. The nearest precedent is Nebula's declarative `ViewSpec` |
| Members and permissions | Who can see and do what | Channel membership is active. Workspace membership is proposed |
| Sessions and runtimes | Running activity inside the workspace (watch sessions, game sessions, sandboxes) | Active, as the qualified terms below |

**Deconflicting the shipped uses.** "Workspace" alone always means the root
container. Every shipped use is a qualified compound that names something
*inside or about* a workspace:

| Shipped name | Read it as | Change |
|---|---|---|
| Tint `framebuffer` workspace sessions | A **workspace session**: a running session, such as a game client, inside a workspace | None. Always say "workspace session" |
| Gateway `workspace_runtime`, workspace sandboxes | A **workspace runtime**: execution capacity attached to a workspace | None. Always say "workspace runtime" |
| Tint `CollectionWorkspace` | A **collection layout**: one layout for a collection resource | Rename candidate (`CollectionView`) in a separate, breaking change. It needs the compatibility pattern in `docs/migrations/workspace-names.md` |

Open decisions (RFC 0044):
- Are collections and tables channel kinds, or sibling resources?
- How are workspace membership and channel membership related?
- What is the layout contract (the declarative `ViewSpec` precedent)?

There is no `Workspace` domain type yet. Do not create one without the RFC.

## Cross-product correspondences

These are approximate correspondences, not schema equivalences. They are for
mapping imported data and for explaining Nebula to people who know other
products.

| Nebula | Discord | Slack | Notion | Claude / ChatGPT |
|---|---|---|---|---|
| Channel | Channel | Channel | Page, partially | (none) |
| Thread | Thread, or forum post | Thread | Discussion or comments | Conversation |
| Message | Message | Message | Comment | Message |
| Asset | Attachment | File | File | File |
| Agent | Bot or app | App | AI or agent | Assistant |
| Workspace | Server (guild) | Workspace | Teamspace | Project, partially |

Imported records keep their source term as provenance, so a ChatGPT
"conversation" stays labelled as a conversation. It maps to a Nebula concept only
where the mapping is supported.

## Usage rules

- Sentence case everywhere.
- Verbs for actions ("Open thread", "Reply", "Subscribe"), nouns for destinations ("Channels", "Feed").
- Use the preferred term in code and copy. A contextual label is fine only in its context, for example "Conversation" in a conversational view.
- A new name for an existing entity is a contract change. Propose it in RFC 0044; never introduce it in a component.
