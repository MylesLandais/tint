<script lang="ts">
  import { provideAudioEngine } from './context'
  import type { AudioEngineProviderProps } from './types'

  let { store, children }: AudioEngineProviderProps = $props()
  provideAudioEngine(() => store)
</script>

{@render children?.()}
