import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VideoPlayer } from './VideoPlayer'

describe('VideoPlayer', () => {
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
})
