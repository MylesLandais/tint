<script lang="ts">
  import { Avatar, AvatarGroup, type Identity } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const people: Identity[] = [
    { id: 'mira', name: 'Mira Patel', presence: 'online' },
    { id: 'alex', name: 'Alex Rivera', presence: 'away' },
    { id: 'jo', name: 'Jo Chen', presence: 'busy' },
    { id: 'sam', name: 'Sam Lee', presence: 'offline' },
    { id: 'ren', name: 'Ren Kim', presence: 'unknown' },
  ]
  const api: ApiRow[] = [
    { prop: 'identity / name / src / alt', type: 'Identity / string', description: 'Person data and optional image overrides; initials appear if an image fails.' },
    { prop: 'size / presence / decorative', type: 'AvatarSize / Presence / boolean', description: 'Size, availability indicator, and screen-reader decoration.' },
    { prop: 'AvatarGroup identities / max', type: 'Identity[] / number', description: 'Visible people and readable overflow count.' },
    { prop: 'AvatarGroup renderLink', type: 'Snippet', description: 'Optional host-owned link wrapper for each avatar.' },
  ]
  const usage = `import { Avatar, AvatarGroup } from '@nebula/tint/identity'

<Avatar identity={currentUser} size="lg" />
<AvatarGroup identities={collaborators} max={3} />`
</script>

<DocPage title="Identity and Avatars" description="Identity initials, image fallback, and presence indicators from a shared plain TypeScript contract. Groups show a compact overflow count." importPath="@nebula/tint/identity" {usage} {api} accessibility="An avatar without an image exposes the identity name, while a loaded image uses meaningful alt text. Decorative avatars are hidden from assistive technology. Presence is available as text in the indicator title and can be supplied by the host elsewhere in the UI.">
  <div class="identity-demo">
    <div class="single"><Avatar identity={people[0]} size="xl" /><div><strong>{people[0].name}</strong><span>Online collaborator</span></div></div>
    <div><h3>Team</h3><AvatarGroup identities={people} max={3} size="lg" /></div>
    <div><h3>Image fallback</h3><Avatar identity={{ id: 'fallback', name: 'Taylor Doe', avatarUrl: '/missing-avatar-for-demo.png', presence: 'away' }} size="md" /></div>
  </div>
</DocPage>

<style>
  .identity-demo { display: grid; gap: 1.5rem; }
  .single { display: flex; align-items: center; gap: 1rem; }
  .single div { display: grid; gap: .2rem; }
  strong { color: var(--tint-ink); font-size: .9rem; }
  span { color: var(--tint-muted); font-size: .8rem; }
  h3 { margin: 0 0 .65rem; color: var(--tint-ink); font-size: .9rem; }
  @container (min-width: 680px) { .identity-demo { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
