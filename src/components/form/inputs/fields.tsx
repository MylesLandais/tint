import React, { useState, type InputHTMLAttributes } from 'react'
import { describedByFor } from '../FormControl'

void React

type Shared = {
  id: string
  description?: string
  error?: string
  disabled?: boolean
}

export type TextFieldProps = Shared & {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email'
  placeholder?: string
  required?: boolean
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
}

export function TextField({
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  description,
  error,
  autoComplete,
}: TextFieldProps) {
  return (
    <input
      id={id}
      className="tint-form-input"
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedByFor(id, description, error)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export type PasswordFieldProps = Shared & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  description,
  error,
  autoComplete,
  visible,
  onVisibleChange,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
}: PasswordFieldProps) {
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false)
  const isVisible = visible ?? uncontrolledVisible
  const setVisible = onVisibleChange ?? setUncontrolledVisible

  return (
    <div className="tint-form-password">
      <input
        id={id}
        className="tint-form-input"
        type={isVisible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByFor(id, description, error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="tint-form-password-toggle"
        aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
        aria-pressed={isVisible}
        disabled={disabled}
        onClick={() => setVisible(!isVisible)}
      >
        {isVisible ? hidePasswordLabel : showPasswordLabel}
      </button>
    </div>
  )
}

export type TextAreaFieldProps = Shared & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
}

export function TextAreaField({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  description,
  error,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <textarea
      id={id}
      className="tint-form-input tint-form-textarea"
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedByFor(id, description, error)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export type NumberFieldProps = Shared & {
  value: number | string
  onChange: (value: number | string) => void
  min?: number
  max?: number
  step?: number
  required?: boolean
}

export function NumberField({
  id,
  value,
  onChange,
  min,
  max,
  step,
  required,
  disabled,
  description,
  error,
}: NumberFieldProps) {
  return (
    <input
      id={id}
      className="tint-form-input"
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      required={required}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedByFor(id, description, error)}
      onChange={(event) => {
        const next = event.target.value
        onChange(next === '' ? '' : Number(next))
      }}
    />
  )
}

export type SliderFieldProps = Shared & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function SliderField({
  id,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  disabled,
  description,
  error,
}: SliderFieldProps) {
  return (
    <div className="tint-form-slider">
      <input
        id={id}
        className="tint-form-range"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByFor(id, description, error)}
        aria-valuetext={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="tint-form-slider__value">{formatSlider(value)}</span>
    </div>
  )
}

function formatSlider(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2)
}

export type SelectFieldProps = Shared & {
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  required?: boolean
}

export function SelectField({
  id,
  value,
  onChange,
  options,
  required,
  disabled,
  description,
  error,
}: SelectFieldProps) {
  return (
    <select
      id={id}
      className="tint-form-input"
      value={value}
      required={required}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedByFor(id, description, error)}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export type ToggleFieldProps = Shared & {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleField({
  id,
  checked,
  onChange,
  disabled,
  description,
  error,
}: ToggleFieldProps) {
  return (
    <input
      id={id}
      className="tint-form-checkbox"
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedByFor(id, description, error)}
      onChange={(event) => onChange(event.target.checked)}
    />
  )
}
