/**
 * The icon glyph size scale. A TS map, not a `--tint-*` token: the contract in
 * `styles/contract.css` is reserved for values a theme swaps (palette,
 * elevation) — icon size is layout, not palette, and no shipped or planned
 * theme varies it.
 */
export const ICON_SIZES = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-6',
} as const satisfies Record<string, string>

export type IconSize = keyof typeof ICON_SIZES
