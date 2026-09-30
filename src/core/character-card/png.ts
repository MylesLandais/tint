import { parseTavernCard } from './parse'
import type { TavernCardV2 } from './types'

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const
const CHARA_KEYWORD = 'chara'

/**
 * 1×1 PNG used when the host has no avatar. The card still round-trips as a
 * PNG SillyTavern can import.
 */
export const EMPTY_AVATAR_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  (char) => char.charCodeAt(0),
)

type PngChunk = { type: string; data: Uint8Array }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function readChunks(bytes: Uint8Array): PngChunk[] {
  if (bytes.length < 8) throw new Error('Not a PNG: too short.')
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) throw new Error('Not a PNG: missing signature.')
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: PngChunk[] = []
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(
      bytes[offset + 4]!,
      bytes[offset + 5]!,
      bytes[offset + 6]!,
      bytes[offset + 7]!,
    )
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    chunks.push({ type, data })
    offset += 12 + length
    if (type === 'IEND') break
  }
  return chunks
}

function writeChunks(chunks: readonly PngChunk[]): Uint8Array {
  let size = 8
  for (const chunk of chunks) size += 12 + chunk.data.length
  const out = new Uint8Array(size)
  out.set(PNG_SIGNATURE, 0)
  const view = new DataView(out.buffer)
  let offset = 8
  for (const chunk of chunks) {
    view.setUint32(offset, chunk.data.length)
    for (let i = 0; i < 4; i += 1) out[offset + 4 + i] = chunk.type.charCodeAt(i)
    out.set(chunk.data, offset + 8)
    const crcInput = new Uint8Array(4 + chunk.data.length)
    for (let i = 0; i < 4; i += 1) crcInput[i] = chunk.type.charCodeAt(i)
    crcInput.set(chunk.data, 4)
    view.setUint32(offset + 8 + chunk.data.length, crc32(crcInput))
    offset += 12 + chunk.data.length
  }
  return out
}

function encodeTextChunk(keyword: string, text: string): Uint8Array {
  const key = new TextEncoder().encode(keyword)
  const value = new TextEncoder().encode(text)
  const data = new Uint8Array(key.length + 1 + value.length)
  data.set(key, 0)
  data[key.length] = 0
  data.set(value, key.length + 1)
  return data
}

function decodeTextChunk(data: Uint8Array): { keyword: string; text: string } | null {
  const split = data.indexOf(0)
  if (split <= 0) return null
  return {
    keyword: new TextDecoder().decode(data.subarray(0, split)),
    text: new TextDecoder().decode(data.subarray(split + 1)),
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

export function extractTavernCard(png: Uint8Array): TavernCardV2 {
  for (const chunk of readChunks(png)) {
    if (chunk.type !== 'tEXt' && chunk.type !== 'iTXt') continue
    const decoded = decodeTextChunk(chunk.data)
    if (!decoded || (decoded.keyword !== CHARA_KEYWORD && decoded.keyword !== 'ccv3')) continue
    const json = new TextDecoder().decode(base64ToBytes(decoded.text))
    return parseTavernCard(JSON.parse(json) as unknown)
  }
  throw new Error('This PNG has no character card chunk.')
}

export function embedTavernCard(card: TavernCardV2, png: Uint8Array = EMPTY_AVATAR_PNG): Uint8Array {
  const payload = bytesToBase64(new TextEncoder().encode(JSON.stringify(card)))
  const chara: PngChunk = { type: 'tEXt', data: encodeTextChunk(CHARA_KEYWORD, payload) }
  const chunks = readChunks(png).filter((chunk) => {
    if (chunk.type !== 'tEXt' && chunk.type !== 'iTXt') return true
    const decoded = decodeTextChunk(chunk.data)
    return decoded?.keyword !== CHARA_KEYWORD && decoded?.keyword !== 'ccv3'
  })
  const end = chunks.findIndex((chunk) => chunk.type === 'IEND')
  const insertAt = end === -1 ? chunks.length : end
  chunks.splice(insertAt, 0, chara)
  return writeChunks(chunks)
}

export async function bytesFromObjectUrl(objectUrl: string): Promise<Uint8Array> {
  const response = await fetch(objectUrl)
  return new Uint8Array(await response.arrayBuffer())
}
