<script lang="ts">
  type Props = { label?: string; class?: string }
  let { label = 'or', class: className }: Props = $props()
</script>

<div class={['tint-auth-divider', className].filter(Boolean).join(' ')} role="separator" aria-label={label}>
  <span aria-hidden="true">{label}</span>
</div>

<style>
  .tint-auth-divider { display: flex; align-items: center; gap: var(--tint-space-3); color: var(--tint-muted); font-size: var(--tint-font-size-xs); text-transform: uppercase; letter-spacing: .04em; }
  .tint-auth-divider::before, .tint-auth-divider::after { content: ''; flex: 1; border-top: 1px solid var(--tint-border); }
</style>
