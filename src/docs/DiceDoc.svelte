<script lang="ts">
  import DiceRoller from '../svelte/components/dice/DiceRoller.svelte'
  import { FACE_COUNT, type DiceKind } from '../core/dice/model'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const kinds: DiceKind[] = ['d6', 'd10', 'd20']
  let kind = $state<DiceKind>('d20')
  let value = $state(20)
  let rolling = $state(false)
  const api: ApiRow[] = [
    { prop: 'kind', type: "'d6' | 'd10' | 'd20'", description: 'Die face count and glyph.' },
    { prop: 'value', type: 'number', description: 'Authoritative settled result supplied by the host.' },
    { prop: 'rolling', type: 'boolean', description: 'Host-owned animation state while a roll is pending.' },
    { prop: 'onRoll', type: '() => void', description: 'Reports intent; the host computes the result.' },
    { prop: 'label', type: 'string', description: 'Visible roll button label.' },
    { prop: 'D10 / D20', type: 'LucideIcon', description: 'Custom glyphs that can also render through Tint Icon.' },
  ]
  const usage = `import { DiceRoller, D20 } from '@nebula/tint/dice'
import { Icon } from '@nebula/tint/icon'
let value = $state(1)
let rolling = $state(false)

async function roll() {
  rolling = true
  value = await api.roll('d20')
  rolling = false
}

<DiceRoller kind="d20" {value} {rolling} onRoll={roll} />

// The custom glyphs can also be used with Tint Icon.
<Icon icon={D20} size="xl" label="Twenty-sided die" />`

  function roll() {
    if (rolling) return
    rolling = true
    window.setTimeout(() => {
      value = 1 + Math.floor(Math.random() * FACE_COUNT[kind])
      rolling = false
    }, 650)
  }
</script>

<DocPage title="Dice" description="A controlled die that animates intent but never decides the authoritative result." importPath="@nebula/tint/dice" {usage} {api} accessibility="The roll control is a native button and is disabled while pending. The result is announced through a named status. Decorative animation stops for reduced-motion preferences; the host-supplied value still settles.">
  <div class="demo">
    <DiceRoller {kind} {value} {rolling} onRoll={roll} />
    <div role="group" aria-label="Die kind" class="kinds">
      {#each kinds as option}
        <button type="button" aria-pressed={kind === option} onclick={() => { kind = option; value = 1 }}>{option}</button>
      {/each}
    </div>
  </div>
</DocPage>

<style>
  .demo { display: grid; justify-items: center; gap: 1.25rem; }
  .kinds { display: flex; gap: .35rem; }
  button { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .4rem .7rem; background: var(--tint-panel); color: var(--tint-muted); font: inherit; font-size: .8rem; cursor: pointer; }
  button[aria-pressed='true'] { background: var(--tint-accent-soft); color: var(--tint-accent); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); }
</style>
