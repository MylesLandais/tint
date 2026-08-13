import React, { type ReactNode } from 'react'

void React

export type FormControlProps = {
  id: string
  label: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
}

/**
 * Label, description, and error around one control. Owns the `id` relationship
 * so inputs do not each re-invent `htmlFor` / `aria-describedby`.
 */
export function FormControl({
  id,
  label,
  description,
  error,
  required = false,
  disabled = false,
  children,
  className,
}: FormControlProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div
      className={['tint-form-control', className].filter(Boolean).join(' ')}
      data-invalid={error ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
    >
      <label className="tint-form-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="tint-form-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p className="tint-form-description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div className="tint-form-control__input" data-describedby={describedBy}>
        {children}
      </div>
      {error ? (
        <p className="tint-form-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function describedByFor(id: string, description?: string, error?: string): string | undefined {
  const ids = [description ? `${id}-description` : undefined, error ? `${id}-error` : undefined].filter(
    Boolean,
  )
  return ids.length ? ids.join(' ') : undefined
}
