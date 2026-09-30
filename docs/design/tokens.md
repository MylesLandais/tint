# Tint tokens and the Carbon bridge

Tint's `--tint-*` tokens are the public vocabulary and the only thing themes
declare. `src/styles/carbon-bridge.css` derives Carbon's `--cds-*` names from
them, one way:

```text
--tint-*  ->  --cds-*  ->  components
```

Carbon is a naming and pattern reference. It is not an npm dependency, and
components are Tint-native Svelte (see "Button" below). The bridge is mapped by
purpose, not colour: a selected row is not `--cds-interactive` just because both
happen to be blue in one theme.

## Colour tokens (themed, all 7 themes)

| Tint token | Meaning | Carbon analogue | Notes |
|---|---|---|---|
| `bg` | Page background | `background` | |
| `surface` | Secondary page tone | `layer-02` | Tint has two depths, so `layer-03` reuses `panel`. |
| `panel` | Raised container | `layer-01`, `layer-03` | |
| `field` | Input fill, inset from the panel | `field-01`, `field-02` | New in Step 2. |
| `ink` | Primary text and icons | `text-primary`, `icon-primary` | |
| `muted` | Secondary text, helper, placeholder | `text-secondary`, `text-helper`, `text-placeholder`, `icon-secondary` | No separate "subtle" token: the audit found no case that needs one. |
| `border` | Default divider and outline | `border-subtle-01/02` | |
| `border-strong` | Emphasised outline | `border-strong-01` | |
| `accent`, `accent-hover` | Primary interactive colour | `interactive`, `button-primary(-hover)`, `border-interactive` | |
| `accent-soft` | Tinted accent wash | `highlight` | |
| `on-accent` | Text on accent | `text-on-color` | |
| `focus` | Keyboard focus ring | `focus` | New in Step 2. |
| `selection` | Selected row, token or option | `layer-selected-01` | New in Step 2. Not the same concept as `accent`. |
| `danger`, `warning`, `success`, `info` (+ `-soft`, `-ink`) | Status | `support-error/warning/success/info`, `text-error` | `-soft` and `-ink` have no Carbon equivalent and stay Tint-only. |
| `shadow-color` | Elevation shadow colour | none | Carbon shadows are fixed. |
| `code-*`, `chrome-*` | Code blocks, media chrome | none | Tint-only. |

Derived, no token of their own: `layer-hover-01` is `color-mix(panel, ink 6%)`.

## Layout scale (not themed, `src/styles/layout-scale.css`)

| Group | Tokens |
|---|---|
| Spacing (4px base) | `space-1` to `space-7` |
| Radius | `radius-sm`, `radius-md` (0.45rem, matches `.tint-button`), `radius-lg`, `radius-full` |
| Control height | `control-sm`, `control-md` (2.25rem, matches `.tint-button`), `control-lg` |
| Type | `font-size-xs` to `font-size-xl`, `leading-tight`, `leading-normal` |
| Focus ring | `focus-width`, `focus-offset` |
| Motion | `motion-fast`, `motion-base`, `ease` (durations go to 0 under `prefers-reduced-motion`) |

Typefaces stay in Tailwind's `@theme` (`--font-sans`, `--font-mono`, IBM Plex).
`.tint-button` still hard-codes its own radius, height and outline; moving it onto
these tokens is a later chore.

## Theme scope

The bridge is declared on `:root, [data-theme]` so a theme applied to a subtree
re-resolves it there. Adding a colour token means: `src/styles/contract.css`
(`@theme inline` bridge), all 7 files in `src/styles/themes/`, and, if it has a
text role, a pair in `themes.test.ts` (`CONTRAST_PAIRS`).

## Decision log

- **Carbon dependency:** none. The isolation test bans `carbon-components-svelte`
  outside `src/svelte/internal/carbon/`, so a Carbon-backed adapter can be added later without
  touching consumers.
- **Button:** Tint-native, keeping the `.tint-button` `data-variant`/`data-size`
  contract, rather than wrapping Carbon Button. Reason: no dependency, and
  Tint's existing public behaviour and styling are preserved.
