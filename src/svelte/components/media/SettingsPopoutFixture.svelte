<script lang="ts">
  import SettingsPopout from './SettingsPopout.svelte'
  let open = $state(false)
  let selected = $state('speed-1')
  const items = [
    { id: 'speed-1', label: '1x', group: 'Playback speed', description: 'Normal playback' },
    { id: 'speed-2', label: '2x', group: 'Playback speed', description: 'Twice as fast' },
    { id: 'quality-auto', label: 'Auto', group: 'Quality' },
  ]
</script>

<SettingsPopout isOpen={open} onOpenChange={(next) => open = next} {items} value={selected} onSelect={(id) => selected = id} />
<output data-selected="">{selected}</output>
