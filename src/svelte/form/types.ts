/** An option in a Tint single or multiple selection field. */
export type ChoiceOption = {
  value: string
  label: string
  disabled?: boolean
}

export type FieldShared = {
  id: string
  label: string
  description?: string
  error?: string
  disabled?: boolean
  required?: boolean
}
