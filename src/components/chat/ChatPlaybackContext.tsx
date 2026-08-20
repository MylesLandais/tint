import { createContext, useContext } from 'react'
import type { ChatId } from './types'

/**
 * One conversation playback slot. Starting a line stops whoever is speaking;
 * Repeat on the same message bumps `speakGeneration` so the clip restarts.
 */
export type ChatPlaybackSlot = {
  speakingMessageId: ChatId | null
  speakGeneration: number
  requestSpeak: (messageId: ChatId) => void
  clearSpeak: (messageId: ChatId) => void
}

export const ChatPlaybackContext = createContext<ChatPlaybackSlot | null>(null)

export function useChatPlayback() {
  return useContext(ChatPlaybackContext)
}
