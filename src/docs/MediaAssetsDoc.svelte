<script lang="ts">
  import { GalleryGrid, MediaLightbox, UploadDropzone, UploadQueue, type MediaAsset, type FileRejection } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const assets: MediaAsset[] = [
    { id: 'one', src: '/images/gallery-1.svg', alt: 'Abstract teal circles', caption: 'Teal circles' },
    { id: 'two', src: '/images/gallery-2.svg', alt: 'Abstract orange shapes', caption: 'Orange shapes' },
    { id: 'three', src: '/images/gallery-3.svg', alt: 'Abstract blue pattern', caption: 'Blue pattern' },
    { id: 'four', src: '/images/gallery-4.svg', alt: 'Abstract pink pattern', caption: 'Pink pattern' },
  ]
  let open = $state(false)
  let index = $state(0)
  let uploadMessage = $state('Choose an image to try the local validation.')
  const api: ApiRow[] = [
    { prop: 'GalleryGrid.assets / onSelect', type: 'MediaAsset[] / (index, asset) => void', description: 'Responsive gallery and host-owned activation.' },
    { prop: 'MediaLightbox.open / index', type: 'boolean / number', description: 'Controlled preview visibility and selected image.' },
    { prop: 'MediaLightbox.onClose / onIndexChange', type: '() => void / (index) => void', description: 'Dismiss and adjacent-image intent.' },
    { prop: 'UploadDropzone.accept / maxSizeBytes / maxFiles', type: 'string[] / number / number', description: 'File validation constraints before host processing.' },
    { prop: 'UploadDropzone.disabled / label / description', type: 'boolean / string / string', description: 'Disabled intake state and visible text for the keyboard-operable dropzone.' },
    { prop: 'onFilesAccepted / onFilesRejected', type: '(files) => void / (rejections) => void', description: 'Host receives accepted files and reasons for rejects.' },
    { prop: 'UploadQueue.tasks', type: 'readonly UploadTask[]', description: 'Host-owned queue progress with retry and cancel intent callbacks.' },
    { prop: 'UploadQueue.onCancel / onRetry', type: '(taskId: string) => void', description: 'Optional host commands; cancel appears for queued or uploading tasks and retry for failed tasks.' },
    { prop: 'UploadQueue.emptyLabel', type: 'string', description: 'Text shown when there are no upload tasks.' },
    { prop: 'class', type: 'string', description: 'Optional host class on GalleryGrid, MediaLightbox, UploadDropzone, and UploadQueue.' },
  ]
  const usage = `import { GalleryGrid, MediaLightbox, UploadDropzone } from '@nebula/tint/media-assets'

let open = $state(false)
let index = $state(0)

<GalleryGrid {assets} onSelect={(next) => { index = next; open = true }} />
<MediaLightbox {assets} {index} {open}
  onClose={() => open = false} onIndexChange={(next) => index = next} />
<UploadDropzone accept={['image/*']} maxFiles={4}
  onFilesAccepted={(files) => enqueueUploads(files)} />`

  function accepted(files: readonly File[]) { uploadMessage = `Accepted ${files.map((file) => file.name).join(', ')}` }
  function rejected(rejections: readonly FileRejection[]) { uploadMessage = rejections.map((item) => item.message).join(' ') }
</script>

<DocPage title="Media Assets" description="A responsive gallery, controlled lightbox, and file intake over plain TypeScript validation. Upload work and progress remain with the host." importPath="@nebula/tint/media-assets" {usage} {api} accessibility="Gallery tiles are named buttons. The lightbox is a modal dialog with Escape, adjacent buttons, arrow keys, and touch swipe. The dropzone supports keyboard activation and announces rejection messages as text; the queue reports progress and named retry or cancel controls.">
  <div class="asset-demo">
    <GalleryGrid {assets} onSelect={(next) => { index = next; open = true }} />
    <MediaLightbox {assets} {index} {open} onClose={() => open = false} onIndexChange={(next) => index = next} />
    <UploadDropzone accept={['image/*']} maxSizeBytes={2_000_000} maxFiles={4} onFilesAccepted={accepted} onFilesRejected={rejected} />
    <p role="status">{uploadMessage}</p>
    <UploadQueue tasks={[]} emptyLabel="No demo uploads are queued." />
  </div>
</DocPage>

<style>
  .asset-demo { display: grid; gap: 1rem; }
  .asset-demo p { margin: 0; color: var(--tint-muted); font-size: .84rem; }
</style>
