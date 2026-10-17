<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import WorkspaceResizeHandle from './WorkspaceResizeHandle.svelte'
  import { clampSplitSize, splitTracks, type WorkspaceSplitDirection, type WorkspaceSplitPrimary } from '../../../core/shell/layout'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    direction?: WorkspaceSplitDirection
    primary?: WorkspaceSplitPrimary
    size: number
    minSize?: number
    maxSize?: number
    onSizeChange: (size: number) => void
    label: string
    first: Snippet
    second: Snippet
  }
  let {
    direction = 'horizontal', primary = 'first', size, minSize = 0, maxSize = 1000,
    onSizeChange, label, first, second, class: className, style, ...rest
  }: Props = $props()
  const id = $props.id()
  let current = $derived(clampSplitSize(size, minSize, maxSize))
  let horizontal = $derived(direction === 'horizontal')
  let gridStyle = $derived(`${style ?? ''}; display: grid; min-width: 0; min-height: 0; ${horizontal ? 'grid-template-columns' : 'grid-template-rows'}: ${splitTracks(current, primary)}`)

</script>

<div {...rest} data-tint-workspace-split data-direction={direction} class={className} style={gridStyle}>
  <div id={`${id}-first`} data-tint-workspace-pane="first" style="display: grid; min-width: 0; min-height: 0; overflow: auto">{@render first()}</div>
  <WorkspaceResizeHandle {size} {minSize} {maxSize} {direction} {primary} {label} {onSizeChange}
    controls={`${id}-${primary}`} />
  <div id={`${id}-second`} data-tint-workspace-pane="second" style="display: grid; min-width: 0; min-height: 0; overflow: auto">{@render second()}</div>
</div>
