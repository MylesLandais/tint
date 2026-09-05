import type { OperationOptions } from '../../client/types'
import { UnsupportedAuthOperationError } from './errors'
import type {
  AuthConfig,
  AuthFlowResult,
  AuthOperation,
  AuthSession,
  CredentialRecoveryRequestInput,
  IdentifierVerificationInput,
  OAuthProviderId,
  OrganizationSelectInput,
  PasswordResetInput,
  PasswordSignInInput,
  PasswordSignUpInput,
  TotpVerifyInput,
} from './types'

export type AuthTransport = {
  getConfig(options?: OperationOptions): Promise<AuthConfig>
  getSession(options?: OperationOptions): Promise<AuthSession | null>
  signInPassword?(input: PasswordSignInInput, options?: OperationOptions): Promise<AuthFlowResult>
  signUpPassword?(input: PasswordSignUpInput, options?: OperationOptions): Promise<AuthFlowResult>
  requestIdentifierVerification?(options?: OperationOptions): Promise<AuthFlowResult>
  verifyIdentifier?(input: IdentifierVerificationInput, options?: OperationOptions): Promise<AuthFlowResult>
  requestCredentialRecovery?(input: CredentialRecoveryRequestInput, options?: OperationOptions): Promise<AuthFlowResult>
  resetPassword?(input: PasswordResetInput, options?: OperationOptions): Promise<AuthFlowResult>
  verifyTotp?(input: TotpVerifyInput, options?: OperationOptions): Promise<AuthFlowResult>
  selectOrganization?(input: OrganizationSelectInput, options?: OperationOptions): Promise<AuthFlowResult>
  execute?<Input, Result>(operation: AuthOperation<Input, Result>, input: Input, options?: OperationOptions): Promise<Result>
  signOut(options?: OperationOptions): Promise<void>
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
