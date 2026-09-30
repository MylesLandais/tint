export type FrameEncoding = 'rgba' | 'png'
export type FrameMode = 'frame' | 'map'

export type FrameEnvelope = {
  width: number
  height: number
  accountId: string
  sessionId: string
  frameId: string
  payloadOffset: number
}

/** Validate the account-bound frame header before allocating or presenting pixels. */
export function parseFrameEnvelope(
  buffer: ArrayBuffer,
  accountId: string,
  currentSessionId: string,
  encoding: FrameEncoding,
): FrameEnvelope {
  if (buffer.byteLength < 4) throw new Error('Truncated frame')
  const size = new DataView(buffer).getUint32(0)
  if (size > 65_536 || size + 4 > buffer.byteLength) throw new Error('Invalid frame header')
  const raw: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, size)))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid frame header')
  const header = raw as Record<string, unknown>
  const width = header.width
  const height = header.height
  const sessionId = header.session_id
  if (header.account_id !== accountId || typeof sessionId !== 'string' || !sessionId || (currentSessionId && currentSessionId !== sessionId)) {
    throw new Error('Frame session mismatch')
  }
  if (
    !Number.isInteger(width) || !Number.isInteger(height) ||
    (width as number) < 1 || (height as number) < 1 ||
    (width as number) > 2048 || (height as number) > 2048 ||
    (encoding === 'rgba' && buffer.byteLength !== size + 4 + (width as number) * (height as number) * 4)
  ) throw new Error('Invalid frame dimensions')
  return {
    width: width as number,
    height: height as number,
    accountId,
    sessionId,
    frameId: String(header.frame_id),
    payloadOffset: size + 4,
  }
}
