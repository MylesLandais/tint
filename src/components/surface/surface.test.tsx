import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, Surface } from './index'

describe('Surface', () => {
  it('renders the requested semantic element', () => {
    const { container } = render(<Surface as="section">body</Surface>)
    expect(container.querySelector('section[data-tint-surface]')).toBeTruthy()
  })

  it('defaults to a div with the default tone and no elevation', () => {
    const { container } = render(<Surface>body</Surface>)
    const el = container.querySelector('[data-tint-surface]')
    expect(el?.tagName).toBe('DIV')
    expect(el).toHaveAttribute('data-tone', 'default')
    expect(el).toHaveAttribute('data-elevation', 'none')
  })

  it('exposes tone and elevation as data attributes', () => {
    const { container } = render(<Surface tone="danger" elevation="lg">body</Surface>)
    const el = container.querySelector('[data-tint-surface]')
    expect(el).toHaveAttribute('data-tone', 'danger')
    expect(el).toHaveAttribute('data-elevation', 'lg')
  })

  it('marks interaction and selection only when enabled', () => {
    const { container: off } = render(<Surface>body</Surface>)
    expect(off.querySelector('[data-interactive]')).toBeNull()
    expect(off.querySelector('[data-selected]')).toBeNull()

    const { container: on } = render(<Surface interactive selected>body</Surface>)
    expect(on.querySelector('[data-interactive]')).toBeTruthy()
    expect(on.querySelector('[data-selected]')).toBeTruthy()
  })

  it('forwards arbitrary host props and merges className', () => {
    const { container } = render(<Surface className="mine" id="s1" aria-label="panel">body</Surface>)
    const el = container.querySelector('#s1')
    expect(el).toHaveAccessibleName('panel')
    expect(el).toHaveClass('mine')
    expect(el).toHaveClass('rounded-xl')
  })
})

describe('Card', () => {
  it('is an article and renders header, actions, body, and footer', () => {
    const { container } = render(
      <Card header={<h2>Title</h2>} actions={<button type="button">Act</button>} footer="Footer">
        Body
      </Card>,
    )
    const el = container.querySelector('[data-tint-surface]')
    expect(el?.tagName).toBe('ARTICLE')
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('omits the header and footer regions when no slots are supplied', () => {
    const { container } = render(<Card>Body</Card>)
    expect(container.querySelector('header')).toBeNull()
    expect(container.querySelector('footer')).toBeNull()
  })

  it('renders a header region when only actions are supplied', () => {
    const { container } = render(<Card actions={<button type="button">Act</button>}>Body</Card>)
    expect(container.querySelector('header')).toBeTruthy()
  })

  it('lets the caller override the semantic element and inherits Surface tone', () => {
    const { container } = render(<Card as="section" tone="accent">Body</Card>)
    const el = container.querySelector('[data-tint-surface]')
    expect(el?.tagName).toBe('SECTION')
    expect(el).toHaveAttribute('data-tone', 'accent')
  })
})
