<!--
  Temporary migration infrastructure, not a product primitive. It proves
  TypeScript in .svelte, $props, token access, callbacks and package export
  resolution. Delete once a real component covers the same ground.
-->
<script lang="ts">
  type Props = {
    label: string
    active?: boolean
    onactivate?: () => void
  }

  let { label, active = false, onactivate }: Props = $props()
</script>

<button
  type="button"
  class="tint-svelte-smoke"
  aria-pressed={active}
  data-active={active}
  onclick={() => onactivate?.()}
>
  {label}
</button>

<style>
  .tint-svelte-smoke {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--tint-border);
    border-radius: 0.25rem;
    background: var(--tint-surface);
    color: var(--tint-ink);
    font: inherit;
    cursor: pointer;
  }
  .tint-svelte-smoke[data-active='true'] {
    background: var(--tint-accent);
    border-color: var(--tint-accent);
    color: var(--tint-on-accent);
  }
  .tint-svelte-smoke:focus-visible {
    outline: 2px solid var(--tint-accent);
    outline-offset: 2px;
  }
</style>
