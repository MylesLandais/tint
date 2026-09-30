<script lang="ts">
  import type { LucideProps } from '@lucide/svelte'

  let { size = 24, color = 'currentColor', strokeWidth = 2, ...rest }: LucideProps = $props()
</script>

<svg {...rest} width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2 21 7 21 17 12 22 3 17 3 7Z" />
  <path d="M12 12 12 2M12 12 21 7M12 12 21 17M12 12 12 22M12 12 3 17M12 12 3 7" />
</svg>
