<script lang="ts">
  import { stripBidi } from '../../../core/chat'
  import MediaLightbox from '../media-assets/MediaLightbox.svelte'
  import type { ChatMediaLightboxProps } from './types'

  let { open, images, index, onClose, onIndexChange, caption,
    class: className, className: legacyClassName }: ChatMediaLightboxProps = $props()
  let assets = $derived(images.map((image) => ({
    id: image.id, src: image.src, alt: stripBidi(image.alt),
    width: image.width, height: image.height, href: image.href,
    caption: caption ? stripBidi(caption) : undefined,
  })))
</script>

<MediaLightbox {open} {assets} {index} {onClose} {onIndexChange} class={[className, legacyClassName].filter(Boolean).join(' ')} />
