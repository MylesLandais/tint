import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MediaLightbox, UploadDropzone, UploadQueue } from './index'
import type { UploadTask } from '../../client'

describe('UploadDropzone', () => {
  it('separates accepted files from type and size rejections', () => {
    const accepted = vi.fn()
    const rejected = vi.fn()
    render(<UploadDropzone accept={['image/*']} maxSizeBytes={10} onFilesAccepted={accepted} onFilesRejected={rejected} />)
    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [new File(['ok'], 'ok.png', { type: 'image/png' }), new File(['too large for limit'], 'large.png', { type: 'image/png' }), new File(['x'], 'note.txt', { type: 'text/plain' })] } })
    expect(accepted).toHaveBeenCalledWith([expect.objectContaining({ name: 'ok.png' })])
    expect(rejected.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'size' }), expect.objectContaining({ reason: 'type' })]))
  })
})

describe('UploadQueue', () => {
  it('releases image preview object URLs on unmount', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const task: UploadTask = { id: '1', file: new File(['x'], 'photo.png', { type: 'image/png' }), status: 'uploading', progress: 25 }
    const view = render(<UploadQueue tasks={[task]} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(create).toHaveBeenCalledOnce()
    view.unmount()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
    create.mockRestore(); revoke.mockRestore()
  })
})

describe('MediaLightbox', () => {
  it('supports swipe navigation', () => {
    const onIndexChange = vi.fn()
    render(<MediaLightbox open assets={[{ id: '1', src: '/one.png', alt: 'One' }, { id: '2', src: '/two.png', alt: 'Two' }]} index={0} onClose={() => {}} onIndexChange={onIndexChange} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.touchStart(dialog, { touches: [{ clientX: 120 }] })
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 20 }] })
    expect(onIndexChange).toHaveBeenCalledWith(1)
  })
})
