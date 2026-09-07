export type SyntheticHouseWavOptions = {
  durationSeconds: number
  sampleRate?: number
  bpm?: number
  seed?: number
}

export function createSyntheticHouseWav({
  durationSeconds,
  sampleRate = 8_000,
  bpm = 128,
  seed = 1,
}: SyntheticHouseWavOptions): Uint8Array {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Fixture duration must be finite and positive')
  }
  if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 48_000) {
    throw new Error('Fixture sample rate must be an integer between 8000 and 48000')
  }
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new Error('Fixture BPM must be finite and positive')
  }

  const sampleCount = Math.round(durationSeconds * sampleRate)
  const dataBytes = sampleCount * 2
  const wav = new Uint8Array(44 + dataBytes)
  const view = new DataView(wav.buffer)
  writeAscii(wav, 0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  writeAscii(wav, 8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(wav, 36, 'data')
  view.setUint32(40, dataBytes, true)

  const samplesPerBeat = sampleRate * 60 / bpm
  let noiseState = (seed >>> 0) || 1
  for (let index = 0; index < sampleCount; index += 1) {
    const beatPhaseSamples = index % samplesPerBeat
    const beatAge = beatPhaseSamples / sampleRate
    const kick = Math.sin(2 * Math.PI * (62 - 34 * Math.min(beatAge / 0.16, 1)) * beatAge)
      * Math.exp(-beatAge * 24)
    noiseState = (Math.imul(noiseState, 1_664_525) + 1_013_904_223) >>> 0
    const noise = (noiseState / 0xffff_ffff) * 2 - 1
    const eighthPhase = (index % (samplesPerBeat / 2)) / sampleRate
    const hat = noise * Math.exp(-eighthPhase * 70) * 0.09
    const value = Math.max(-1, Math.min(1, kick * 0.72 + hat))
    view.setInt16(44 + index * 2, Math.round(value * 30_000), true)
  }
  return wav
}

function writeAscii(target: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    target[offset + index] = value.charCodeAt(index)
  }
}
