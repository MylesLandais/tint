import { UnsupportedAuthOperationError } from './errors'
import type {
  AuthConfig,
  AuthFlowResult,
  AuthSession,
  OAuthProviderId,
  OrganizationSelectInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  PasswordSignInInput,
  PasswordSignUpInput,
  TotpVerifyInput,
  VerifyEmailInput,
} from './types'

export type AuthTransport = {
  getConfig(): Promise<AuthConfig>
  getSession(): Promise<AuthSession | null>
  signInPassword?(input: PasswordSignInInput): Promise<AuthFlowResult>
  signUpPassword?(input: PasswordSignUpInput): Promise<AuthFlowResult>
  requestEmailVerification?(): Promise<AuthFlowResult>
  verifyEmail?(input: VerifyEmailInput): Promise<AuthFlowResult>
  requestPasswordReset?(input: PasswordResetRequestInput): Promise<AuthFlowResult>
  resetPassword?(input: PasswordResetInput): Promise<AuthFlowResult>
  verifyTotp?(input: TotpVerifyInput): Promise<AuthFlowResult>
  selectOrganization?(input: OrganizationSelectInput): Promise<AuthFlowResult>
  signOut(): Promise<void>
  oauthStartUrl(provider: OAuthProviderId, returnTo?: string): string
}

export function requireOperation<T>(operation: T | undefined, name: string): T {
  if (!operation) throw new UnsupportedAuthOperationError(name)
  return operation
}

export function safeReturnTo(value?: string | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined
  return value
}
