<script lang="ts">
  import { onMount } from 'svelte'
  import { createBrowserPlaybackAdapter } from '../../client/browserPlayback'
  import { createTintClient } from '../../client/client'
  import { createMemoryOperationAdapter } from '../../client/memoryOperations'
  import { provideTintClient } from '../../svelte/client'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'
  import ClientSnapshotDemo from './ClientSnapshotDemo.svelte'

  const playback = createBrowserPlaybackAdapter({ storageKey: 'tint.docs.svelte.playback' })
  const operations = createMemoryOperationAdapter({
    async run(command) { return { accepted: command.name } },
  })
  const client = createTintClient({
    request: { async send() { throw new Error('Docs request adapter is inert.') } },
    playback,
    operations,
  })
  provideTintClient(client)
  onMount(() => {
    playback.replaceQueue([{ id: 'night-drive', title: 'Night Drive', artist: 'Tint' }], 'night-drive')
  })

  const api: ApiRow[] = [
    { prop: 'createTintClient(options)', type: 'TintClient', description: 'Shared plain TypeScript request and capability owner.' },
    { prop: 'provideTintClient(client)', type: 'TintClient', description: 'Provide a client to descendants and lease its start and stop lifecycle.' },
    { prop: 'useClientStatus()', type: 'ReactiveSnapshot<TintClientSnapshot>', description: 'Reactive readiness and per-capability failure status.' },
    { prop: 'usePlayback() / useOperations()', type: 'ReactiveCapability', description: 'Reactive snapshots plus the original plain TypeScript adapters.' },
    { prop: 'useAuth() / useSession() / useConnection()', type: 'ReactiveSnapshot', description: 'Optional authentication, session, and real-time state.' },
    { prop: 'useUploads() / useNavigation() / useCapability()', type: 'ReactiveCapability', description: 'Optional focused adapters and host-defined capabilities.' },
  ]
  const usage = `import { createTintClient } from '@nebula/tint/client'
import { provideTintClient, useClientStatus, usePlayback } from '@nebula/tint/client/svelte'

const client = createTintClient({ request, playback, operations })
provideTintClient(client) // call during ancestor component initialization

// In a descendant component:
const status = useClientStatus()
const playbackState = usePlayback()
// Read status.snapshot and playbackState.snapshot in markup or $derived.`
</script>

<DocPage title="Application Client" description="A plain TypeScript client owns requests and optional capabilities. Svelte context binds its lifetime to the view, and subscription helpers expose current snapshots without copying the client into a framework store." importPath="@nebula/tint/client/svelte" {usage} {api} accessibility="Status and operation progress are exposed as text. Controls use native buttons, have visible focus, and disable actions when no queue item or settled operation exists.">
  <ClientSnapshotDemo />
</DocPage>
