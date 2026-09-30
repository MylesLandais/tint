<script lang="ts">
  import type { ChatConversationProps } from './types'

  let { label = 'Conversation', density = 'comfortable', children,
    class: className, ...rest }: ChatConversationProps = $props()
</script>

<section {...rest} aria-label={label} data-chat-conversation="" data-density={density}
  class={['relative flex min-h-0 flex-col overflow-hidden bg-tint-panel text-tint-ink',
    density === 'compact' ? 'gap-2' : density === 'spacious' ? 'gap-5' : 'gap-3', className]}>
  {@render children?.()}
</section>
