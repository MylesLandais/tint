import type { Snippet } from 'svelte'

export type IdentifierSignInFormLabels = {
  identifier: string
  password: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
}

export type OAuthOption = { id: string; label: string; href: string; icon?: Snippet }
