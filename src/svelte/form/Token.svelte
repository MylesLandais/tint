<script lang="ts">
  import './styles.css'

  type Props = {
    label: string
    onRemove?: () => void
    disabled?: boolean
  }

  let { label, onRemove, disabled = false }: Props = $props()
</script>

<span class="tint-token" data-disabled={disabled}>
  <span>{label}</span>
  {#if onRemove}
    <button
      type="button"
      class="tint-token__remove"
      aria-label={`Remove ${label}`}
      {disabled}
      onclick={() => onRemove?.()}
    >×</button>
  {/if}
</span>
