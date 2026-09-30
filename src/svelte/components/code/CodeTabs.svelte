<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'
  import { codeLanguageLabel, COPY_FEEDBACK_MS } from '../../../core/code'
  import Icon from '../icon/Icon.svelte'
  import { GLYPHS } from '../icon/glyphs'
  import HighlightedCode from './HighlightedCode.svelte'
  import type { CodeTab } from './types'

  type Props = {
    tabs: readonly CodeTab[]
    value?: string
    defaultValue?: string
    onValueChange?: (id: string) => void
    label?: string
    accessory?: Snippet<[CodeTab]>
    class?: string
  }

  let {
    tabs, value, defaultValue, onValueChange, label = 'Code examples', accessory,
    class: className,
  }: Props = $props()
  const instanceId = $props.id()
  let root = $state<HTMLElement | null>(null)
  let internal = $state<string | undefined>()
  let activeId = $derived(value ?? internal ?? defaultValue ?? tabs[0]?.id)
  let activeIndex = $derived(Math.max(0, tabs.findIndex((tab) => tab.id === activeId)))
  let active = $derived(tabs[activeIndex])
  let copiedId = $state<string | null>(null)
  let resetCopy: ReturnType<typeof setTimeout> | undefined

  onDestroy(() => { if (resetCopy) clearTimeout(resetCopy) })

  function activate(index: number, focus = false) {
    const tab = tabs[(index + tabs.length) % tabs.length]
    if (!tab) return
    if (value === undefined) internal = tab.id
    onValueChange?.(tab.id)
    if (focus) root?.querySelector<HTMLElement>(`[data-tab-index="${index}"]`)?.focus()
  }

  function onTabKeydown(event: KeyboardEvent, index: number) {
    let next = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    activate(next, true)
  }

  async function copyCode(tab: CodeTab) {
    if (!tab.code) return
    try {
      await navigator.clipboard.writeText(tab.code)
      copiedId = tab.id
      if (resetCopy) clearTimeout(resetCopy)
      resetCopy = setTimeout(() => { copiedId = null }, COPY_FEEDBACK_MS)
    } catch {
      copiedId = null
    }
  }
</script>

{#if active}
  <section bind:this={root} class={['tint-code-tabs', className].filter(Boolean).join(' ')}>
    <div role="tablist" aria-label={label} class="tint-code-tabs__list">
      {#each tabs as tab, index (tab.id)}
        <button
          id={`${instanceId}-${index}-tab`}
          type="button"
          role="tab"
          data-tab-index={index}
          aria-selected={index === activeIndex}
          aria-controls={`${instanceId}-${index}-panel`}
          tabindex={index === activeIndex ? 0 : -1}
          onclick={() => activate(index)}
          onkeydown={(event) => onTabKeydown(event, index)}
        >
          {#if tab.icon}<Icon icon={tab.icon} size="sm" />{/if}
          {tab.label ?? codeLanguageLabel(tab.language)}
        </button>
      {/each}
    </div>
    {#each tabs as tab, index (tab.id)}
      {#if index !== activeIndex}
        <div id={`${instanceId}-${index}-panel`} role="tabpanel" aria-labelledby={`${instanceId}-${index}-tab`} hidden></div>
      {/if}
    {/each}
    <div id={`${instanceId}-${activeIndex}-panel`} role="tabpanel" aria-labelledby={`${instanceId}-${activeIndex}-tab`} class="tint-code-tabs__panel">
      <header class="tint-code-tabs__header">
        <span>{#if active.icon}<Icon icon={active.icon} size="sm" />{/if}{active.title ?? active.label ?? codeLanguageLabel(active.language)}</span>
        <button type="button" aria-label={copiedId === active.id ? 'Code copied' : 'Copy code'} onclick={() => void copyCode(active)}>
          <Icon icon={copiedId === active.id ? GLYPHS.check : GLYPHS.copy} size="sm" />
          {copiedId === active.id ? 'Copied' : 'Copy'}
        </button>
      </header>
      <pre><HighlightedCode code={active.code} language={active.language} lineNumbers={active.lineNumbers} startLine={active.startLine} highlightLines={active.highlightLines} highlightWords={active.highlightWords} /></pre>
    </div>
    {#if accessory}<div data-code-tabs-accessory class="tint-code-tabs__accessory">{@render accessory(active)}</div>{/if}
  </section>
{/if}

<style>
  .tint-code-tabs { overflow: hidden; border: 1px solid var(--tint-code-border); border-radius: var(--tint-radius-lg); background: var(--tint-code); color: var(--tint-code-ink); }
  .tint-code-tabs__list { display: flex; gap: .25rem; overflow-x: auto; border-bottom: 1px solid var(--tint-code-border); padding: .25rem .5rem; }
  button { display: inline-flex; align-items: center; gap: .35rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-code-muted); cursor: pointer; font: inherit; }
  button:hover { background: color-mix(in srgb, var(--tint-code-ink) 10%, transparent); color: var(--tint-code-ink); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .tint-code-tabs__list button { flex: none; padding: .4rem .7rem; font-size: .75rem; font-weight: 600; }
  .tint-code-tabs__list button[aria-selected='true'] { background: color-mix(in srgb, var(--tint-code-ink) 10%, transparent); color: var(--tint-code-ink); }
  .tint-code-tabs__panel { min-width: 0; }
  .tint-code-tabs__header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; border-bottom: 1px solid var(--tint-code-border); padding: .5rem .75rem; color: var(--tint-code-muted); font-size: .75rem; }
  .tint-code-tabs__header span { display: inline-flex; align-items: center; gap: .35rem; }
  .tint-code-tabs__header button { padding: .3rem .5rem; font-size: .75rem; }
  pre { overflow-x: auto; margin: 0; padding: 1rem; font-size: .8rem; line-height: 1.5; }
  .tint-code-tabs__accessory { border-top: 1px solid var(--tint-code-border); background: var(--tint-surface); color: var(--tint-ink); }
</style>
