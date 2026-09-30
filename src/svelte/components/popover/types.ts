import type { Snippet } from 'svelte'

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left'

export type PopoverTriggerProps = {
  id: string
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  'data-tint-trigger': string
  onclick: (event: MouseEvent) => void
}

export type PopoverContent = string | Snippet
