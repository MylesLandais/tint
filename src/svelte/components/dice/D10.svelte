<script lang="ts">
  import type { LucideProps } from '@lucide/svelte'

  let { size = 24, color = 'currentColor', strokeWidth = 2, ...rest }: LucideProps = $props()
</script>

<svg {...rest} width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2 21 9 12 22 3 9Z" />
  <path d="M3 9h18" />
</svg>
