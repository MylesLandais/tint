<script lang="ts">
  let { class: className }: { class?: string } = $props()
</script>

<div aria-hidden="true" class={['tint-media-placeholder', className].filter(Boolean).join(' ')}>
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2" />
    <circle cx="24" cy="24" r="5" fill="currentColor" />
  </svg>
</div>

<style>
  .tint-media-placeholder { display: grid; width: 100%; height: 100%; place-items: center; background: var(--tint-surface); color: var(--tint-border-strong); }
  svg { width: 1.5rem; height: 1.5rem; }
</style>
