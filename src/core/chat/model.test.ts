import { describe, expect, it } from 'vitest'
import { chatGroupPositions, chatJsonPreview, chatMessageText, chatStatusAnnouncement, chatSubmitPayload } from './model'
import type { ChatMessageData } from './types'

const actor = { id: 'agent', name: 'Agent', kind: 'assistant' as const }
const message = (id: string, status: ChatMessageData['status'] = 'complete'): ChatMessageData => ({
  id, actor, createdAt: 0, status,
  parts: [ { id: 'text', type: 'text', text: 'Answer' }, { id: 'reason', type: 'reasoning', text: 'Private work' } ],
})

describe('chat model', () => {
  it('trims drafts and excludes failed or uploading attachments', () => {
    const ready = { id: 'ready', name: 'report', mediaType: 'text/plain', url: '/report', status: 'ready' as const }
    const uploading = { ...ready, id: 'uploading', status: 'uploading' as const }
    expect(chatSubmitPayload('  Hello  ', [ready, uploading])).toEqual({ text: 'Hello', attachments: [ready], metadata: undefined })
    expect(chatSubmitPayload(' ', [uploading])).toBeNull()
  })

  it('keeps reasoning out of copy and derives grouping and announcements', () => {
    expect(chatMessageText(message('a'))).toBe('Answer')
    expect(chatGroupPositions([message('a'), message('b')])).toEqual(['first', 'last'])
    expect(chatStatusAnnouncement([message('a', 'streaming')])).toBe('Agent is responding')
    expect(chatStatusAnnouncement([message('a', 'streaming')], 'agent')).toBe('')
  })

  it('caps arbitrary JSON previews without throwing on cycles', () => {
    expect(chatJsonPreview({ text: 'abcdef' }, 8)).toEqual({ text: '{\n  "tex', truncated: true, total: 22 })
    const cyclic: { self?: unknown } = {}
    cyclic.self = cyclic
    expect(chatJsonPreview(cyclic).text).toBe('Unable to display this value.')
  })
})
