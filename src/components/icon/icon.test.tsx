import { render, screen } from '@testing-library/react'
import { Search } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'
import { Spinner, StatusIcon } from './StatusIcon'
import { ICON_SIZES } from './sizes'
import { STATUS_ICONS } from './status'
import type { StatusName } from './types'

describe('Icon', () => {
  it('is decorative by default', () => {
    render(<Icon icon={Search} data-testid="icon" />)
    const icon = screen.getByTestId('icon')

    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).not.toHaveAttribute('role')
  })

  it('exposes an accessible name when given a label instead of hiding', () => {
    render(<Icon icon={Search} label="Search" data-testid="icon" />)
    const icon = screen.getByRole('img', { name: 'Search' })

    expect(icon).not.toHaveAttribute('aria-hidden')
  })

  it.each(Object.keys(ICON_SIZES) as (keyof typeof ICON_SIZES)[])(
    'maps size %s to its token class',
    (size) => {
      render(<Icon icon={Search} size={size} data-testid="icon" />)
      expect(screen.getByTestId('icon')).toHaveClass(ICON_SIZES[size])
    },
  )

  it('defaults to the md size', () => {
    render(<Icon icon={Search} data-testid="icon" />)
    expect(screen.getByTestId('icon')).toHaveClass(ICON_SIZES.md)
  })

  it('merges caller classes alongside the size token', () => {
    render(<Icon icon={Search} className="text-tint-accent" data-testid="icon" />)
    expect(screen.getByTestId('icon')).toHaveClass('text-tint-accent')
  })
})

describe('StatusIcon', () => {
  it.each(Object.keys(STATUS_ICONS) as StatusName[])(
    'renders the registered tone for status %s',
    (status) => {
      render(<StatusIcon status={status} data-testid="icon" />)
      const entry = STATUS_ICONS[status]

      expect(screen.getByTestId('icon')).toHaveClass(entry.tone)
    },
  )

  it('spins only the loading state', () => {
    render(<StatusIcon status="loading" data-testid="loading" />)
    render(<StatusIcon status="success" data-testid="success" />)

    expect(screen.getByTestId('loading')).toHaveClass('animate-spin')
    expect(screen.getByTestId('success')).not.toHaveClass('animate-spin')
  })
})

describe('Spinner', () => {
  it('renders the loading glyph without forcing the registry tone', () => {
    render(<Spinner data-testid="spinner" />)
    const spinner = screen.getByTestId('spinner')

    expect(spinner).toHaveClass('animate-spin')
    expect(spinner).not.toHaveClass(STATUS_ICONS.loading.tone)
  })

  it('still lets a caller apply its own color', () => {
    render(<Spinner className="text-tint-accent" data-testid="spinner" />)
    expect(screen.getByTestId('spinner')).toHaveClass('text-tint-accent')
  })
})
