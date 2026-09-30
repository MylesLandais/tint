<script lang="ts">
  import WorkspaceGrid from './WorkspaceGrid.svelte'
  import type { WorkspaceCommand, WorkspaceDocument, WorkspaceItem } from '../../../core/table/workspaceGrid'
  let { document, onDocumentChange }: {
    document: WorkspaceDocument
    onDocumentChange: (document: WorkspaceDocument, command: WorkspaceCommand) => void
  } = $props()
</script>

{#snippet content(item: WorkspaceItem, breakpoint: string)}<p>{item.id} at {breakpoint}</p>{/snippet}
<WorkspaceGrid {document} {onDocumentChange} renderItem={content} breakpoints={{ lg: 900, sm: 0 }} columns={{ lg: 12, sm: 4 }} />
