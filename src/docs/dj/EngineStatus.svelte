<script lang="ts">
  import { useAudioEngine } from '../../svelte'
  const engine = useAudioEngine()
</script>

<p role="status">Web Audio: {engine.snapshot.capabilities.webAudio ? 'available' : 'unavailable'} · Audition: {engine.snapshot.auditionState}</p>

<style>
  p { margin: 0; color: var(--tint-muted); font-size: .8rem; }
</style>
