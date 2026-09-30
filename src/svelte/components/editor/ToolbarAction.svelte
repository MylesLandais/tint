<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte'
  import Icon from '../icon/Icon.svelte'
  let {
    label, icon, pressed, disabled = false, onPress,
  }: {
    label: string
    icon: LucideIcon
    pressed?: boolean
    disabled?: boolean
    onPress: () => void
  } = $props()
</script>

<button type="button" aria-label={label} title={label} aria-pressed={pressed} {disabled} onmousedown={(event) => event.preventDefault()} onclick={onPress}><Icon {icon} size="sm" /></button>

<style>
  button { display: inline-flex; min-width: 2rem; height: 2rem; align-items: center; justify-content: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-1); color: var(--tint-muted); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover, button[aria-pressed='true'] { background: var(--tint-accent-soft); color: var(--tint-accent); }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
