import { afterEach, describe, expect, it } from 'vitest'
import { applyUpdate, encodeStateAsUpdate, createCollabSession } from './index'

const sessions: Array<{ destroy: () => void }> = []

afterEach(() => {
  for (const session of sessions.splice(0)) session.destroy()
})

describe('createCollabSession', () => {
  it('round-trips text between isolated docs via applyUpdate', () => {
    const a = createCollabSession({ room: 'test-none', network: { kind: 'none' } })
    const b = createCollabSession({ room: 'test-none', network: { kind: 'none' } })
    sessions.push(a, b)

    a.fragment.insert(0, 'hello tint')
    applyUpdate(b.doc, encodeStateAsUpdate(a.doc))

    expect(b.fragment.toString()).toBe('hello tint')
  })

  it('meshes two broadcast sessions in the same tab', () => {
    const room = `test-broadcast-${Math.random().toString(36).slice(2)}`
    const a = createCollabSession({
      room,
      network: { kind: 'broadcast', channel: room },
    })
    const b = createCollabSession({
      room,
      network: { kind: 'broadcast', channel: room },
    })
    sessions.push(a, b)

    a.fragment.insert(0, 'crate')
    expect(b.fragment.toString()).toBe('crate')

    b.fragment.insert(5, ' notes')
    expect(a.fragment.toString()).toBe('crate notes')
  })

  it('keeps awareness off the document snapshot', () => {
    const a = createCollabSession({ room: 'test-awareness', network: { kind: 'none' } })
    sessions.push(a)
    a.awareness?.setLocal({ name: 'warby', color: '#6c2454' })

    expect(a.awareness?.local).toEqual({ name: 'warby', color: '#6c2454' })
    expect(a.fragment.toString()).toBe('')
  })

  it('injects a websocket provider without tint importing y-websocket', () => {
    let destroyed = false
    const session = createCollabSession({
      room: 'test-ws',
      network: {
        kind: 'websocket',
        url: 'ws://localhost:1234',
        createProvider: ({ url, room, doc }) => {
          expect(url).toBe('ws://localhost:1234')
          expect(room).toBe('test-ws')
          expect(typeof doc.clientID).toBe('number')
          return { destroy: () => { destroyed = true } }
        },
      },
    })
    sessions.push(session)
    session.destroy()
    expect(destroyed).toBe(true)
  })
})
