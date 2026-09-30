<script lang="ts">
  import { RefreshCw, X } from '@lucide/svelte'
  import type { UploadTask } from '../../../client/types'
  import Icon from '../icon/Icon.svelte'
  import ProgressBar from '../progress/ProgressBar.svelte'
  import UploadPreview from './UploadPreview.svelte'

  type Props = {
    tasks: readonly UploadTask[]
    onCancel?: (taskId: string) => void
    onRetry?: (taskId: string) => void
    emptyLabel?: string
    class?: string
  }
  let { tasks, onCancel, onRetry, emptyLabel = 'No uploads.', class: className }: Props = $props()
</script>

{#if tasks.length === 0}
  <p class={['empty', className].filter(Boolean).join(' ')}>{emptyLabel}</p>
{:else}
  <ul data-tint-upload-queue="" class={['tint-upload-queue', className].filter(Boolean).join(' ')}>
    {#each tasks as task (task.id)}
      <li>
        <UploadPreview file={task.file} />
        <div class="details">
          <p class="filename">{task.file.name}</p>
          <p class="status">{task.status}</p>
          {#if task.status === 'uploading' || task.status === 'queued'}<ProgressBar value={task.progress} label={`${task.file.name}: ${task.progress}%`} />{/if}
          {#if task.problem}<p role="alert" class="error">{task.problem.detail ?? task.problem.title}</p>{/if}
        </div>
        {#if task.status === 'error' && onRetry}<button type="button" aria-label={`Retry ${task.file.name}`} onclick={() => onRetry?.(task.id)}><Icon icon={RefreshCw} size="sm" /></button>{/if}
        {#if (task.status === 'queued' || task.status === 'uploading') && onCancel}<button type="button" aria-label={`Cancel ${task.file.name}`} onclick={() => onCancel?.(task.id)}><Icon icon={X} size="sm" /></button>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty { color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .tint-upload-queue { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
  li { display: flex; align-items: center; gap: .75rem; padding: .5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .details { min-width: 0; flex: 1; }
  p { margin: 0; }
  .filename { overflow: hidden; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
  .status { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .error { margin-top: .25rem; color: var(--tint-danger-ink); font-size: var(--tint-font-size-xs); }
  button { display: grid; width: 2rem; height: 2rem; flex: none; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); cursor: pointer; }
  button:hover { background: var(--tint-surface); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
