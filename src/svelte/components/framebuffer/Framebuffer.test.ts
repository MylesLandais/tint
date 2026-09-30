import { render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Framebuffer from './Framebuffer.svelte'
import { FramebufferStream } from '../../../core/framebuffer/stream'

const stream = vi.hoisted(() => ({ start: vi.fn(), dispose: vi.fn(), status: undefined as ((status: string) => void) | undefined }))
vi.mock('../../../core/framebuffer/stream', () => ({
  FramebufferStream: vi.fn().mockImplementation(function (_canvas, _options, onStatus) {
    stream.status = onStatus
    return stream
  }),
}))

describe('Svelte Framebuffer', () => {
  afterEach(() => {
    vi.clearAllMocks()
    stream.status = undefined
  })

  it('mounts and disposes the plain TypeScript stream with status updates', async () => {
    const onStatus = vi.fn()
    const view = render(Framebuffer, { url: 'ws://example.test/frames', accountId: 'one', onStatus })
    expect(stream.start).toHaveBeenCalledOnce()
    expect(screen.getByRole('img', { name: 'one native framebuffer' })).toBeInTheDocument()
    stream.status?.('Live')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('one · Live'))
    expect(onStatus).toHaveBeenCalledWith('Live')
    view.unmount()
    expect(stream.dispose).toHaveBeenCalledOnce()
  })

  it('remounts the canvas and switches to WebGL after context loss', async () => {
    const view = render(Framebuffer, { url: 'ws://example.test/frames', accountId: 'one' })
    const originalCanvas = screen.getByRole('img')
    const initialOptions = vi.mocked(FramebufferStream).mock.calls[0][1]
    expect(initialOptions.forceWebGL).toBe(false)
    initialOptions.onContextLost()
    await waitFor(() => expect(FramebufferStream).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('img')).not.toBe(originalCanvas)
    expect(vi.mocked(FramebufferStream).mock.calls[1][1].forceWebGL).toBe(true)
    view.unmount()
  })

  it('lets the host describe interactive frame controls', () => {
    render(Framebuffer, { url: 'ws://example.test/frames', accountId: 'one', canvasProps: {
      role: 'application', tabindex: 0, 'aria-label': 'Game controls. Use arrow keys to move.',
    } })
    expect(screen.getByRole('application', { name: 'Game controls. Use arrow keys to move.' })).toHaveAttribute('tabindex', '0')
  })
})
