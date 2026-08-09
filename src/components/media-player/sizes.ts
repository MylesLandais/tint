/**
 * The MediaPlayer size-tier scale. A TS map, not a `--tint-*` token, mirroring
 * `ICON_SIZES` (`../icon/sizes.ts`): tier is layout, not palette.
 *
 * Unlike icon size, tier has a responsive axis: `[data-tint-media-player]`
 * auto-selects a tier from its own container width via `@container` rules in
 * `src/index.css`, and an explicit `size` prop overrides that via a
 * `data-size` attribute. The thresholds below are documented here as the
 * single source of truth; `src/index.css` cross-references this file rather
 * than duplicating the numbers in a comment (there's no build-time sharing
 * between TS and CSS in this repo).
 */
export const MEDIA_SIZES = ['sm', 'md', 'lg'] as const

export type MediaSize = (typeof MEDIA_SIZES)[number]

/** Container width, in rem, below which the `sm` tier auto-applies. */
export const MEDIA_SIZE_SM_MAX_REM = 22

/** Container width, in rem, below which the `md` tier auto-applies (and above
    `MEDIA_SIZE_SM_MAX_REM`, where `sm` takes over instead). */
export const MEDIA_SIZE_MD_MAX_REM = 40
