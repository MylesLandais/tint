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
