<script lang="ts">
  import { untrack } from 'svelte'
  import { mountCodeEditor } from '../../../core/code-editor'
  import type { CodeEditorProps } from './types'

  let { session, presence, readOnly = false, label = 'Lua source editor', onView }: CodeEditorProps = $props()
  let host = $state<HTMLDivElement | null>(null)

  $effect(() => {
    if (!host) return
    const view = mountCodeEditor(host, { session, presence, readOnly, label })
    untrack(() => onView?.(view))
    return () => {
      untrack(() => onView?.(null))
      view.destroy()
    }
  })
</script>

<div bind:this={host} data-tint-code-editor style="height: 100%; min-height: 180px; overflow: hidden"></div>
