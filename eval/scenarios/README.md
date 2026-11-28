# Frontend eval scenarios

This is an index only. Fixtures, task text and acceptance criteria are written
per scenario as each one is built (M3 onwards). Every scenario runs at the same
viewports:
- 1440×900
- 1024×768
- 390×844 (touch)
- 320 CSS px (reflow)

Each runs in light and dark themes.

| ID | Surface | Primary evaluation | Closest Tint components today |
|---|---|---|---|
| FE-001 | Unified conversation archive | Dense navigation and search | `chat`, `navigation`, `shell` |
| FE-002 | Media asset collection | Virtualization and discovery | `media-assets`, `table` |
| FE-003 | Image lightbox | Keyboard interaction and media controls | `media` |
| FE-004 | Model comparison | Tables, metrics, hierarchy | `table`, `charts` |
| FE-005 | Workflow graph editor | Complex interaction and focus management | `graph` |
| FE-006 | Agent execution inspector | Live state and provenance | `chat` (`ChatTool`, `ChatApproval`), `activity` |
| FE-007 | Persona studio | Complex forms and media references | `form`, `character-card` |
| FE-008 | Download manager | Background jobs and operational states | `feed` (`AutomationQueuePanel`), `progress` |
| FE-009 | Settings and accounts | Forms, validation, permissions | `form`, `auth` |
| FE-010 | Graph retrieval explorer | Relationships and progressive disclosure | `graph`, `tree` |
| FE-011 | Document reader | Typography and reading accessibility | `feed` (`ReaderPane`), `editor` |
| FE-012 | Global command palette | Search, keyboard, focus | `shell` (`CommandPalette`) |
| FE-013 | Aggregated feed with mixed content | Heterogeneous items, source provenance | `feed` (`FeedLayout`, `FeedEntryRow`) |
| FE-014 | Navigating from a feed item to its channel discussion | Context preservation ([patterns](../../docs/patterns.md#feed-and-associated-channel-proposed)) | `feed`, `SplitPane` |
| FE-015 | Entity references and contextual replies | Reference navigation, reply context, accessible names | `chat` (none for references yet) |
| FE-016 | Live feed updates without disturbing the reader | Insertion, announcement, scroll stability | `feed` |
| FE-017 | Humans and agents discussing a feed item | Authorship distinction, execution state | `chat`, `feed` |
| FE-018 | Search across surfaces and graph retrieval | Permission-aware results across source and discussion | `shell`, `graph` |

FE-013 to FE-018 exercise the proposed feed and channel pattern. Their fixtures
are marked experimental until a Gateway feed contract exists.
