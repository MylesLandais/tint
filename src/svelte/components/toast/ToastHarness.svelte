<script lang="ts">
  import ToastProvider from './ToastProvider.svelte'
  import ToastActions from './ToastActions.svelte'

  let { limit = 3, durationMs, onPush }: { limit?: number; durationMs?: number; onPush?: (id: string) => void } = $props()
</script>

<ToastProvider {limit}>
  <ToastActions {durationMs} {onPush} />
</ToastProvider>
