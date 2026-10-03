import type { Snippet } from 'svelte'
import type { RegistrationErrorCode } from '../../../core/auth/registration'

export type IdentifierSignInFormLabels = {
  identifier: string
  password: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
}

export type OAuthOption = { id: string; label: string; href: string; icon?: Snippet }

export type LoginFormLabels = {
  identifier: string
  password: string
  /** Final submit, e.g. "Sign in". */
  submit: string
  /** Email-first step one, e.g. "Continue". */
  continue: string
  submitting: string
  showPassword: string
  hidePassword: string
  identifierRequired: string
  passwordRequired: string
  /** Back link on the email-first password step, e.g. "Use a different email". */
  changeIdentifier: string
  forgotPassword?: string
  /** Accessible name of the provider navigation landmark. */
  providers: string
  divider: string
  lastUsed: string
}

export type RegistrationFormLabels = {
  displayName: string
  email: string
  password: string
  /** Shown under the password field. `{min}` is replaced with the minimum length. */
  passwordHint?: string
  inviteCode: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
  providers: string
  divider: string
  lastUsed: string
  /** `{min}` is replaced with the minimum password length. */
  errors: Record<RegistrationErrorCode, string>
}
