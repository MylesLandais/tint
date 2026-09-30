import type { Snippet } from 'svelte'

export type TabItem = {
  id: string
  label: string | Snippet
  content: string | Snippet
  disabled?: boolean
}
