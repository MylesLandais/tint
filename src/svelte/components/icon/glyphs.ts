import CircleAlert from '@lucide/svelte/icons/circle-alert'
import CircleCheck from '@lucide/svelte/icons/circle-check'
import CircleDashed from '@lucide/svelte/icons/circle-dashed'
import CircleX from '@lucide/svelte/icons/circle-x'
import LoaderCircle from '@lucide/svelte/icons/loader-circle'
import ShieldCheck from '@lucide/svelte/icons/shield-check'
import X from '@lucide/svelte/icons/x'
import ChevronRight from '@lucide/svelte/icons/chevron-right'
import Copy from '@lucide/svelte/icons/copy'
import Check from '@lucide/svelte/icons/check'
import Bold from '@lucide/svelte/icons/bold'
import Italic from '@lucide/svelte/icons/italic'
import Underline from '@lucide/svelte/icons/underline'
import Strikethrough from '@lucide/svelte/icons/strikethrough'
import Code from '@lucide/svelte/icons/code'
import Link2 from '@lucide/svelte/icons/link-2'
import List from '@lucide/svelte/icons/list'
import ListOrdered from '@lucide/svelte/icons/list-ordered'
import TextQuote from '@lucide/svelte/icons/text-quote'
import Braces from '@lucide/svelte/icons/braces'
import Undo2 from '@lucide/svelte/icons/undo-2'
import Redo2 from '@lucide/svelte/icons/redo-2'
import Pilcrow from '@lucide/svelte/icons/pilcrow'
import Heading1 from '@lucide/svelte/icons/heading-1'
import Heading2 from '@lucide/svelte/icons/heading-2'
import Heading3 from '@lucide/svelte/icons/heading-3'
import Code2 from '@lucide/svelte/icons/code-2'
import Minus from '@lucide/svelte/icons/minus'
import Sun from '@lucide/svelte/icons/sun'
import Monitor from '@lucide/svelte/icons/monitor'
import Moon from '@lucide/svelte/icons/moon'
import Palette from '@lucide/svelte/icons/palette'
import ChevronDown from '@lucide/svelte/icons/chevron-down'
import type { LucideIcon } from '@lucide/svelte'
import type { StatusName } from '../../../core/icon/status'

/** Glyph half of the status registry. Presentation lives in core. */
export const STATUS_GLYPHS = {
  idle: CircleDashed,
  pending: CircleDashed,
  loading: LoaderCircle,
  success: CircleCheck,
  error: CircleX,
  warning: CircleAlert,
  'needs-approval': ShieldCheck,
  cancelled: X,
} as const satisfies Record<StatusName, LucideIcon>

/** Glyphs Tint's own Svelte components need directly. */
export const GLYPHS = { chevronRight: ChevronRight, close: X, loader: LoaderCircle, copy: Copy, check: Check } as const

export const EDITOR_GLYPHS = {
  undo: Undo2, redo: Redo2, bullet: List, ordered: ListOrdered, quote: TextQuote,
  codeBlock: Braces, codeTabs: Braces, bold: Bold, italic: Italic,
  underline: Underline, strike: Strikethrough, code: Code, link: Link2,
} as const

export const EDITOR_SLASH_GLYPHS = {
  paragraph: Pilcrow, 'heading-1': Heading1, 'heading-2': Heading2,
  'heading-3': Heading3, 'bullet-list': List, 'ordered-list': ListOrdered,
  blockquote: TextQuote, 'code-block': Braces, 'tabbed-code': Code2,
  'horizontal-rule': Minus,
} as const

export const THEME_GLYPHS = { light: Sun, system: Monitor, dark: Moon, palette: Palette, chevronDown: ChevronDown } as const
