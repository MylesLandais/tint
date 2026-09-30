<script lang="ts">
  import { conversationFromTrace } from './correlation'
  import { formatMs } from './fixtures'
  import type { CorrelationBundle } from './types'

  let { bundle, selectedSpanId, onSelectedSpanIdChange }: {
    bundle: CorrelationBundle | null
    selectedSpanId: string | null
    onSelectedSpanIdChange: (spanId: string | null) => void
  } = $props()
  let turns = $derived(conversationFromTrace(bundle?.trace ?? null))
</script>

{#if turns.length === 0}
  <div><p>No conversation recorded</p><p class="text-sm text-tint-muted">This interaction was answered without an agent turn, or its trace never arrived.</p></div>
{:else}
  <ol aria-label="Agent conversation" class="m-0 grid list-none gap-2 p-0">
    {#each turns as turn (turn.spanId)}
      <li>
        <button type="button" aria-pressed={selectedSpanId === turn.spanId} onclick={() => onSelectedSpanIdChange(selectedSpanId === turn.spanId ? null : turn.spanId)}
          class={['w-full rounded-lg border p-3 text-left', selectedSpanId === turn.spanId ? 'border-tint-accent bg-tint-accent/5' : 'border-tint-border']}>
          <span class="flex flex-wrap items-center gap-2"><strong class="text-xs">{turn.role}</strong><code class="text-xs">{turn.label}</code><small class="ml-auto text-tint-muted">+{formatMs(turn.startMs)} · {formatMs(turn.durationMs)}</small></span>
          <span class={['mt-2 block text-sm', turn.failed && 'text-tint-danger']}>{turn.text}</span>
        </button>
      </li>
    {/each}
  </ol>
{/if}

<style>button:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: 2px; }</style>
