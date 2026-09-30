<script lang="ts">
  import { SCHEME_OPTIONS, nextColorSchemePreference, type ColorSchemePreference } from '../../../core/theme'
  import Icon from '../icon/Icon.svelte'
  import { THEME_GLYPHS } from '../icon/glyphs'
  import type { ThemeToggleProps } from './types'

  let {
    value, onChange, label = 'Color scheme', showLabels = false, disabled = false,
    class: className, onkeydown: externalKeydown, ...rest
  }: ThemeToggleProps = $props()
  let group = $state<HTMLDivElement | null>(null)

  function choose(next: ColorSchemePreference) {
    if (disabled) return
    onChange(next)
    group?.querySelector<HTMLButtonElement>(`[data-scheme-option="${next}"]`)?.focus()
  }

  function keydown(event: KeyboardEvent) {
    if (disabled) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault(); choose(nextColorSchemePreference(value, 1))
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault(); choose(nextColorSchemePreference(value, -1))
    } else if (event.key === 'Home') {
      event.preventDefault(); choose(SCHEME_OPTIONS[0].value)
    } else if (event.key === 'End') {
      event.preventDefault(); choose(SCHEME_OPTIONS[SCHEME_OPTIONS.length - 1].value)
    }
    externalKeydown?.(event as KeyboardEvent & { currentTarget: HTMLDivElement })
  }
</script>

<div {...rest} bind:this={group} role="radiogroup" aria-label={label} data-tint-theme-toggle="" class={['theme-toggle', className].filter(Boolean).join(' ')} onkeydown={keydown}>
  {#each SCHEME_OPTIONS as option (option.value)}
    {@const selected = option.value === value}
    <button type="button" role="radio" aria-checked={selected} aria-label={showLabels ? undefined : option.label} data-scheme-option={option.value} tabindex={selected ? 0 : -1} {disabled} onclick={() => choose(option.value)}>
      <Icon icon={THEME_GLYPHS[option.value]} size="sm" />
      {#if showLabels}<span>{option.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .theme-toggle { display: inline-flex; max-width: 100%; flex-wrap: wrap; align-items: center; gap: 2px; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-surface); padding: 2px; }
  button { display: inline-flex; min-width: 2rem; min-height: 2rem; align-items: center; justify-content: center; gap: var(--tint-space-1); border: 0; border-radius: var(--tint-radius-md); background: transparent; padding: var(--tint-space-1) var(--tint-space-2); color: var(--tint-muted); cursor: pointer; font: inherit; font-size: var(--tint-font-size-xs); font-weight: 500; }
  button:hover:not(:disabled) { color: var(--tint-ink); }
  button[aria-checked='true'] { background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 1px 3px var(--tint-shadow-color); }
  button:disabled { cursor: not-allowed; opacity: .5; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
