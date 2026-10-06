<script lang="ts">
  import NavRail from './NavRail.svelte'

  let { collapsed }: { collapsed: boolean } = $props()
</script>

{#snippet context()}<p>Thread list</p>{/snippet}

<NavRail {collapsed} {context} groups={[{ id: 'main', label: 'Main', items: [{ id: 'home', label: 'Home', href: '#home' }] }]} />
