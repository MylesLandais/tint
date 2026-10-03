export type RegistrationInput = {
  email: string
  password: string
  displayName?: string
  inviteCode?: string
}

export type RegistrationPolicy = {
  inviteRequired?: boolean
  minPasswordLength?: number
}

export type RegistrationField = keyof RegistrationInput
export type RegistrationErrorCode = 'required' | 'invalid_email' | 'password_too_short'
export type RegistrationErrors = Partial<Record<RegistrationField, RegistrationErrorCode>>

export const DEFAULT_MIN_PASSWORD_LENGTH = 8

// Deliberately loose: the server owns real validation; this only catches typos before a round trip.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side registration checks. Returns error codes, not copy, so hosts own the wording. */
export function validateRegistration(input: RegistrationInput, policy: RegistrationPolicy = {}): RegistrationErrors {
  const errors: RegistrationErrors = {}
  const email = input.email.trim()
  if (!email) errors.email = 'required'
  else if (!EMAIL_SHAPE.test(email)) errors.email = 'invalid_email'
  if (!input.password) errors.password = 'required'
  else if (input.password.length < (policy.minPasswordLength ?? DEFAULT_MIN_PASSWORD_LENGTH)) errors.password = 'password_too_short'
  if (policy.inviteRequired && !input.inviteCode?.trim()) errors.inviteCode = 'required'
  return errors
}

export function hasRegistrationErrors(errors: RegistrationErrors): boolean {
  return Object.keys(errors).length > 0
}
