import React, { useId, useState, type KeyboardEvent } from 'react'
import { describedByFor } from '../FormControl'

void React

export type TagsFieldProps = {
  id: string
  value: readonly string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  description?: string
  error?: string
}

export function TagsField({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  description,
  error,
}: TagsFieldProps) {
  const [draft, setDraft] = useState('')
  const inputId = useId()

  function commit(raw: string) {
    const tag = raw.trim()
    if (!tag || value.includes(tag)) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="tint-form-tags">
      <ul className="tint-form-tags__list" aria-label="Tags">
        {value.map((tag) => (
          <li key={tag} className="tint-form-tags__item">
            <span>{tag}</span>
            <button
              type="button"
              className="tint-form-tags__remove"
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <input
        id={id}
        className="tint-form-input"
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByFor(id, description, error)}
        autoComplete="off"
        data-tags-input={inputId}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
      />
    </div>
  )
}
