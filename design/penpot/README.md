# Tint in Penpot

Tint CSS owns token values; Svelte owns component behavior and public props.
The versioned component map connects these sources to real Penpot objects.
Penpot is the collaborative editing environment for the kit. Changes to tokens
start in CSS and are exported in this repository.

## Export and check

```sh
npm ci --ignore-scripts
npm run design:export
npm run design:check
npm run design:test
npm run design:report
```

`scripts/export-tokens.mjs` produces typed
[DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/) token documents
under `design/tokens/`: a global scale, a reduced-motion override, and a color
set for each palette and scheme. Eight palettes are discovered from CSS,
including Carbon. Fixed Catppuccin flavors have identical values in the two
scheme contexts; the exporter does not invent an alternate palette.

Import `design/penpot/tokens.json` in the owning Penpot file through Tokens →
Tools → Import. This file uses Penpot's
[CSS-valued sets and themes format](https://penpot.app/blog/a-practical-guide-to-the-design-tokens-json-format/),
which differs from typed DTCG values. It converts `rem` using an explicit
16px root size. Motion durations and easing stay in DTCG and CSS; they are
listed as excluded from the Penpot profile in `token-manifest.json`. Each
token retains its CSS name, authored expression, source path and line.
The manifest records input hashes. Source hashes make generation independent of
Git's current HEAD and dirty state, so exporting before a source commit remains
valid after that commit. Record the reviewed source commit in the Forgejo review.

The eight palettes expose 16 mutually exclusive options in one `Palette`
theme group. Activating a choice enables the global set and one palette set.
Import into the library-owning file; Penpot disables import when a connected
library is the file's token source. See the
[Penpot token guide](https://help.penpot.app/user-guide/design-systems/design-tokens/).

## Component identities

`component-map.json` inventories production `.svelte` files below
`src/svelte`, excluding the Design Lab and named test fixtures/probes. It
distinguishes public package exports from internal components. Inventory
coverage does not mean every wrapper needs its own editable canvas component.

`scripts/design-inventory.mjs --write` preserves existing component identities
and Penpot references. Source removal with an existing Penpot reference requires
explicit migration. Every entry has a source digest and one of these statuses:

| Status | Meaning |
| --- | --- |
| `pending-import` | No verified Penpot file/component IDs recorded |
| `needs-review` | IDs exist, but the current source digest has not been validated |
| `mapped` | IDs and a matching validated source digest have been recorded |

After importing and reviewing an editable component, record its actual
`penpot.fileId`, `penpot.componentId`, and the reviewed `sourceSha256` in
`penpot.validatedSourceSha256`, then refresh the map. Never synthesize Penpot
IDs. Local validation checks their shape and source consistency; it does not
contact Penpot or prove visual parity. Pending entries are reported without
failing the initial export check. Forgejo enforcement of mapping completeness
and visual drift is a later milestone.

## First slice: voice client controls

The `voice-client` priority marks reusable components for these workflows:

| Workflow | Existing Tint building blocks |
| --- | --- |
| Client connection and health | `ConnectionStatus`, `StatusIcon`, `Badge`, `Skeleton`, `ErrorState` |
| Inference model selection | `Typeahead`, `Select`, `Popover`, `Menu` |
| Model search and retrieval | `Typeahead`, `ProgressBar`, status and error components |
| Audio inside the chat container | `ChatMessageList`, `ChatMessage`, `ChatPart`, `ChatAudio`, `MediaPlayer`, `Waveform` |
| Persona and reference-voice controls | `CharacterLibrary`, `CharacterDocumentEditor`, `PersonaEditor`, `SelectField`, `FileField` |

These are building blocks, not claims of a complete model manager or voice
binding UI. Hugging Face search, artifact pulls, runtime health and model
selection remain host operations. Persona reference-voice assignment and
switching remain host-owned state. Existing `PersonaEditor` is not a new persona
schema or a replacement for the Character Card v3 fork; that contract needs its
own implementation decision. App-screen references belong in the consuming
Workspace repository once those screens are designed.

## Agent editing

Work only in a dedicated sandbox file. Treat the published Tint UI Kit as a
read-only reference until a reviewed promotion is authorized. Keep one agent
writer per file, record the starting revision, and release the file before
another writer takes over. The MCP plugin must stay open and connected in a
browser tab; an MCP endpoint alone does not supply an editing session.

Community templates enter the sandbox with author, source URL, license and
revision recorded. Match or extend Tint components using Tint tokens before
introducing another component. Screenshots are references; imported components
must remain editable. Keep credentials and personal reference-audio transcripts
out of the repository and exports.

The Workspace repository owns deployment URL and tailnet instructions. Library
rules and generated artifacts live here, are included in the package, and move
to consumers through a reviewed release or submodule pin.
