import React, { useMemo, type ReactNode } from 'react'
import { FormLayout } from '../form'
import { createCredentialFormSchema } from '../form/schemas'

void React

export type IdentifierSignInFormLabels = {
  identifier: string
  password: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
}

export type IdentifierSignInFormProps = {
  identifier: string
  password: string
  busy?: boolean
  error?: ReactNode
  labels: IdentifierSignInFormLabels
  identifierPlaceholder?: string
  passwordPlaceholder?: string
  onIdentifierChange(value: string): void
  onPasswordChange(value: string): void
  onSubmit(): void | Promise<void>
  className?: string
}

export function IdentifierSignInForm({
  identifier,
  password,
  busy = false,
  error,
  labels,
  identifierPlaceholder,
  passwordPlaceholder,
  onIdentifierChange,
  onPasswordChange,
  onSubmit,
  className,
}: IdentifierSignInFormProps) {
  const schema = useMemo(() => createCredentialFormSchema({
    identifier: labels.identifier,
    password: labels.password,
    showPassword: labels.showPassword,
    hidePassword: labels.hidePassword,
    identifierPlaceholder,
    passwordPlaceholder,
  }), [labels, identifierPlaceholder, passwordPlaceholder])

  return (
    <FormLayout
      schema={schema}
      values={{ identifier, password }}
      onValuesChange={(values) => {
        const nextIdentifier = typeof values.identifier === 'string' ? values.identifier : identifier
        const nextPassword = typeof values.password === 'string' ? values.password : password
        if (nextIdentifier !== identifier) onIdentifierChange(nextIdentifier)
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
