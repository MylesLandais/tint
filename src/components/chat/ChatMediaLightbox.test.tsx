import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMediaLightbox } from './ChatMediaLightbox'
import type { ChatImageItem } from './types'

const images: readonly ChatImageItem[] = [
  { id: 'img-1', src: '/images/gallery-1.svg', alt: 'First flower' },
  { id: 'img-2', src: '/images/gallery-2.svg', alt: 'Second flower', href: 'https://example.com/2' },
  { id: 'img-3', src: '/images/gallery-3.svg', alt: 'Third flower' },
]

describe('ChatMediaLightbox', () => {
  it('does not render when closed', () => {
    render(
      <ChatMediaLightbox
        open={false}
        images={images}
        index={0}
        onClose={vi.fn()}
        onIndexChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the current image and caption when open', () => {
    render(
      <ChatMediaLightbox
        open
        images={images}
        index={0}
        caption="California poppies"
        onClose={vi.fn()}
        onIndexChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'California poppies' })).toBeInTheDocument()
    expect(screen.getByAltText('First flower')).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('closes on Escape, Close, and backdrop click', () => {
    const onClose = vi.fn()
    render(
      <ChatMediaLightbox
        open
        images={images}
        index={1}
        onClose={onClose}
        onIndexChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)

    const backdrop = document.querySelector('[data-chat-lightbox]')
    expect(backdrop).toBeTruthy()
    fireEvent.mouseDown(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('navigates with chevrons and arrow keys', () => {
    const onIndexChange = vi.fn()
    render(
      <ChatMediaLightbox
        open
        images={images}
        index={1}
        onClose={vi.fn()}
        onIndexChange={onIndexChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onIndexChange).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onIndexChange).toHaveBeenCalledWith(2)

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(onIndexChange).toHaveBeenCalledWith(0)

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onIndexChange).toHaveBeenCalledWith(2)
  })

  it('shows View original when the current image has a safe href', () => {
    render(
      <ChatMediaLightbox
        open
        images={images}
        index={1}
        onClose={vi.fn()}
        onIndexChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: /view original/i })).toHaveAttribute(
      'href',
      'https://example.com/2',
    )
  })
})
