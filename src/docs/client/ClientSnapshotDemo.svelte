<script lang="ts">
  import { useClientStatus, useOperations, usePlayback } from '../../svelte/client'

  const status = useClientStatus()
  const playback = usePlayback()
  const operations = useOperations()
</script>

<div class="client-demo">
  <p role="status">Client: {status.snapshot.status} · Ready: {status.snapshot.readyCapabilities.join(', ') || 'none'}</p>
  <p>Current track: {playback.snapshot.queue.find((item) => item.id === playback.snapshot.currentItemId)?.title ?? 'none'} · {playback.snapshot.status}</p>
  <div class="actions">
    <button type="button" onclick={() => playback.client.setStatus(playback.snapshot.status === 'playing' ? 'paused' : 'playing')} disabled={playback.snapshot.currentItemId === null}>Toggle playback</button>
    <button type="button" onclick={() => operations.client.submit({ name: 'demo:refresh' })}>Submit operation</button>
    <button type="button" onclick={() => operations.client.clearSettled()} disabled={!operations.snapshot.operations.some((operation) => operation.state !== 'queued' && operation.state !== 'running')}>Clear settled</button>
  </div>
  <ul aria-label="Operations">
    {#each operations.snapshot.operations as operation (operation.id)}
      <li>{operation.name}: {operation.state}</li>
    {:else}
      <li>No operations yet</li>
    {/each}
  </ul>
</div>

<style>
  .client-demo { display: grid; gap: .75rem; }
  p { margin: 0; color: var(--tint-ink); }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  button { border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-ink); padding: .45rem .7rem; font: inherit; cursor: pointer; }
  button:hover:not(:disabled) { border-color: var(--tint-accent); }
  button:disabled { opacity: .5; cursor: not-allowed; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  ul { margin: 0; padding-left: 1.25rem; color: var(--tint-muted); }
</style>
