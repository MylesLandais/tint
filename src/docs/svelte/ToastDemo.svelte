<script lang="ts">
  import Button from '../../svelte/components/button/Button.svelte'
  import { useToast } from '../../svelte/components/toast'

  const toast = useToast()
</script>

<div class="row">
  <Button onclick={() => toast.push({ title: 'Collection saved', description: 'Your changes are ready.', tone: 'success' })}>Show success</Button>
  <Button onclick={() => toast.push({ title: 'Save failed', description: 'Try again.', tone: 'danger' })}>Show error</Button>
</div>

<style>.row { display: flex; flex-wrap: wrap; gap: .6rem; }</style>
