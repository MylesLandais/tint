<script lang="ts">
  import type { TransitionPreset } from '../../../core/dj/contracts'
  import type { TransitionPresetPickerProps } from './types'

  const OPTIONS: readonly { value: TransitionPreset; label: string; description: string }[] = [
    { value: 'long-bass-swap', label: 'Long bass swap', description: 'Equal-power blend with a midpoint low-EQ handoff.' },
    { value: 'filter-echo-exit', label: 'Filter and echo exit', description: 'High-pass and echo the outgoing deck into a sharper handoff.' },
  ]
  let { value, onChange, disabled = false, class: className }: TransitionPresetPickerProps = $props()
  const name = $props.id()
  let fieldset = $state<HTMLFieldSetElement | null>(null)

  function requestChange(preset: TransitionPreset) {
    onChange(preset)
    // A native radio changes its own DOM state before the controlled prop updates.
    for (const input of fieldset?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) {
      input.checked = input.value === value
    }
  }
</script>

<fieldset bind:this={fieldset} class={className ?? 'grid gap-2'}>
  <legend class="mb-2 text-sm font-medium">Transition style</legend>
  {#each OPTIONS as option (option.value)}
    <label class="flex cursor-pointer gap-3 rounded-md border border-tint-border p-3 has-[:checked]:border-tint-accent">
      <input type="radio" aria-label={option.label} {name} value={option.value}
        checked={value === option.value} {disabled} onchange={() => requestChange(option.value)} />
      <span><span class="block text-sm font-medium">{option.label}</span><span class="block text-xs text-tint-muted">{option.description}</span></span>
    </label>
  {/each}
</fieldset>
