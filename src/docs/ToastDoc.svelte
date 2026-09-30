<script lang="ts">
  import ToastProvider from '../svelte/components/toast/ToastProvider.svelte'
  import ToastDemo from './svelte/ToastDemo.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const api: ApiRow[] = [
    { prop: 'ToastProvider.limit', type: 'number', description: 'Maximum simultaneous visible notifications.' },
    { prop: 'useToast().push', type: '(ToastInput) => string', description: 'Adds a notification and returns its ID.' },
    { prop: 'useToast().dismiss', type: '(id: string) => void', description: 'Dismisses one notification.' },
    { prop: 'ToastInput.tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", description: 'Semantic urgency and visual tone.' },
    { prop: 'ToastInput.durationMs', type: 'number', description: 'Auto-dismiss duration; zero keeps it visible.' },
  ]
  const usage = `import { ToastProvider, useToast } from '@nebula/tint/toast'

// Call useToast inside a child of ToastProvider.
const toast = useToast()
toast.push({ title: 'Saved', tone: 'success' })`
</script>

<DocPage title="Toast" description="Scoped transient notifications with host-triggered push and dismiss actions." importPath="@nebula/tint/toast" {usage} {api} accessibility="Notifications use status announcements, while urgent errors use alerts. Timers pause while the viewport is hovered or focused and while the window is blurred. Every visible toast has a keyboard-accessible Dismiss button.">
  <ToastProvider limit={3}><ToastDemo /></ToastProvider>
</DocPage>
