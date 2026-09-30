import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_NOTIFICATION_SETTINGS, type Notification } from '../../../core/notify'
import NotificationBellFixture from './NotificationBellFixture.svelte'
import NotificationList from './NotificationList.svelte'
import NotificationSettingsPanel from './NotificationSettingsPanel.svelte'

const notifications: Notification[] = [
  { id: 'a', kind: 'mention', title: 'Mention A', subtitle: 'In a thread', createdAt: '2026-08-01T09:00:00Z', read: false, href: '#a', actor: { id: 'actor', name: 'Ada Lovelace' } },
  { id: 'b', kind: 'review', title: 'Review B', createdAt: '2026-08-02T10:00:00Z', read: true, actions: [{ id: 'ack', label: 'Acknowledge', onSelect: vi.fn() }] },
  { id: 'c', kind: 'mention', title: 'Mention C', createdAt: '2026-08-03T11:00:00Z', read: false },
]

describe('Svelte notification surfaces', () => {
  it('keeps bell open state controlled, caps the count and keeps the panel body mounted', async () => {
    const onOpenChange = vi.fn()
    const view = render(NotificationBellFixture, { unreadCount: 120, open: false, onOpenChange, presentation: 'panel' })
    const trigger = view.container.querySelector<HTMLButtonElement>('.trigger')!
    expect(trigger).toHaveAccessibleName('Notifications, 120 unread')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls')
    expect(view.container.querySelector('.count')).toHaveTextContent('99+')
    expect(view.container.querySelector('[data-panel-body]')).toHaveAttribute('hidden')
    await fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await view.rerender({ unreadCount: 3, open: true, onOpenChange, presentation: 'panel' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(view.container.querySelector('[data-panel-body]')).not.toHaveAttribute('hidden')
    expect(view.container.querySelector('.count')).toHaveTextContent('3')
  })

  it('opens a dialog only after the host supplies the new open state', async () => {
    const onOpenChange = vi.fn()
    const view = render(NotificationBellFixture, { unreadCount: 0, open: false, onOpenChange, presentation: 'dialog' })
    const trigger = view.container.querySelector<HTMLButtonElement>('.trigger')!
    expect(view.container.querySelector('.count')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await view.rerender({ unreadCount: 0, open: true, onOpenChange, presentation: 'dialog' })
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument()
    view.unmount()
  })

  it('groups notifications in first-seen order and keeps actions separate from row selection', async () => {
    const onSelect = vi.fn()
    const view = render(NotificationList, { notifications, groupBy: 'kind', onSelect })
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual(['mention', 'review'])
    expect([...view.container.querySelectorAll('[data-tint-notification-row]')].map((row) => row.querySelector('.title')?.textContent)).toEqual(['Mention A', 'Mention C', 'Review B'])
    expect(view.container.querySelector('[data-tint-notification-row]')).not.toHaveAttribute('data-read')
    expect(view.container.querySelector('[data-tint-notification-row]')).toHaveTextContent('Unread')
    await fireEvent.click(screen.getByRole('button', { name: 'Mention A' }))
    expect(onSelect).toHaveBeenCalledWith(notifications[0])
    await fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }))
    expect(notifications[1]?.actions?.[0]?.onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '#a')
  })

  it('renders empty content and host custom groups', () => {
    const empty = render(NotificationList, { notifications: [], empty: 'All caught up.' })
    expect(screen.getByText('All caught up.')).toBeInTheDocument()
    empty.unmount()
    render(NotificationList, { notifications, groupKey: (row: Notification) => row.read ? 'read' : 'unread' })
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual(['unread', 'read'])
  })

  it('emits immutable settings updates and keeps native controls at host values until rerender', async () => {
    const onChange = vi.fn()
    const view = render(NotificationSettingsPanel, {
      settings: DEFAULT_NOTIFICATION_SETTINGS, onChange,
      sources: [{ id: 'source', label: 'Feed source' }], policies: [{ id: 'policy', label: 'Priority policy' }],
    })
    const defaultSelect = screen.getByRole('combobox', { name: 'Default' }) as HTMLSelectElement
    await fireEvent.change(defaultSelect, { target: { value: 'digest' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_NOTIFICATION_SETTINGS, defaultChannel: 'digest' })
    expect(defaultSelect.value).toBe('instant')
    const sourceSelect = screen.getByRole('combobox', { name: 'Source Feed source' }) as HTMLSelectElement
    await fireEvent.change(sourceSelect, { target: { value: 'off' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_NOTIFICATION_SETTINGS, bySource: { source: 'off' } })
    expect(sourceSelect.value).toBe('instant')
    const policySelect = screen.getByRole('combobox', { name: 'Policy Priority policy' }) as HTMLSelectElement
    await fireEvent.change(policySelect, { target: { value: 'digest' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_NOTIFICATION_SETTINGS, byPolicy: { policy: 'digest' } })
    const quiet = screen.getByRole('checkbox', { name: /Suppress instant delivery overnight/ }) as HTMLInputElement
    await fireEvent.click(quiet)
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_NOTIFICATION_SETTINGS, quietHours: { start: '22:00', end: '07:00' } })
    expect(quiet.checked).toBe(false)
    await view.rerender({ settings: { ...DEFAULT_NOTIFICATION_SETTINGS, quietHours: { start: '22:00', end: '07:00' } }, onChange, sources: [{ id: 'source', label: 'Feed source' }], policies: [{ id: 'policy', label: 'Priority policy' }] })
    expect(screen.getByLabelText('Start')).toHaveValue('22:00')
    const start = screen.getByLabelText('Start') as HTMLInputElement
    await fireEvent.change(start, { target: { value: '21:30' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_NOTIFICATION_SETTINGS, quietHours: { start: '21:30', end: '07:00' } })
    expect(start.value).toBe('22:00')
  })

  it('disables every setting control when the host disables the form', () => {
    render(NotificationSettingsPanel, { settings: DEFAULT_NOTIFICATION_SETTINGS, onChange: vi.fn(), disabled: true, sources: [{ id: 'source', label: 'Feed source' }], policies: [{ id: 'policy', label: 'Priority policy' }] })
    for (const control of [...screen.getAllByRole('combobox'), screen.getByRole('checkbox')]) expect(control).toBeDisabled()
  })
})
