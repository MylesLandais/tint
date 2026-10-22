<script lang="ts">
  import { untrack } from 'svelte'
  import { mountCodeEditor, setCodeEditorValue, type CodeEditorView } from '../../../core/code-editor'
  import type { CodeEditorProps } from './types'

  let { session, value, onValueChange, presence, readOnly = false, label = 'Lua source editor', onView }: CodeEditorProps = $props()
  // Omitted optional props may share the parent's spread invalidation. Derived
  // identities keep a text/callback update from rebuilding the editor.
  const activeSession = $derived(session)
  const activePresence = $derived(presence)
  const activeReadOnly = $derived(readOnly)
  const activeLabel = $derived(label)
  let host = $state<HTMLDivElement | null>(null)
  let view = $state.raw<CodeEditorView | null>(null)

  $effect(() => {
    if (!host) return
    const parent = host, currentSession = activeSession, currentPresence = activePresence, currentReadOnly = activeReadOnly, currentLabel = activeLabel
    const mounted = untrack(() => mountCodeEditor(parent, currentSession
      ? { session: currentSession, presence: currentPresence, readOnly: currentReadOnly, label: currentLabel }
      : { value: value ?? '', onValueChange: next => onValueChange?.(next), readOnly: currentReadOnly, label: currentLabel }))
    view = mounted
    untrack(() => onView?.(mounted))
    return () => {
      untrack(() => onView?.(null))
      view = null
      mounted.destroy()
    }
  })

  $effect(() => {
    if (!session && view && value !== undefined) setCodeEditorValue(view, value)
  })
</script>

<div bind:this={host} data-tint-code-editor style="height: 100%; min-height: 180px; overflow: hidden"></div>
