import type { LucideIcon } from '@lucide/svelte'

export type CodeTab = {
  id: string
  label?: string
  title?: string
  icon?: LucideIcon
  code: string
  language?: string
  lineNumbers?: boolean
  startLine?: number
  highlightLines?: readonly number[]
  highlightWords?: readonly string[]
  installCommand?: string
}
