export type MediaAsset = {
  id: string
  src: string
  alt: string
  mediaType?: string
  width?: number
  height?: number
  href?: string
  caption?: string
}

export type FileRejection = { file: File; reason: 'type' | 'size' | 'count'; message: string }

export type FileIngestOptions = {
  accept?: readonly string[]
  maxSizeBytes?: number
  maxFiles?: number
}

export function acceptsFile(file: File, patterns: readonly string[]): boolean {
  if (patterns.length === 0) return true
  return patterns.some((pattern) => pattern.endsWith('/*')
    ? file.type.startsWith(pattern.slice(0, -1))
    : file.type === pattern || file.name.toLocaleLowerCase().endsWith(pattern.toLocaleLowerCase()))
}

export function classifyFiles(list: FileList | readonly File[], options: FileIngestOptions = {}): {
  accepted: File[]
  rejected: FileRejection[]
} {
  const { accept = [], maxSizeBytes = Number.POSITIVE_INFINITY, maxFiles = Number.POSITIVE_INFINITY } = options
  const accepted: File[] = []
  const rejected: FileRejection[] = []
  Array.from(list).forEach((file, index) => {
    if (index >= maxFiles) rejected.push({ file, reason: 'count', message: `Only ${maxFiles} files are allowed.` })
    else if (!acceptsFile(file, accept)) rejected.push({ file, reason: 'type', message: `${file.type || file.name} is not an accepted file type.` })
    else if (file.size > maxSizeBytes) rejected.push({ file, reason: 'size', message: `${file.name} exceeds the size limit.` })
    else accepted.push(file)
  })
  return { accepted, rejected }
}

export function safeAssetIndex(index: number, count: number): number {
  return count === 0 ? 0 : Math.min(Math.max(0, Math.trunc(index)), count - 1)
}
