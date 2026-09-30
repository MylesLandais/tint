<script lang="ts">
  import {
    useCapability,
    useClientStatus,
    useNavigation,
    usePlayback,
    useUploads,
  } from './snapshots'

  type Mode = 'status' | 'playback' | 'uploads' | 'navigation' | 'host'
  let { mode }: { mode: Mode } = $props()

  const status = useClientStatus()
  // svelte-ignore state_referenced_locally
  const playback = mode === 'playback' ? usePlayback() : null
  // svelte-ignore state_referenced_locally
  const uploads = mode === 'uploads' ? useUploads() : null
  // svelte-ignore state_referenced_locally
  const navigation = mode === 'navigation' ? useNavigation() : null
  // svelte-ignore state_referenced_locally
  const host = mode === 'host' ? useCapability<string>('player') : null
</script>

{#if mode === 'status'}
  <span data-testid="client-status">{status.snapshot.status}</span>
{:else if mode === 'playback'}
  <span data-testid="playback">{playback?.snapshot.queue[0]?.title} {playback?.snapshot.status}</span>
{:else if mode === 'uploads'}
  <span data-testid="uploads">{uploads?.snapshot.tasks.length}</span>
{:else if mode === 'navigation'}
  <span data-testid="navigation">{navigation?.snapshot.pathname}</span>
{:else if mode === 'host'}
  <span data-testid="host">{host?.snapshot}</span>
{/if}
