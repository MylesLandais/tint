/**
 * The icon glyph size scale, in CSS pixels. Same steps as the React scale in
 * `components/icon/sizes.ts` (size-3 .. size-6), expressed as numbers so the
 * Svelte layer needs no Tailwind. Tint owns icon scale; consumers pick a step.
 */
export const ICON_PX = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 } as const

export type IconSize = keyof typeof ICON_PX
