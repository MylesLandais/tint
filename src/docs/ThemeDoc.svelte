<script lang="ts">
  import { ThemePicker, ThemeToggle, colorSchemeStore, themeNameStore, type ThemeOption } from '../svelte/components/theme'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const themes: readonly ThemeOption[] = [
    { value: 'tint', label: 'Tint' }, { value: 'solarized', label: 'Solarized' },
    { value: 'gruvbox', label: 'Gruvbox' }, { value: 'latte', label: 'Latte' },
    { value: 'frappe', label: 'Frappé' }, { value: 'macchiato', label: 'Macchiato' },
    { value: 'mocha', label: 'Mocha' },
  ]
  const tokens = [
    ['--tint-panel', 'Panel'], ['--tint-surface', 'Surface'], ['--tint-accent', 'Accent'],
    ['--tint-success', 'Success'], ['--tint-warning', 'Warning'], ['--tint-danger', 'Danger'],
  ] as const
  const api: ApiRow[] = [
    { prop: 'ThemePicker value / onChange / themes', type: 'string / callback / ThemeOption[]', description: 'Controlled native palette select. The host supplies the themes whose stylesheets it loaded.' },
    { prop: 'ThemeToggle value / onChange', type: 'system | light | dark / callback', description: 'Controlled three-state radiogroup; an unset scheme follows the system.' },
    { prop: 'themeNameStore / colorSchemeStore', type: 'Svelte readable stores with set()', description: 'Optional shared browser state that persists the choice and stamps the document root.' },
    { prop: 'data-theme', type: 'tint | solarized | gruvbox | latte | frappe | macchiato | mocha', description: 'Palette on the document root.' },
    { prop: 'data-scheme', type: 'light | dark | omitted', description: 'Color scheme; omission follows the system.' },
    { prop: '--tint-*', type: 'CSS custom properties', description: 'Semantic colors, spacing, typography, and motion.' },
  ]
  const usage = `import '@nebula/tint/styles.css'
import '@nebula/tint/themes/gruvbox.css'
import { ThemePicker, ThemeToggle, themeNameStore, colorSchemeStore } from '@nebula/tint/theme'

<ThemePicker value={$themeNameStore} onChange={themeNameStore.set} {themes} />
<ThemeToggle value={$colorSchemeStore.preference} onChange={colorSchemeStore.set} />`
</script>

<DocPage title="Theme" description="Tint semantic tokens stay stable while the palette and color scheme change. The controls use shared browser preference state, so the header and this preview stay in sync." importPath="@nebula/tint/theme" {usage} {api} accessibility="The palette uses a labeled native select. The scheme control has one tab stop, arrow keys select and focus the next radio, and Home and End reach the boundaries. Both choices remain readable as text and persist across reloads.">
  <div class="theme-demo">
    <div class="controls">
      <ThemePicker value={$themeNameStore} onChange={themeNameStore.set} {themes} label="Preview theme" />
      <ThemeToggle value={$colorSchemeStore.preference} onChange={colorSchemeStore.set} label="Preview color scheme" showLabels />
    </div>
    <p class="state" aria-live="polite">Theme: {$themeNameStore} · Preference: {$colorSchemeStore.preference} · Resolved: {$colorSchemeStore.resolved}</p>
    <div class="swatches">
      {#each tokens as [token, label] (token)}
        <div class="swatch"><span style:background={`var(${token})`} aria-hidden="true"></span><strong>{label}</strong><code>{token}</code></div>
      {/each}
    </div>
  </div>
</DocPage>

<style>
  .theme-demo { display: grid; gap: var(--tint-space-3); min-width: 0; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-3); }
  .state { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .75rem; }
  .swatch { display: grid; gap: .3rem; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); font-size: .8rem; }
  .swatch span { height: 2.5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); }
  .swatch code { color: var(--tint-muted); font-size: .7rem; }
</style>
