import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Avatar from './Avatar.svelte'
import AvatarGroup from './AvatarGroup.svelte'
import AvatarGroupFixture from './AvatarGroupFixture.svelte'

describe('Svelte identity', () => {
  it('falls back to initials after an image failure and keeps the presence cue', async () => {
    const view = render(Avatar, { identity: { id: '1', name: 'Avery Chen', avatarUrl: '/missing.png', presence: 'online' } })
    await fireEvent.error(screen.getByRole('img', { name: 'Avery Chen, online' }).querySelector('img')!)
    expect(screen.getByRole('img', { name: 'Avery Chen, online' })).toHaveTextContent('MC')
    expect(view.container.querySelector('[data-avatar-presence][data-presence="online"]')).toBeInTheDocument()
  })

  it('uses decorative semantics and updates its image source when props change', async () => {
    const view = render(Avatar, { identity: { id: '1', name: 'Ada', avatarUrl: '/one.png' }, decorative: true })
    expect(view.container.querySelector('[data-tint-avatar]')).toHaveAttribute('aria-hidden', 'true')
    await fireEvent.error(view.container.querySelector('img')!)
    expect(view.container.querySelector('[data-tint-avatar]')).toHaveTextContent('AD')
    await view.rerender({ identity: { id: '1', name: 'Ada', avatarUrl: '/two.png' }, decorative: true })
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/two.png')
  })

  it('caps groups, reports overflow, and passes an avatar snippet to a host link', () => {
    const identities = [
      { id: '1', name: 'One', href: '#one' },
      { id: '2', name: 'Two', href: '#two' },
      { id: '3', name: 'Three', href: '#three' },
    ]
    const view = render(AvatarGroup, { identities, max: 2 })
    expect(view.container.querySelectorAll('[data-tint-avatar]')).toHaveLength(2)
    expect(screen.getByText('+1')).toBeInTheDocument()
    view.unmount()
    render(AvatarGroupFixture, { identities })
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['#one', '#two'])
  })
})
