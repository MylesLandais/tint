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
    expect(video).toHaveAttribute('aria-label', 'Play Walkthrough')
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    fireEvent.play(video)
    fireEvent.pause(video)
    expect(onPlay).toHaveBeenCalledOnce()
    expect(onPause).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-tint-video-player]')).toHaveClass('rounded-lg')
  })

  it('enters theater mode when the Fullscreen API rejects', async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error('blocked'))
    HTMLElement.prototype.requestFullscreen = requestFullscreen

    const { container } = render(<VideoPlayer src="clip.mp4" autoHideControls={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    await waitFor(() => {
      expect(container.querySelector('[data-tint-video-player]')).toHaveAttribute(
        'data-fullscreen',
        'true',
      )
    })
    expect(container.querySelector('[data-tint-video-player]')).toHaveAttribute(
      'data-theater',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()
  })
})
