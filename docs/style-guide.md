# Style guide

How Nebula interfaces look. This page states the visual language and the
reasoning behind it. Token names and values are defined in the token contract
(`src/styles/contract.css`, `src/styles/layout-scale.css`, `src/styles/themes/`).
The token reference, with its Carbon mapping, is [design/tokens.md](design/tokens.md).
What to avoid is in [anti-patterns.md](anti-patterns.md). How things behave is in
[patterns.md](patterns.md).

## Influences

We take principles from these products, never their branding.

| Source | Principle we take |
|---|---|
| Notion | Content first, chrome second. Contextual controls. Progressive disclosure. The same records shown as table, gallery or board without changing identity. |
| Cloudflare | Operational clarity: dense, structured navigation, functional tables, honest system states. |
| Apple | Interaction craft: spatial consistency, typography, direct manipulation, accessibility as a default. |
| Anthropic | Reading comfort, calm surfaces, a clear line between human and agent work, artifacts kept apart from conversation. |
| Steam | Collection management: persistent navigation, rich detail views, background activity, media-first discovery. |
| IBM Carbon | Structure: grid, spacing rhythm, form patterns, density discipline. Tint bridges to Carbon names ([design/tokens.md](design/tokens.md)). |
| Meta Astryx | Tool-grade density and structured filter entry (Tokenizer). |

Software architecture and extensibility references are kept separate from
these visual influences. Vercel UI SDK, Vercel AI SDK, AI Elements and Roblox
are described in [architecture/overview.md](architecture/overview.md#references).

## Four independent axes

Every surface is configured on four axes. They are orthogonal, so any
combination is valid. For example, an operational surface can be shown at
comfortable density in a dark theme with touch input.

| Axis | Values | Mechanism |
|---|---|---|
| Composition mode | operational, editorial, immersive | Choice of layout and components (below) |
| Density | compact, default, comfortable | **Proposed** token set; not implemented ([open decisions](#open-decisions)) |
| Theme | `tint` (default), `solarized`, `gruvbox`, `latte`, `frappe`, `macchiato`, `mocha`, `carbon`, `nebula-beta`; each `light`, `dark` or system | `[data-theme]` and `[data-scheme]`, see `src/styles/contract.css` |
| Input modality | pointer, keyboard, touch, assistive technology | Media queries (`pointer: coarse`, `prefers-reduced-motion`) and required behaviour ([accessibility.md](accessibility.md)) |

### Composition modes

- **Operational.** Logs, inference evaluation, downloads, administration and job
  queues. Dense, structured and tabular. The user is scanning and acting.
- **Editorial.** Threads, documents, research and agent conversations. A reading
  measure of 65 to 80 characters, calm surfaces and generous line height. The
  user is reading and writing.
- **Immersive.** Media collections, the lightbox, persona studio, the watch
  stage and creative tools. The media is the interface and chrome recedes. This
  is the only mode where translucent glass surfaces are allowed (see
  [Surfaces](#surfaces)).

All three use the same tokens, primitives and accessibility contract.

## Colour

Components use semantic tokens only: `bg`, `surface`, `panel`, `field`, `ink`,
`muted`, `border`, `border-strong`, `accent*`, `focus`, `selection`, the status
families (`danger`, `warning`, `success`, `info`, each with `-soft` and `-ink`)
and the `code-*` and `chrome-*` groups. The meaning of each is in
[design/tokens.md](design/tokens.md).

- Accent marks the primary action, focus and the current selection. It is never
  decoration.
- Selection uses `selection`, not `accent`. They are different concepts, even
  where a theme makes them look alike.
- Status colours mark state only, and always pair with text or an icon. Colour
  alone never carries meaning.
- Write the status name as `danger`, not `error`.
- No raw colour literals in components. Theme values live only in
  `src/styles/themes/`. Consumers are held to this by an incremental gate.

### Token authority (R7)

Penpot owns design intent and the versioned Tint token contract owns runtime
values. The intended sync path is:

1. Export from Penpot at a pinned version.
2. Run the adapter, which validates and normalizes the export.
3. Write generated `tokens.css` and `tokens.ts`.
4. Run a drift check that regenerates and diffs.

Today the pipeline is unmerged (`feat/penpot-design-system`, see
[plans/2026-11-03-tint-refactor-status.md](plans/2026-11-03-tint-refactor-status.md)).
**Until it lands, the CSS files in `src/styles/` are both intent and runtime.**
Every theme must define every token, and `src/styles/themes.test.ts` enforces
parity and contrast pairs.

The 2026-11 design draft included hex palettes. They are illustrative only and
are not adopted values.

## Typography

IBM Plex Sans and Plex Mono, declared in Tailwind `@theme`. Roles map onto the
existing scale (R6). Never introduce an intermediate size.

| Role | Token | Current value | Weight |
|---|---|---|---|
| Page title | `--tint-font-size-xl` | 1.75rem (28px) | 600 |
| Section title | `--tint-font-size-lg` | 1.25rem (20px) | 600 |
| Component title | `--tint-font-size-sm` | 0.875rem (14px) | 600 |
| Body | `--tint-font-size-sm` (operational), `--tint-font-size-md` (editorial) | 14px / 16px | 400 |
| Metadata | `--tint-font-size-xs` | 0.75rem (12px) | 400 |

- Line height comes from `--tint-leading-tight` (headings and controls) or
  `--tint-leading-normal` (prose).
- Monospace is reserved for code, logs, identifiers, hashes and numeric readouts
  that must align.
- Editorial typography (serif, larger measure) is allowed only on long-form
  reading surfaces.

## Spacing and layout

Use the 4px scale `--tint-space-1` to `--tint-space-7` (4, 8, 12, 16, 24, 32 and
48px), as approved in R5.

- 4: micro gaps
- 8: related controls
- 12: inside a component
- 16: standard padding
- 24: between sections
- 32 and 48: major separation

| Layout | Guidance |
|---|---|
| Sidebar | 224 to 280px, collapsible |
| Inspector | 320 to 400px, becomes a drawer at narrow widths |
| Reading measure | 65 to 80 characters |
| Tables | Compact row about 32px, standard about 40px |

Whitespace has to earn its place. Large empty regions on an operational surface
are a defect.

## Controls and targets (R4)

Keep **visual height** separate from **interactive target**. A control can look
compact while its hit area is larger.

| Token | Current value | Use |
|---|---|---|
| `--tint-control-sm` | 1.75rem (28px) | Dense toolbars, table cells |
| `--tint-control-md` | 2.25rem (36px) | Default |
| `--tint-control-lg` | 2.75rem (44px) | Touch-first and primary actions; also the touch target size |

- The interactive target is never smaller than 24×24 CSS px (WCAG 2.2 AA 2.5.8).
- Under `pointer: coarse`, interactive targets are 44×44, even when the visual
  stays smaller.

## Surfaces

- Default to solid surfaces. `bg` is the canvas. `surface` and `panel` are two
  levels of depth, and `field` is the input inset.
- Hierarchy comes from surface level, text weight and alignment, not from boxes
  inside boxes. Use at most one border or one surface step per nesting level.
- A list, table, section or divider is better than a card when no independent
  container is needed.
- **Glass** (translucent, blurred) is allowed only in immersive compositions
  over media, such as a stage HUD, lightbox chrome or video overlays. The text
  on it must still meet contrast against the worst-case background. The
  gateway's `e2e-svelte/contrast.spec.ts` shows how to sample backgrounds behind
  glass. "Tinted Glass" is a theme direction, not the default surface.
- Shadows mark elevation that actually overlaps content: menus, popovers,
  dialogs, toasts. Static panels get no shadow.

## Radius (R3)

| Token | Current value | Use |
|---|---|---|
| `--tint-radius-sm` | 0.25rem (4px) | Inputs, chips, small controls |
| `--tint-radius-md` | 0.45rem (7.2px) | Buttons and panels (matches `.tint-button`) |
| `--tint-radius-lg` | 0.75rem (12px) | Dialogs and large overlays |
| `--tint-radius-full` | 9999px | Avatars and status dots only |

A new radius needs a documented semantic token, never a component-local value.
Pill-shaped buttons and navigation are not used ([anti-patterns.md](anti-patterns.md)).

## Iconography

One family: Lucide, through Tint's `Icon` (`@nebula/tint/icon`).

- An icon with no visible text label needs an accessible name.
- Icons are 16px in dense contexts and 20px by default.
- No emoji as interface iconography. Emoji in user content and reactions is
  content, not chrome.

## Motion

Use `--tint-motion-fast` (110ms) and `--tint-motion-base` (180ms) with
`--tint-ease`.

- Motion explains change. Typical uses are opening a panel, moving a selection
  or confirming an action.
- Under `prefers-reduced-motion` the durations resolve to 0, and spatial motion
  becomes an opacity change or nothing.
- No ambient or decorative animation on operational surfaces.

## Imagery

- Media is content. Show it at its native aspect ratio, with stable dimensions
  reserved before load to avoid layout shift.
- No generic AI illustration or stock decoration in empty states. Explain the
  state in words instead ([patterns.md](patterns.md#operational-state)).

## Open decisions

These approved reconciliation decisions (2026-11-28) conflict with what Tint
ships. Under R7 the shipped values stay in force until a decision changes them.
None of them is resolved silently here.

| Row | Approved decision | What `src/styles/layout-scale.css` ships | Needed |
|---|---|---|---|
| R3 radius | Keep 0/2/4/8 plus round (from the 2026-11-03 component docs) | sm 4, md 7.2, lg 12, full | Adopt the shipped scale, or migrate the components to 2/4/8 |
| R4 density | Density tokens 24/32/40, plus a 44 touch target | Control heights 28/36/44; no density token set | Define density as a token set, or keep three control sizes |
| R6 type | Page title = xl 24 | xl is 28 | Accept 28 or change the token |
| Layers | Semantic z-index layer tokens | None (no `--tint-layer-*`) | Add layer tokens; consumer z-index literals stay warnings until then |
| Motion | 100/160/240ms (component docs) | 110/180ms | Confirm the shipped values |

The component-docs proposals are preserved in
[plans/2026-11-03-tint-component-docs.md](plans/2026-11-03-tint-component-docs.md).
