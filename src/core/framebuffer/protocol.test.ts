import { describe, expect, it } from 'vitest'
import { parseFrameEnvelope } from './protocol'

function frame(header: Record<string, unknown>, payloadLength: number): ArrayBuffer {
  const encoded = new TextEncoder().encode(JSON.stringify(header))
  const bytes = new Uint8Array(encoded.length + 4 + payloadLength)
  new DataView(bytes.buffer).setUint32(0, encoded.length)
  bytes.set(encoded, 4)
  return bytes.buffer
}

const header = { account_id: 'one', session_id: 'session', frame_id: 7, width: 2, height: 3 }

describe('framebuffer envelope', () => {
  it('accepts an account-bound RGBA frame and exposes its payload offset', () => {
    const parsed = parseFrameEnvelope(frame(header, 24), 'one', '', 'rgba')
    expect(parsed).toMatchObject({ accountId: 'one', sessionId: 'session', frameId: '7', width: 2, height: 3 })
    expect(parsed.payloadOffset).toBeGreaterThan(4)
  })

  it('rejects account/session swaps and invalid allocation sizes', () => {
    expect(() => parseFrameEnvelope(frame(header, 24), 'two', '', 'rgba')).toThrow('Frame session mismatch')
    expect(() => parseFrameEnvelope(frame(header, 24), 'one', 'other', 'rgba')).toThrow('Frame session mismatch')
    expect(() => parseFrameEnvelope(frame(header, 23), 'one', '', 'rgba')).toThrow('Invalid frame dimensions')
    expect(() => parseFrameEnvelope(frame({ ...header, width: 4096 }, 24), 'one', '', 'rgba')).toThrow('Invalid frame dimensions')
  })

  it('rejects truncated and oversized header lengths', () => {
    expect(() => parseFrameEnvelope(new ArrayBuffer(3), 'one', '', 'png')).toThrow('Truncated frame')
    const bytes = new Uint8Array(4)
    new DataView(bytes.buffer).setUint32(0, 65_537)
    expect(() => parseFrameEnvelope(bytes.buffer, 'one', '', 'png')).toThrow('Invalid frame header')
  })
})
