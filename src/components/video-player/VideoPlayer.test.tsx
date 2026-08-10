import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VideoPlayer } from './VideoPlayer'

describe('VideoPlayer', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
  })

  it('restores the dark immersive surface and hides controls by default', () => {
    const { container } = render(<VideoPlayer src="clip.mp4" />)
    expect(container.querySelector('[data-tint-video-player]')).toBeInTheDocument()
    expect(container.querySelector('video')).toHaveClass('bg-black')
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('reveals the original overlay controls on hover', () => {
    const { container } = render(<VideoPlayer src="clip.mp4" />)
    const root = container.querySelector('[data-tint-video-player]')
    if (!root) throw new Error('Expected video player root')
    fireEvent.mouseEnter(root)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('supports always-visible controls, playback callbacks, and native attributes', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()
    const { container } = render(
      <VideoPlayer
        src="clip.mp4"
        label="Walkthrough"
        autoHideControls={false}
        data-testid="walkthrough-video"
        onPlay={onPlay}
        onPause={onPause}
      />,
    )
    const video = screen.getByTestId('walkthrough-video')
    // The media element names the media; the transport button names the action.
    expect(video).toHaveAttribute('aria-label', 'Walkthrough')
    expect(screen.getByRole('button', { name: 'Play Walkthrough' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    fireEvent.play(video)
    expect(screen.getByRole('button', { name: 'Pause Walkthrough' })).toBeInTheDocument()
    fireEvent.pause(video)
    expect(onPlay).toHaveBeenCalledOnce()
    expect(onPause).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-tint-video-player]')).toHaveClass('rounded-lg')
  })

  /**
   * The maximize control called `requestFullscreen()` and left the container's
   * `max-w-*` and radius in place, so fullscreen rendered a postcard on a black
   * screen — or nothing at all where the API is blocked and the rejection went
   * unhandled. Both paths now land on a surface that fills what it is given.
   */
  it('enters theater mode when the Fullscreen API rejects', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn().mockRejectedValue(new Error('blocked'))

    const { container } = render(<VideoPlayer src="clip.mp4" autoHideControls={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    const player = container.querySelector('[data-tint-video-player]')
    await waitFor(() => expect(player).toHaveAttribute('data-theater', 'true'))
    expect(player).toHaveAttribute('data-fullscreen', 'true')
    expect(player).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()
  })

  it('leaves theater mode on Escape and restores body scroll', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn().mockRejectedValue(new Error('blocked'))

    const { container } = render(<VideoPlayer src="clip.mp4" autoHideControls={false} />)
    const player = container.querySelector('[data-tint-video-player]')

    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    await waitFor(() => expect(player).toHaveAttribute('data-theater', 'true'))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(player).not.toHaveAttribute('data-theater'))
    expect(document.body.style.overflow).toBe('')
  })

  /**
   * iOS Safari implements fullscreen on `<video>` only, never on a container.
   * Asking up front is what lets the fallback be chosen deliberately instead of
   * discovered by catching a rejection on every tap.
   */
  it('goes straight to theater mode where element fullscreen does not exist', async () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')

    const { container } = render(<VideoPlayer src="clip.mp4" autoHideControls={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    await waitFor(() =>
      expect(container.querySelector('[data-tint-video-player]')).toHaveAttribute(
        'data-theater',
        'true',
      ),
    )
  })
})
