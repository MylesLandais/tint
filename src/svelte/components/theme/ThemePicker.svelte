<script lang="ts">
  import Icon from '../icon/Icon.svelte'
  import { THEME_GLYPHS } from '../icon/glyphs'
  import type { ThemePickerProps } from './types'

  let { value, onChange, themes, label = 'Theme', class: className, ...rest }: ThemePickerProps = $props()
  const generatedId = $props.id()
  let selectId = $derived(rest.id ?? generatedId)
</script>

<div data-tint-theme-picker="" class="picker">
  <label for={selectId} class="sr-only">{label}</label>
  <div class="field">
    <span class="leading" aria-hidden="true"><Icon icon={THEME_GLYPHS.palette} size="sm" /></span>
    <select {...rest} id={selectId} class={['select', className].filter(Boolean).join(' ')} {value} onchange={(event) => onChange(event.currentTarget.value)}>
      {#each themes as theme (theme.value)}<option value={theme.value}>{theme.label}</option>{/each}
    </select>
    <span class="trailing" aria-hidden="true"><Icon icon={THEME_GLYPHS.chevronDown} size="sm" /></span>
  </div>
</div>

<style>
  .picker { display: inline-flex; max-width: 100%; align-items: center; }
  .field { position: relative; display: inline-flex; max-width: 100%; align-items: center; }
  .select { min-height: 2rem; max-width: 100%; appearance: none; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-surface); padding: 0 var(--tint-space-6) 0 var(--tint-space-7); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-xs); font-weight: 500; cursor: pointer; }
  .select:hover { background: var(--tint-panel); }
  .select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .leading, .trailing { position: absolute; display: inline-flex; pointer-events: none; color: var(--tint-muted); }
  .leading { left: var(--tint-space-2); }
  .trailing { right: var(--tint-space-2); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
