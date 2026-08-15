import { describe, expect, it } from 'vitest'
import {
  buildThreadIndex,
  buildThreadTree,
  replySnippet,
  threadRoot,
  threadSummary,
} from './thread'
import type { ChatActor, ChatMessageData } from './types'

const human: ChatActor = { id: 'human', name: 'You', kind: 'human' }
const assistant: ChatActor = { id: 'assistant', name: 'Tint', kind: 'assistant' }

function message(
  id: string,
  createdAt: string,
  parentMessageId?: string,
  actor: ChatActor = human,
  text = `text of ${id}`,
): ChatMessageData {
  return {
    id,
    actor,
    createdAt,
    status: 'complete',
    parentMessageId,
    parts: [{ id: `${id}-text`, type: 'text', text }],
  }
}

// q → a1 → a2 (nested), plus an unrelated root u.
const q = message('q', '2026-08-02T10:00:00Z')
const a1 = message('a1', '2026-08-02T10:01:00Z', 'q', assistant)
const a2 = message('a2', '2026-08-02T10:02:00Z', 'a1')
const u = message('u', '2026-08-02T10:03:00Z')
const flat = [q, a1, a2, u]

describe('buildThreadIndex', () => {
  it('groups direct replies by parent, chronologically', () => {
    const index = buildThreadIndex(flat)
    expect(index.get('q')?.map((m) => m.id)).toEqual(['a1'])
    expect(index.get('a1')?.map((m) => m.id)).toEqual(['a2'])
    expect(index.has('u')).toBe(false)
  })

  it('orders siblings by creation time, not input order', () => {
    const late = message('late', '2026-08-02T10:05:00Z', 'q')
    const early = message('early', '2026-08-02T10:00:30Z', 'q')
    const index = buildThreadIndex([late, early, q])
    expect(index.get('q')?.map((m) => m.id)).toEqual(['early', 'late'])
  })
})

describe('buildThreadTree', () => {
  it('nests replies under parentless roots in input order', () => {
    const tree = buildThreadTree(flat)
    expect(tree.map((node) => node.message.id)).toEqual(['q', 'u'])
    expect(tree[0]?.replies[0]?.message.id).toBe('a1')
    expect(tree[0]?.replies[0]?.replies[0]?.message.id).toBe('a2')
    expect(tree[1]?.replies).toEqual([])
  })

  it('cuts parent cycles instead of looping forever', () => {
    const x = message('x', '2026-08-02T10:00:00Z', 'y')
    const y = message('y', '2026-08-02T10:01:00Z', 'x')
    expect(() => buildThreadTree([x, y])).not.toThrow()
  })
})

describe('threadSummary', () => {
  it('counts all descendants with participants and last activity', () => {
    const summary = threadSummary(flat, 'q')
    expect(summary).toEqual({
      rootMessageId: 'q',
      replyCount: 2,
      lastReplyAt: '2026-08-02T10:02:00Z',
      participantIds: expect.arrayContaining(['assistant', 'human']),
    })
  })

  it('reports an empty thread for a leaf message', () => {
    expect(threadSummary(flat, 'u').replyCount).toBe(0)
  })
})

describe('threadRoot', () => {
  it('walks to the topmost ancestor', () => {
    expect(threadRoot(flat, a2)?.id).toBe('q')
    expect(threadRoot(flat, q)?.id).toBe('q')
  })

  it('returns undefined for a dangling parent link', () => {
    const orphan = message('orphan', '2026-08-02T10:04:00Z', 'missing')
    expect(threadRoot([orphan], orphan)).toBeUndefined()
  })
})

describe('replySnippet', () => {
  it('joins text parts and truncates with an ellipsis', () => {
    const long = message('long', '2026-08-02T10:00:00Z', undefined, human, 'x'.repeat(200))
    expect(replySnippet(long, 40)).toHaveLength(41)
    expect(replySnippet(long, 40).endsWith('…')).toBe(true)
    expect(replySnippet(q)).toBe('text of q')
  })
})
