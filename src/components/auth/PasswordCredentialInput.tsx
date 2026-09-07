import { useId } from 'react'
import { FormControl } from '../form'
import { PasswordField, type PasswordFieldProps } from '../form/inputs'

export type PasswordCredentialInputProps = Omit<PasswordFieldProps, 'id'> & {
  id?: string
  label: string
}

export function PasswordCredentialInput({ id: idProp, label, description, error, ...props }: PasswordCredentialInputProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  return (
    <FormControl id={id} label={label} description={description} error={error}>
      <PasswordField id={id} description={description} error={error} {...props} />
    </FormControl>
  )
}
