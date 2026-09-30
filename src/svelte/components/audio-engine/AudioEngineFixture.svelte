<script lang="ts">
  import type { AudioEngineStore } from '../../../core/audio-engine/store'
  import AudioEngineProvider from './AudioEngineProvider.svelte'
  import AudioEngineProbe from './AudioEngineProbe.svelte'
  let { store }: { store: AudioEngineStore } = $props()
</script>

<AudioEngineProvider {store}><AudioEngineProbe /></AudioEngineProvider>
