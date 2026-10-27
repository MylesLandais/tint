import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestFrameAdapter } from './rgbaPresenter'

function adapter(fallback: boolean): GPUAdapter {
  return { info: { isFallbackAdapter: fallback } } as GPUAdapter
}
function gpu(requestAdapter: ReturnType<typeof vi.fn>): GPU {
  return { requestAdapter } as unknown as GPU
}

afterEach(() => vi.useRealTimers())

describe('framebuffer adapter selection', () => {
  it('keeps an available hardware Core adapter', async () => {
    const hardware = adapter(false)
    const request = vi.fn().mockResolvedValue(hardware)
    expect(await requestFrameAdapter(gpu(request))).toBe(hardware)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('prefers hardware Compatibility over software Core', async () => {
    const hardware = adapter(false)
    const request = vi.fn().mockResolvedValueOnce(adapter(true)).mockResolvedValueOnce(hardware)
    expect(await requestFrameAdapter(gpu(request))).toBe(hardware)
    expect(request).toHaveBeenLastCalledWith({ featureLevel: 'compatibility' })
  })

  it('can use Compatibility when Core is unavailable', async () => {
    const hardware = adapter(false)
    const request = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(hardware)
    expect(await requestFrameAdapter(gpu(request))).toBe(hardware)
  })

  it('retains the existing adapter when Compatibility is unsupported or software', async () => {
    const software = adapter(true)
    for (const request of [
      vi.fn().mockResolvedValueOnce(software).mockRejectedValueOnce(new Error('Unsupported feature level')),
      vi.fn().mockResolvedValueOnce(software).mockResolvedValueOnce(adapter(true)),
    ]) expect(await requestFrameAdapter(gpu(request))).toBe(software)
  })

  it('bounds both unavailable adapter requests so WebGL fallback can proceed', async () => {
    vi.useFakeTimers()
    const request = vi.fn().mockImplementation(() => new Promise(() => {}))
    const result = requestFrameAdapter(gpu(request))
    await vi.advanceTimersByTimeAsync(4000)
    expect(await result).toBeNull()
  })
})
