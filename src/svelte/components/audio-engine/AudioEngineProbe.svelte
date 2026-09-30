<script lang="ts">
  import { useAudioEngine } from './context'
  const engine = useAudioEngine()
</script>

<p data-engine-state>{engine.snapshot.auditionState}</p>
<button type="button" onclick={() => { void engine.stop() }}>Stop engine</button>
