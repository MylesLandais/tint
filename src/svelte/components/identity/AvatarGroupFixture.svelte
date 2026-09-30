<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Identity } from '../../../core/identity'
  import AvatarGroup from './AvatarGroup.svelte'
  let { identities }: { identities: readonly Identity[] } = $props()
</script>

{#snippet link(identity: Identity, avatar: Snippet)}<a href={identity.href}>{@render avatar()}</a>{/snippet}
<AvatarGroup {identities} max={2} renderLink={link} />
