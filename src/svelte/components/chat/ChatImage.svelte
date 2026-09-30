<script lang="ts">
  import type { ChatImagePart } from '../../../core/chat'
  import ChatPart from './ChatPart.svelte'
  import type { ChatRichPartProps } from './types'

  let { part, messageId, onAction, onDecision, onRetry,
    class: className, className: legacyClassName, ...rest }: ChatRichPartProps<ChatImagePart> = $props()
</script>

<ChatPart {...rest} {part} {messageId} {onAction} {onDecision} {onRetry} class={[className, legacyClassName].filter(Boolean).join(' ')} />
