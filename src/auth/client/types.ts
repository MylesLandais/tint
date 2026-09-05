import type { Identity } from '../../components/identity'

export type OAuthProviderId = string
export type AuthStatus = 'loading' | 'signed_out' | 'pending' | 'signed_in' | 'error'
export type AuthTask = 'verify_identifier' | 'reset_password' | 'mfa' | 'choose_organization' | string
export type IdentifierKind = 'username' | 'email' | 'either'

export type AuthMethodConfig = {
  enabled: boolean
  signUpEnabled: boolean
  verificationRequired: boolean
  recoveryEnabled: boolean
}

export type OAuthProviderDescriptor = { id: OAuthProviderId; label: string; kind: 'oauth' }

export type AuthConfig = {
  version: 'v2'
  identifierKind: IdentifierKind
  password: AuthMethodConfig
  providers: readonly OAuthProviderDescriptor[]
  inviteRequired: boolean
}

export type AuthUser = Identity & {
  principalRef: string
  email?: string | null
  emailVerified?: boolean
}

export type AuthMembership = {
  organizationId: string
  organizationSlug: string
  organizationName: string
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
}

export type AuthSession = {
  id: string
  user: AuthUser
  activeOrganizationId: string | null
  memberships: readonly AuthMembership[]
  capabilities: readonly string[]
  authenticationMethods: readonly string[]
  authenticatedAt?: string
  expiresAt?: string
}

export type AuthProblemShape = {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
  retryAfter?: number
}

export type AuthFlowResult = { session: AuthSession | null; task: AuthTask | null; message?: string }

export type AuthSnapshot = {
  status: AuthStatus
  busy: boolean
  config: AuthConfig | null
  session: AuthSession | null
  task: AuthTask | null
  error: import('./errors').AuthError | null
}

export type AuthEventType = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'SESSION_UPDATED' | 'TASK_REQUIRED'
export type AuthEvent = { type: AuthEventType; snapshot: AuthSnapshot }

export type PasswordSignInInput = { identifier: string; password: string }
export type PasswordSignUpInput = { identifier: string; password: string; displayName?: string; inviteCode?: string }
export type IdentifierVerificationInput = { token: string }
export type CredentialRecoveryRequestInput = { identifier: string }
export type PasswordResetInput = { token: string; password: string }
export type TotpVerifyInput = { code: string }
export type OrganizationSelectInput = { organizationId: string }

declare const authOperationTypes: unique symbol
export type AuthOperation<Input, Result> = {
  readonly name: string
  readonly [authOperationTypes]?: { input: Input; result: Result }
}

export function defineAuthOperation<Input, Result>(name: string): AuthOperation<Input, Result> {
  return Object.freeze({ name })
}
