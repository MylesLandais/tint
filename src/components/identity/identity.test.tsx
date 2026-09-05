import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar, AvatarGroup } from './index'

describe('Avatar', () => {
  it('falls back to deterministic initials when an image fails', () => {
    render(<Avatar identity={{ id: '1', name: 'Maya Chen', avatarUrl: '/missing.png', presence: 'online' }} />)
    fireEvent.error(screen.getByRole('img', { name: 'Maya Chen' }))
    expect(screen.getByLabelText('Maya Chen')).toHaveTextContent('MC')
    expect(document.querySelector('[data-avatar-presence][data-presence="online"]')).toBeTruthy()
  })

  it('caps groups and reports overflow', () => {
    render(<AvatarGroup max={2} identities={[{ id: '1', name: 'One' }, { id: '2', name: 'Two' }, { id: '3', name: 'Three' }]} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })
})
