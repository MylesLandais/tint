<script lang="ts">
  import { onMount } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import Dice1 from '@lucide/svelte/icons/dice-1'
  import Dice2 from '@lucide/svelte/icons/dice-2'
  import Dice3 from '@lucide/svelte/icons/dice-3'
  import Dice4 from '@lucide/svelte/icons/dice-4'
  import Dice5 from '@lucide/svelte/icons/dice-5'
  import Dice6 from '@lucide/svelte/icons/dice-6'
  import Shuffle from '@lucide/svelte/icons/shuffle'
  import { animationFace, type DiceKind } from '../../../core/dice/model'
  import Icon from '../icon/Icon.svelte'
  import D10 from './D10.svelte'
  import D20 from './D20.svelte'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    kind?: DiceKind
    /** Settled result supplied by the host. */
    value: number
    rolling?: boolean
    /** Reports intent; the host produces the next result. */
    onRoll?: () => void
    label?: string
  }

  let { kind = 'd6', value, rolling = false, onRoll, label = 'Roll', class: className, ...rest }: Props = $props()
  const d6Faces = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
  let displayFace = $state<number | undefined>()
  let reduceMotion = $state(false)
  let faceIcon = $derived(d6Faces[(rolling ? displayFace ?? value : value) - 1] ?? Dice1)

  onMount(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion = query.matches
    const changed = () => { reduceMotion = query.matches }
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  })

  $effect(() => {
    if (!rolling) {
      displayFace = value
      return
    }
    if (reduceMotion) return
    const timer = window.setInterval(() => { displayFace = animationFace(kind) }, 80)
    return () => window.clearInterval(timer)
  })
</script>

<div {...rest} data-dice-roller="" data-kind={kind} class={['tint-dice-roller', className]}>
  <div class="die" data-rolling={rolling || undefined} role="status" aria-label={rolling ? 'Rolling' : `Rolled ${value}`}>
    {#if kind === 'd6'}
      <Icon icon={faceIcon} size="xl" />
    {:else}
      {#if kind === 'd10'}<Icon icon={D10} size="xl" />{:else}<Icon icon={D20} size="xl" />{/if}
      <span class="face" aria-hidden="true">{rolling && !reduceMotion ? displayFace ?? value : value}</span>
    {/if}
  </div>
  <button type="button" disabled={rolling} onclick={() => onRoll?.()}>
    <Icon icon={Shuffle} size="sm" />
    {label}
  </button>
</div>

<style>
  .tint-dice-roller { display: inline-flex; flex-direction: column; align-items: center; gap: var(--tint-space-3); }
  .die { position: relative; display: grid; width: 4rem; height: 4rem; place-items: center; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-accent); }
  .die[data-rolling] { animation: tumble .5s ease-in-out infinite; }
  .face { position: absolute; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 700; font-variant-numeric: tabular-nums; }
  button { display: inline-flex; align-items: center; gap: var(--tint-space-1); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: var(--tint-space-2) var(--tint-space-3); background: var(--tint-panel); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-xs); font-weight: 600; cursor: pointer; }
  button:hover:not(:disabled) { background: var(--tint-surface); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  button:disabled { cursor: not-allowed; opacity: .5; }
  @keyframes tumble { 25% { transform: rotate(16deg) scale(1.08); } 50% { transform: rotate(-14deg) scale(.96); } 75% { transform: rotate(10deg) scale(1.04); } }
  @media (prefers-reduced-motion: reduce) { .die[data-rolling] { animation: none; } }
</style>
