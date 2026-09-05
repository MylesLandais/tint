import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ZulipThreadsDemo } from './ZulipThreadsDemo'

describe('ZulipThreadsDemo', () => {
  it('narrows the transcript by channel and topic', () => {
    render(<ZulipThreadsDemo />)

    expect(screen.getByRole('heading', { name: 'React port' })).toBeInTheDocument()
    expect(screen.getByText(/topic narrows as durable routes/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Backend.*3 unread/i }))
    expect(screen.getByRole('heading', { name: 'Gateway contract' })).toBeInTheDocument()
    expect(screen.getByText(/ordered event cursor/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /SeaweedFS uploads.*1 unread/i }))
    expect(screen.getByRole('heading', { name: 'SeaweedFS uploads' })).toBeInTheDocument()
    expect(screen.getByText(/content-addressed object key/i)).toBeInTheDocument()
    expect(screen.getByText('Backend › SeaweedFS uploads')).toBeInTheDocument()
  })

  it('sends a message into the selected topic through the shared composer', () => {
    render(<ZulipThreadsDemo />)
    const composer = screen.getByRole('form', { name: 'Compose message' })
    const input = within(composer).getByRole('textbox', { name: 'Message React port' })

    fireEvent.change(input, { target: { value: 'Ship the route-stable vertical slice.' } })
    fireEvent.click(within(composer).getByRole('button', { name: 'Send to React port' }))

    expect(screen.getByText('Ship the route-stable vertical slice.')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('marks a topic read when it is opened', () => {
    render(<ZulipThreadsDemo />)
    const backend = screen.getByRole('button', { name: /Backend.*3 unread/i })
    fireEvent.click(backend)

    const uploads = screen.getByRole('button', { name: /SeaweedFS uploads.*1 unread/i })
    fireEvent.click(uploads)

    expect(screen.getByRole('button', { name: 'SeaweedFS uploads' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Backend' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
