export { default as IdentifierSignInForm } from './IdentifierSignInForm.svelte'
export { default as CredentialRecoveryForm } from './CredentialRecoveryForm.svelte'
export { default as PasswordCredentialInput } from './PasswordCredentialInput.svelte'
export { default as OAuthButtons } from './OAuthButtons.svelte'
export type { IdentifierSignInFormLabels, OAuthOption } from './types'
export { AuthClient, createAuthClient, AuthError, UnsupportedAuthOperationError,
  authErrorFromResponse, defineAuthOperation, normalizeAuthError,
  requireOperation, safeReturnTo } from '../../../auth/client'
export type { AuthClientOptions, AuthTransport } from '../../../auth/client'
export type * from '../../../auth/client/types'
