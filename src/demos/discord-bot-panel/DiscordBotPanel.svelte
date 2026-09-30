<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { createTintClient } from '../../client/client'
  import { provideTintClient } from '../../svelte/client/context'
  import ToastProvider from '../../svelte/components/toast/ToastProvider.svelte'
  import { createLudisHost, type LudisHost } from './adapters'
  import { GUILDS } from './fixtures'
  import BotPanelBody from './BotPanelBody.svelte'

  let { host: injectedHost, autoAdvance = true }: { host?: LudisHost; autoAdvance?: boolean } = $props()
  const host = untrack(() => injectedHost ?? createLudisHost(GUILDS[0]!.id))
  const client = createTintClient({ request: host.request, operations: host.operations, realtime: host.realtime,
    capabilities: { guildPlayer: host.guildPlayer } })
  provideTintClient(client)
  onMount(() => {
    if (!autoAdvance) return
    const timer = setInterval(() => host.advance(), 700)
    return () => clearInterval(timer)
  })
</script>

<ToastProvider><BotPanelBody {host} /></ToastProvider>
