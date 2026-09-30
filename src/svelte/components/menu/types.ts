import type { Snippet } from 'svelte'

export type MenuItem = {
  id: string
  label: string | Snippet
  disabled?: boolean
  danger?: boolean
  onSelect?: () => void
}

export type MenuSeparator = { id: string; type: 'separator' }

export type MenuTriggerProps = {
  id: string
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string
  'data-tint-trigger': string
  onclick: (event: MouseEvent) => void
}
