import React, { useMemo, type ReactNode } from 'react'
import { FormLayout } from '../form'
import { createAuthFormSchema } from '../form/schemas'

void React

export type SignInFormLabels = {
  email: string
  password: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
}

export type SignInFormProps = {
  email: string
  password: string
  busy?: boolean
  error?: ReactNode
  labels: SignInFormLabels
  emailPlaceholder?: string
  passwordPlaceholder?: string
  onEmailChange(value: string): void
  onPasswordChange(value: string): void
  onSubmit(): void | Promise<void>
  className?: string
}

/**
 * Controlled email/password form. The public props did not change; the fields
 * now render through `FormLayout` so auth shares `form_inputs` with every other
 * composed form.
 */
export function SignInForm({
  email,
  password,
  busy = false,
  error,
  labels,
  emailPlaceholder,
  passwordPlaceholder,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  className,
}: SignInFormProps) {
  const schema = useMemo(
    () =>
      createAuthFormSchema({
        email: labels.email,
        password: labels.password,
        showPassword: labels.showPassword,
        hidePassword: labels.hidePassword,
        emailPlaceholder,
        passwordPlaceholder,
      }),
    [labels, emailPlaceholder, passwordPlaceholder],
  )

  return (
    <FormLayout
      schema={schema}
      values={{ email, password }}
      onValuesChange={(values) => {
        const nextEmail = typeof values.email === 'string' ? values.email : email
        const nextPassword = typeof values.password === 'string' ? values.password : password
        if (nextEmail !== email) onEmailChange(nextEmail)
        if (nextPassword !== password) onPasswordChange(nextPassword)
      }}
      busy={busy}
      error={error}
      submitLabel={labels.submit}
      submittingLabel={labels.submitting}
      className={['tint-auth-form', className].filter(Boolean).join(' ')}
      onSubmit={() => onSubmit()}
    />
  )
}
