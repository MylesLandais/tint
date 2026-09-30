<script lang="ts">
  import AudioPlayer from './AudioPlayer.svelte'
  import VideoPlayer from './VideoPlayer.svelte'
  import type { MediaPlayerProps } from './playerTypes'

  let props: MediaPlayerProps = $props()
</script>

{#if props.kind === 'audio'}
  <AudioPlayer {...props} />
{:else}
  <VideoPlayer {...props} />
{/if}
