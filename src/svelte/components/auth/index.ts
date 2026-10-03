export { default as IdentifierSignInForm } from './IdentifierSignInForm.svelte'
export { default as CredentialRecoveryForm } from './CredentialRecoveryForm.svelte'
export { default as PasswordCredentialInput } from './PasswordCredentialInput.svelte'
export { default as OAuthButtons } from './OAuthButtons.svelte'
export { default as ProviderMark } from './ProviderMark.svelte'
export { default as AuthDivider } from './AuthDivider.svelte'
export { default as AuthLayout } from './AuthLayout.svelte'
export { default as LoginForm } from './LoginForm.svelte'
export { default as RegistrationForm } from './RegistrationForm.svelte'
export type { IdentifierSignInFormLabels, LoginFormLabels, OAuthOption, RegistrationFormLabels } from './types'
export { AuthClient, createAuthClient, AuthError, UnsupportedAuthOperationError,
  authErrorFromResponse, defineAuthOperation, normalizeAuthError,
  requireOperation, safeReturnTo } from '../../../auth/client'
export type { AuthClientOptions, AuthTransport } from '../../../auth/client'
export type * from '../../../auth/client/types'
export {
  AUTH_PROVIDERS, createLastUsedStore, isKnownProvider, providerName, validateRegistration,
} from '../../../core/auth'
export type {
  AuthMethodId, KnownAuthProviderId, LastUsedStore, RegistrationErrorCode, RegistrationErrors,
  RegistrationInput, RegistrationPolicy,
} from '../../../core/auth'
