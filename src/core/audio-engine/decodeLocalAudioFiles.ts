import { AudioBufferRegistry } from './AudioBufferRegistry'

export type AudioDecoder = Pick<BaseAudioContext, 'decodeAudioData'>

export type DecodedLocalTrack = {
  trackId: string
  fileName: string
  durationSeconds: number
}

type DecodedEntry = DecodedLocalTrack & { buffer: AudioBuffer }

export async function decodeLocalAudioFiles(
  decoder: AudioDecoder,
  registry: AudioBufferRegistry,
  files: readonly File[],
  trackIdForFile: (file: File, index: number) => string,
): Promise<DecodedLocalTrack[]> {
  const identified = files.map((file, index) => ({
    file,
    trackId: trackIdForFile(file, index).trim(),
  }))
  const seen = new Set<string>()
  for (const { trackId } of identified) {
    if (trackId.length === 0) throw new RangeError('Track ID must not be empty')
    if (seen.has(trackId)) throw new Error(`Duplicate track ID: ${trackId}`)
    if (registry.hasTrack(trackId)) throw new Error(`Track already registered: ${trackId}`)
    seen.add(trackId)
  }

  const decoded = await Promise.all(identified.map(async ({ file, trackId }): Promise<DecodedEntry> => {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = await decoder.decodeAudioData(bytes)
      if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) {
        throw new RangeError('Decoded audio duration must be finite and positive')
      }
      return {
        trackId,
        fileName: file.name,
        durationSeconds: buffer.duration,
        buffer,
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown decoding error'
      throw new Error(`Could not decode ${file.name}: ${reason}`, { cause: error })
    }
  }))

  for (const entry of decoded) registry.registerTrack(entry.trackId, entry.buffer)
  return decoded.map(({ buffer: _buffer, ...track }) => track)
}
