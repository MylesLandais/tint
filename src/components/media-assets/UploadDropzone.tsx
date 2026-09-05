import { Upload } from 'lucide-react'
import { useRef, useState, type DragEvent, type HTMLAttributes, type KeyboardEvent } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import type { FileRejection } from './types'

export type UploadDropzoneProps = Omit<HTMLAttributes<HTMLDivElement>, 'onDrop'> & {
  accept?: readonly string[]
  maxSizeBytes?: number
  maxFiles?: number
  disabled?: boolean
  label?: string
  description?: string
  onFilesAccepted(files: readonly File[]): void
  onFilesRejected?(rejections: readonly FileRejection[]): void
}

function accepts(file: File, patterns: readonly string[]): boolean {
  if (patterns.length === 0) return true
  return patterns.some((pattern) => pattern.endsWith('/*') ? file.type.startsWith(pattern.slice(0, -1)) : file.type === pattern || file.name.toLowerCase().endsWith(pattern.toLowerCase()))
}

export function UploadDropzone({
  accept = [], maxSizeBytes = Number.POSITIVE_INFINITY, maxFiles = Number.POSITIVE_INFINITY,
  disabled = false, label = 'Upload files', description = 'Drag files here or choose files.',
  onFilesAccepted, onFilesRejected, className, ...props
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const ingest = (list: FileList | readonly File[]) => {
    const files = Array.from(list)
    const accepted: File[] = []
    const rejected: FileRejection[] = []
    files.forEach((file, index) => {
      if (index >= maxFiles) rejected.push({ file, reason: 'count', message: `Only ${maxFiles} files are allowed.` })
      else if (!accepts(file, accept)) rejected.push({ file, reason: 'type', message: `${file.type || file.name} is not an accepted file type.` })
      else if (file.size > maxSizeBytes) rejected.push({ file, reason: 'size', message: `${file.name} exceeds the size limit.` })
      else accepted.push(file)
    })
    if (accepted.length) onFilesAccepted(accepted)
    if (rejected.length) onFilesRejected?.(rejected)
  }

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) ingest(event.dataTransfer.files)
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      data-tint-upload-dropzone=""
      data-dragging={dragging || undefined}
      className={cn('flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-tint-border p-6 text-center text-tint-muted outline-none transition hover:border-tint-accent data-[dragging]:border-tint-accent data-[dragging]:bg-tint-accent-soft focus-visible:ring-2 focus-visible:ring-tint-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-50', className)}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={keyDown}
      onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      {...props}
    >
      <Icon icon={Upload} size="lg" />
      <span className="font-medium text-tint-ink">{label}</span>
      <span className="text-sm">{description}</span>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={maxFiles > 1}
        accept={accept.join(',') || undefined}
        disabled={disabled}
        onChange={(event) => { if (event.target.files) ingest(event.target.files); event.target.value = '' }}
      />
    </div>
  )
}
