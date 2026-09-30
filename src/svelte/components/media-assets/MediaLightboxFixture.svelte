<script lang="ts">
  import MediaLightbox from './MediaLightbox.svelte'
  let open = $state(true)
  let index = $state(0)
  const assets = [
    { id: 'one', src: '/one.png', alt: 'First image' },
    { id: 'two', src: '/two.png', alt: 'Second image', href: '/source/two' },
  ]
</script>

<MediaLightbox {open} {assets} {index} onClose={() => open = false} onIndexChange={(next) => index = next} />
<output data-current-index="">{index}</output>
