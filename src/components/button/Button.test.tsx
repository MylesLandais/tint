import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to type="button" so it cannot accidentally submit a form', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('still allows an explicit submit', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
  })

  it('stamps variant and size for the stylesheet to key off', () => {
    render(
      <Button variant="danger" size="sm">
        Delete
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveAttribute('data-variant', 'danger')
    expect(button).toHaveAttribute('data-size', 'sm')
  })

  it('omits data-size when no size is given, leaving the base height', () => {
    render(<Button>Plain</Button>)
    expect(screen.getByRole('button', { name: 'Plain' })).not.toHaveAttribute('data-size')
  })

  it('keeps the shared class when the host adds its own', () => {
    render(<Button className="host-class">Both</Button>)
    expect(screen.getByRole('button', { name: 'Both' })).toHaveClass('tint-button', 'host-class')
  })

  it('renders leading content before the label', () => {
    render(<Button leading={<span data-testid="icon" />}>Go</Button>)
    const button = screen.getByRole('button', { name: 'Go' })
    expect(button.firstChild).toBe(screen.getByTestId('icon'))
  })
})
