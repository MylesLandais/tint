<script lang="ts">
  import type { TintClient } from '../../client/client'
  import { provideTintClient } from './context'
  import ClientBindingsView from './ClientBindingsView.svelte'

  type Mode = 'status' | 'playback' | 'uploads' | 'navigation' | 'host'
  let { client, mode }: { client: TintClient; mode: Mode } = $props()

  // svelte-ignore state_referenced_locally
  provideTintClient(client)
</script>

<ClientBindingsView {mode} />
