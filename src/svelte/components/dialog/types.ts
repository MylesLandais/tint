import type { Snippet } from 'svelte'

export type DialogPanelAttributes = {
  id?: string
  dir?: 'ltr' | 'rtl' | 'auto'
  lang?: string
  tabindex?: number
  tabIndex?: number
  style?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-description'?: string
  'aria-roledescription'?: string
  [key: `data-${string}`]: string | number | boolean | null | undefined
}

type DialogTitle = { title: string; titleLabel?: string } | { title: Snippet; titleLabel: string }

export type DialogProps = DialogTitle & DialogPanelAttributes & {
  open: boolean
  onOpenChange: (open: boolean) => void
  description?: string | Snippet
  actions?: Snippet
  children?: Snippet
  hideClose?: boolean
  placement?: 'center' | 'right'
  class?: string
}
