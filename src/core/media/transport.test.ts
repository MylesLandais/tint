import { describe, expect, it, vi } from 'vitest'
import { MediaTransport } from './transport'

describe('MediaTransport', () => {
  it('tracks media events, seeks and reports controlled playback callbacks', () => {
    const audio = document.createElement('audio')
    const play = vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    const onPlay = vi.fn()
    const transport = new MediaTransport()
    transport.setCallbacks({ onPlay })
    const detach = transport.attach(audio)
    transport.reset(120)
    transport.play()
    expect(play).toHaveBeenCalledOnce()
    audio.dispatchEvent(new Event('play'))
    expect(transport.snapshot.playing).toBe(true)
    expect(onPlay).toHaveBeenCalledOnce()
    transport.seek(50)
    expect(audio.currentTime).toBe(60)
    transport.changeVolume(35)
    expect(audio.volume).toBe(.35)
    detach()
  })

  it('does not mark an aborted play as a bad source', async () => {
    const audio = document.createElement('audio')
    vi.spyOn(audio, 'play').mockRejectedValue(new DOMException('Interrupted', 'AbortError'))
    const transport = new MediaTransport()
    transport.attach(audio)
    transport.play()
    await Promise.resolve()
    expect(transport.snapshot.failed).toBe(false)
  })
})
