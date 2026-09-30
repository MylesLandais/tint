import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import GalleryGrid from './GalleryGrid.svelte'
import MediaLightboxFixture from './MediaLightboxFixture.svelte'
import UploadDropzone from './UploadDropzone.svelte'
import UploadQueue from './UploadQueue.svelte'

describe('Svelte media assets', () => {
  it('emits grid selection intent with the selected asset', async () => {
    const assets = [{ id: 'one', src: '/one.png', alt: 'First image' }]
    const onSelect = vi.fn()
    render(GalleryGrid, { assets, onSelect })
    await fireEvent.click(screen.getByRole('button', { name: 'View First image' }))
    expect(onSelect).toHaveBeenCalledWith(0, assets[0])
  })

  it('keeps lightbox navigation controlled and links to the original', async () => {
    render(MediaLightboxFixture)
    expect(screen.getByRole('dialog', { name: 'First image' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Second image' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'View original' })).toHaveAttribute('href', '/source/two')
    await fireEvent.keyDown(document, { key: 'ArrowLeft' })
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'First image' })).toBeInTheDocument())
  })

  it('classifies a dropped or chosen file through the shared core rule', async () => {
    const onFilesAccepted = vi.fn()
    const onFilesRejected = vi.fn()
    const { container } = render(UploadDropzone, { accept: ['image/*'], maxSizeBytes: 2, onFilesAccepted, onFilesRejected })
    const input = container.querySelector('input[type="file"]')!
    const image = new File(['a'], 'cover.png', { type: 'image/png' })
    const text = new File(['a'], 'notes.txt', { type: 'text/plain' })
    await fireEvent.change(input, { target: { files: [image, text] } })
    expect(onFilesAccepted).toHaveBeenCalledWith([image])
    expect(onFilesRejected).toHaveBeenCalledWith([expect.objectContaining({ file: text, reason: 'type' })])
  })

  it('opens the picker from the keyboard without redispatching a file input click', async () => {
    const { container } = render(UploadDropzone, { onFilesAccepted: vi.fn() })
    const dropzone = screen.getByRole('button', { name: /Upload files/ })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click')
    await fireEvent.keyDown(dropzone, { key: 'Enter' })
    expect(click).toHaveBeenCalledOnce()
    click.mockClear()
    await fireEvent.click(input)
    expect(click).not.toHaveBeenCalled()
  })

  it('shows upload progress and emits retry and cancel intent', async () => {
    const file = new File(['a'], 'cover.png', { type: 'image/png' })
    const onCancel = vi.fn()
    const onRetry = vi.fn()
    render(UploadQueue, {
      tasks: [
        { id: 'one', file, status: 'uploading', progress: 40 },
        { id: 'two', file, status: 'error', progress: 0 },
      ],
      onCancel, onRetry,
    })
    expect(screen.getByRole('progressbar', { name: 'cover.png: 40%' })).toHaveAttribute('aria-valuenow', '40')
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel cover.png' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Retry cover.png' }))
    expect(onCancel).toHaveBeenCalledWith('one')
    expect(onRetry).toHaveBeenCalledWith('two')
  })
})
