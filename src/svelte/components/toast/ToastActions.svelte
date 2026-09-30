<script lang="ts">
  import { useToast } from './context'
  import type { ToastTone } from '../../../core/toast/model'

  let { durationMs, onPush }: { durationMs?: number; onPush?: (id: string) => void } = $props()
  const toast = useToast()
  let count = 0
  let lastId = ''

  function push(tone: ToastTone) {
    count += 1
    lastId = toast.push({ title: `Toast ${count}`, description: 'Ready to view', tone, durationMs })
    onPush?.(lastId)
  }
</script>

<button type="button" onclick={() => push('neutral')}>Push neutral</button>
<button type="button" onclick={() => push('danger')}>Push danger</button>
<button type="button" onclick={() => toast.dismiss(lastId)}>Dismiss last</button>
