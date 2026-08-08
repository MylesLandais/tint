import type { AuthError } from './errors'

export type OAuthProviderId = string
export type AuthStatus = 'loading' | 'signed_out' | 'pending' | 'signed_in' | 'error'
export type AuthTask = 'verify_email' | 'reset_password' | 'mfa' | 'choose_organization'

export type AuthMethodConfig = {
  enabled: boolean
  signUpEnabled: boolean
  verificationRequired: boolean
  recoveryEnabled: boolean
}

export type OAuthProviderDescriptor = {
  id: OAuthProviderId
  label: string
  kind: 'oauth'
}

export type AuthConfig = {
  version: 'v1'
  password: AuthMethodConfig
  providers: OAuthProviderDescriptor[]
  inviteRequired: boolean
}

export type AuthUser = {
  id: string
  principalRef: string
  displayName: string
  email: string | null
  emailVerified: boolean
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
  memberships: AuthMembership[]
  capabilities: string[]
  authenticationMethods: string[]
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

export type AuthFlowResult = {
  session: AuthSession | null
  task: AuthTask | null
  message?: string
}

export type AuthSnapshot = {
  status: AuthStatus
  busy: boolean
  config: AuthConfig | null
  session: AuthSession | null
  task: AuthTask | null
  error: AuthError | null
}

export type AuthEventType =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'SESSION_UPDATED'
  | 'TASK_REQUIRED'

export type AuthEvent = { type: AuthEventType; snapshot: AuthSnapshot }
export type PasswordSignInInput = { email: string; password: string }
export type PasswordSignUpInput = { email: string; password: string; displayName?: string; inviteCode?: string }
export type VerifyEmailInput = { token: string }
export type PasswordResetRequestInput = { email: string }
export type PasswordResetInput = { token: string; password: string }
export type TotpVerifyInput = { code: string }
export type OrganizationSelectInput = { organizationId: string }
