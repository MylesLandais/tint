import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Card from './Card.svelte'

describe('Card', () => {
  it('preserves the semantic element and body class', () => {
    const { container } = render(Card, { as: 'section', bodyClassName: 'custom-body' })
    expect(container.querySelector('section[data-tint-card]')).toBeInTheDocument()
    expect(container.querySelector('.body')).toHaveClass('custom-body')
  })
})
