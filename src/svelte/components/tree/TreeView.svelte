<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import { onDestroy, tick } from 'svelte'
  import { typeaheadIndex } from '../../../core/interaction/navigation'
  import { toTreeSet, toggleTreeId, visibleTreeEntries } from '../../../core/tree/model'
  import Icon from '../icon/Icon.svelte'
  import type { TreeNode, TreeViewProps } from './types'

  let {
    nodes, expandedIds, onExpandedChange, selectedIds, onSelectedChange,
    class: className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, ...rest
  }: TreeViewProps = $props()
  let root = $state<HTMLUListElement>()
  let activeId = $state<string | null>(null)
  let search = ''
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  const expanded = $derived(toTreeSet(expandedIds))
  const selected = $derived(toTreeSet(selectedIds))
  const visible = $derived(visibleTreeEntries(nodes, expandedIds))
  const selectable = $derived(Boolean(onSelectedChange))

  onDestroy(() => clearTimeout(searchTimer))

  $effect(() => {
    if (visible.some((entry) => entry.id === activeId)) return
    activeId = visible[0]?.id ?? null
  })

  function nodeLabel(node: TreeNode): string {
    return typeof node.label === 'string' ? node.label : node.labelText ?? ''
  }

  function findNode(id: string, branches: readonly TreeNode[] = nodes): TreeNode | undefined {
    for (const node of branches) {
      if (node.id === id) return node
      const match = node.children && findNode(id, node.children)
      if (match) return match
    }
    return undefined
  }

  function visibleAncestor(id: string, branches: readonly TreeNode[] = nodes, ancestors: string[] = []): string | null {
    for (const node of branches) {
      if (node.id === id) return ancestors.reverse().find((ancestor) => visible.some((entry) => entry.id === ancestor)) ?? null
      if (node.children) {
        const match = visibleAncestor(id, node.children, [...ancestors, node.id])
        if (match) return match
      }
    }
    return null
  }

  function focusTreeItem(id: string | undefined | null) {
    if (!id) return
    activeId = id
    void tick().then(() => {
      const item = Array.from(root?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [])
        .find((element) => element.dataset.treeId === id)
      item?.focus()
    })
  }

  $effect.pre(() => {
    if (!activeId || visible.some((entry) => entry.id === activeId)) return
    const hadFocus = Boolean(root?.contains(document.activeElement))
    const nextId = visibleAncestor(activeId) ?? visible[0]?.id ?? null
    activeId = nextId
    if (hadFocus) focusTreeItem(nextId)
  })

  function toggleExpand(id: string) {
    onExpandedChange(toggleTreeId(expandedIds, id))
  }

  function toggleSelect(id: string) {
    if (!onSelectedChange) return
    onSelectedChange(toggleTreeId(selectedIds ?? [], id))
  }

  function onTreeItemKeydown(event: KeyboardEvent, id: string) {
    if (event.target !== event.currentTarget) return
    const index = visible.findIndex((entry) => entry.id === id)
    if (index < 0) return
    const entry = visible[index]
    let nextId: string | null = null
    if (event.key === 'ArrowDown') nextId = visible[Math.min(index + 1, visible.length - 1)]?.id ?? null
    else if (event.key === 'ArrowUp') nextId = visible[Math.max(index - 1, 0)]?.id ?? null
    else if (event.key === 'Home') nextId = visible[0]?.id ?? null
    else if (event.key === 'End') nextId = visible.at(-1)?.id ?? null
    else if (event.key === 'ArrowRight') {
      if (entry.hasChildren && !expanded.has(id)) toggleExpand(id)
      else if (entry.hasChildren) nextId = entry.firstChildId
    } else if (event.key === 'ArrowLeft') {
      if (entry.hasChildren && expanded.has(id)) toggleExpand(id)
      else nextId = entry.parentId
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (selectable) toggleSelect(id)
      else if (entry.hasChildren) toggleExpand(id)
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      search += event.key.toLocaleLowerCase()
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => { search = '' }, 500)
      const labels = visible.map((item) => ({ label: nodeLabel(findNode(item.id)!) }))
      let match = typeaheadIndex(labels, search, index)
      if (match < 0 && search.length > 1) {
        search = event.key.toLocaleLowerCase()
        match = typeaheadIndex(labels, search, index)
      }
      if (match >= 0) nextId = visible[match].id
      else return
    } else return
    event.preventDefault()
    if (nextId) focusTreeItem(nextId)
  }
</script>

<ul
  {...rest}
  bind:this={root}
  role="tree"
  data-tree-view=""
  aria-label={ariaLabelledby ? ariaLabel : ariaLabel ?? 'Tree'}
  aria-labelledby={ariaLabelledby}
  class={['tint-tree', className].filter(Boolean).join(' ')}
>
  {#snippet branch(node: TreeNode, depth: number)}
    {@const hasChildren = (node.children?.length ?? 0) > 0}
    {@const isExpanded = expanded.has(node.id)}
    {@const isSelected = selected.has(node.id)}
    <li
      role="treeitem"
      data-tree-node=""
      data-tree-id={node.id}
      data-expanded={isExpanded || undefined}
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-checked={selectable ? isSelected : undefined}
      aria-label={nodeLabel(node) || undefined}
      tabindex={activeId === node.id ? 0 : -1}
      onfocus={() => { activeId = node.id }}
      onkeydown={(event) => onTreeItemKeydown(event, node.id)}
    >
      <div class="tint-tree-row" style:padding-left={`${depth * 0.75 + 0.25}rem`}>
        {#if hasChildren}
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${nodeLabel(node) || node.id}`}
            class="tint-tree-toggle"
            onclick={() => toggleExpand(node.id)}
          ><Icon icon={ChevronRight} size="xs" class={isExpanded ? 'expanded' : ''} /></button>
        {:else}
          <span class="tint-tree-spacer" aria-hidden="true"></span>
        {/if}
        {#if selectable}
          <input
            type="checkbox"
            checked={isSelected}
            aria-label={nodeLabel(node) || node.id}
            onchange={(event) => {
              toggleSelect(node.id)
              // The host's selectedIds prop remains authoritative after native input toggles.
              event.currentTarget.checked = isSelected
            }}
          />
        {/if}
        <span class="tint-tree-label">{#if typeof node.label === 'string'}{node.label}{:else}{@render node.label()}{/if}</span>
        {#if node.trailing}
          <span class="tint-tree-trailing">{#if typeof node.trailing === 'string'}{node.trailing}{:else}{@render node.trailing()}{/if}</span>
        {/if}
      </div>
      {#if hasChildren && isExpanded}
        <ul role="group" class="tint-tree-group">
          {#each node.children ?? [] as child (child.id)}{@render branch(child, depth + 1)}{/each}
        </ul>
      {/if}
    </li>
  {/snippet}
  {#each nodes as node (node.id)}{@render branch(node, 0)}{/each}
</ul>

<style>
  .tint-tree, .tint-tree-group { margin: 0; list-style: none; padding: 0; }
  .tint-tree-row { display: flex; min-height: 2rem; align-items: center; gap: var(--tint-space-1); border-radius: var(--tint-radius-sm); padding-right: var(--tint-space-1); color: var(--tint-ink); font-size: var(--tint-font-size-sm); }
  [role='treeitem']:is(:focus-visible, :hover) > .tint-tree-row { background: var(--tint-accent-soft); }
  [role='treeitem']:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .tint-tree-toggle { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border: 0; border-radius: var(--tint-radius-sm); padding: 0; background: transparent; color: var(--tint-muted); cursor: pointer; }
  .tint-tree-toggle:hover { color: var(--tint-ink); }
  .tint-tree-toggle:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  :global(.tint-tree-toggle svg) { transition: transform 150ms ease; }
  :global(.tint-tree-toggle svg.expanded) { transform: rotate(90deg); }
  .tint-tree-spacer { display: inline-block; flex: none; width: 1.25rem; }
  input[type='checkbox'] { width: 0.875rem; height: 0.875rem; accent-color: var(--tint-accent); }
  .tint-tree-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tint-tree-trailing { flex: none; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  @media (prefers-reduced-motion: reduce) { :global(.tint-tree-toggle svg) { transition: none; } }
</style>
