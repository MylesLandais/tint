import { cn } from '@/lib/utils'
import type { ChatConversationProps } from './types'

const densityClasses = {
  compact: 'gap-2',
  comfortable: 'gap-3',
  spacious: 'gap-5',
} as const

export function ChatConversation({
  label = 'Conversation',
  density = 'comfortable',
  className,
  children,
  ...props
}: ChatConversationProps) {
  return (
    <section
      aria-label={label}
      data-chat-conversation=""
      data-density={density}
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden bg-tint-panel text-tint-ink',
        densityClasses[density],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
