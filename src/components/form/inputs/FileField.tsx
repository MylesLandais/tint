import React, { useId } from 'react'
import type { FormFileValue } from '../contracts'
import { describedByFor } from '../FormControl'

void React

export type FileFieldProps = {
  id: string
  value: FormFileValue | null
  onChange: (value: FormFileValue | null) => void
  accept?: string
  disabled?: boolean
  description?: string
  error?: string
}

export function FileField({
  id,
  value,
  onChange,
  accept,
  disabled,
  description,
  error,
}: FileFieldProps) {
  const previewId = useId()
  const isImage = value?.mimeType.startsWith('image/') && value.objectUrl

  function onFile(file: File | undefined) {
    if (!file) {
      if (value?.objectUrl) URL.revokeObjectURL(value.objectUrl)
      onChange(null)
      return
    }
    if (value?.objectUrl) URL.revokeObjectURL(value.objectUrl)
    onChange({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      objectUrl: URL.createObjectURL(file),
    })
  }

  return (
    <div className="tint-form-file">
      {isImage ? (
        <img id={previewId} className="tint-form-file__preview" src={value.objectUrl} alt="" />
      ) : null}
      <input
        id={id}
        className="tint-form-file__input"
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByFor(id, description, error)}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {value ? (
        <p className="tint-form-file__name">
          {value.name}
          <button
            type="button"
            className="tint-form-file__clear"
            disabled={disabled}
            onClick={() => onFile(undefined)}
          >
            Remove
          </button>
        </p>
      ) : null}
    </div>
  )
}
