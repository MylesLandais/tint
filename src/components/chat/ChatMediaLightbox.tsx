import { MediaLightbox } from '../media-assets'
import { stripBidi } from './sanitize'
import type { ChatMediaLightboxProps } from './types'

/** Chat compatibility surface backed by Tint's generic media lightbox. */
export function ChatMediaLightbox({ open, images, index, onClose, onIndexChange, caption, className }: ChatMediaLightboxProps) {
  return (
    <MediaLightbox
      open={open}
      assets={images.map((image) => ({
        id: image.id,
        src: image.src,
        alt: stripBidi(image.alt),
        width: image.width,
        height: image.height,
        href: image.href,
        caption: caption ? stripBidi(caption) : undefined,
      }))}
      index={index}
      onClose={onClose}
      onIndexChange={onIndexChange}
      className={className}
    />
  )
}
