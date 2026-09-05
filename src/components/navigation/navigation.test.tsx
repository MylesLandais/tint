import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppShell, NavigationList } from './index'

describe('navigation', () => {
  it('reports controlled sidebar intent and marks active links', () => {
    const onOpenChange = vi.fn()
    render(
      <AppShell brand="Tint" sidebarOpen={false} onSidebarOpenChange={onOpenChange} sidebar={<NavigationList activeHref="/home" items={[{ id: 'home', label: 'Home', href: '/home' }]} />}>
        Content
      </AppShell>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: 'Open Navigation' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
