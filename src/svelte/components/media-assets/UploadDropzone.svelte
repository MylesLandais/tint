<script lang="ts">
  import { Upload } from '@lucide/svelte'
  import { classifyFiles, type FileRejection } from '../../../core/media/assets'
  import Icon from '../icon/Icon.svelte'

  type Props = {
    accept?: readonly string[]
    maxSizeBytes?: number
    maxFiles?: number
    disabled?: boolean
    label?: string
    description?: string
    onFilesAccepted: (files: readonly File[]) => void
    onFilesRejected?: (rejections: readonly FileRejection[]) => void
    class?: string
  }
  let {
    accept = [], maxSizeBytes = Number.POSITIVE_INFINITY, maxFiles = Number.POSITIVE_INFINITY,
    disabled = false, label = 'Upload files', description = 'Drag files here or choose files.',
    onFilesAccepted, onFilesRejected, class: className,
  }: Props = $props()
  let input = $state<HTMLInputElement>(null!)
  let dragging = $state(false)

  function ingest(list: FileList | readonly File[]) {
    const { accepted, rejected } = classifyFiles(list, { accept, maxSizeBytes, maxFiles })
    if (accepted.length) onFilesAccepted(accepted)
    if (rejected.length) onFilesRejected?.(rejected)
  }

  function drop(event: DragEvent) {
    event.preventDefault()
    dragging = false
    if (disabled) return
    if (event.dataTransfer) ingest(event.dataTransfer.files)
  }

  function keydown(event: KeyboardEvent) {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    input.click()
  }
</script>

<div
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-disabled={disabled || undefined}
  data-tint-upload-dropzone=""
  data-dragging={dragging || undefined}
  class={['tint-upload-dropzone', className].filter(Boolean).join(' ')}
  onclick={() => { if (!disabled) input.click() }}
  onkeydown={keydown}
  ondragenter={(event) => { event.preventDefault(); if (!disabled) dragging = true }}
  ondragover={(event) => event.preventDefault()}
  ondragleave={() => dragging = false}
  ondrop={drop}
>
  <Icon icon={Upload} size="lg" />
  <span class="label">{label}</span>
  <span class="description">{description}</span>
  <input bind:this={input} type="file" hidden multiple={maxFiles > 1} accept={accept.join(',') || undefined} {disabled}
    onclick={(event) => event.stopPropagation()}
    onchange={(event) => { if (event.currentTarget.files) ingest(event.currentTarget.files); event.currentTarget.value = '' }} />
</div>

<style>
  .tint-upload-dropzone { display: flex; min-height: 9rem; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; border: 2px dashed var(--tint-border); border-radius: var(--tint-radius-lg); padding: 1.5rem; color: var(--tint-muted); text-align: center; cursor: pointer; transition: border-color var(--tint-motion-base) var(--tint-ease), background var(--tint-motion-base) var(--tint-ease); }
  .tint-upload-dropzone:hover, .tint-upload-dropzone[data-dragging='true'] { border-color: var(--tint-accent); background: var(--tint-accent-soft); }
  .tint-upload-dropzone:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .tint-upload-dropzone[aria-disabled='true'] { opacity: .5; cursor: not-allowed; }
  .label { color: var(--tint-ink); font-weight: 500; }
  .description { font-size: var(--tint-font-size-sm); }
  @media (prefers-reduced-motion: reduce) { .tint-upload-dropzone { transition: none; } }
</style>
