import { fireEvent, render, screen } from '@testing-library/svelte'
import { get } from 'svelte/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemePicker from './ThemePicker.svelte'
import ThemeToggle from './ThemeToggle.svelte'
import { colorSchemeStore, themeNameStore } from './state'

const themes = [{ value: 'tint', label: 'Tint' }, { value: 'mocha', label: 'Mocha' }]

beforeEach(() => {
  themeNameStore.set('tint')
  colorSchemeStore.set('system')
  vi.restoreAllMocks()
})

describe('Svelte theme controls', () => {
  it('keeps the native palette picker controlled and labeled', async () => {
    const onChange = vi.fn()
    const props = { value: 'tint', onChange, themes }
    const view = render(ThemePicker, { props })
    const picker = screen.getByRole('combobox', { name: 'Theme' })
    expect(picker).toHaveValue('tint')
    await fireEvent.change(picker, { target: { value: 'mocha' } })
    expect(onChange).toHaveBeenCalledWith('mocha')
    await view.rerender({ ...props, value: 'mocha' })
    expect(picker).toHaveValue('mocha')
  })

  it('uses one radio tab stop and reports arrow, Home, and End intents', async () => {
    const onChange = vi.fn()
    const props = { value: 'system' as const, onChange }
    const view = render(ThemeToggle, { props })
    const selected = screen.getByRole('radio', { name: 'System' })
    expect(screen.getByRole('radiogroup', { name: 'Color scheme' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toHaveLength(1)
    expect(selected).toHaveAttribute('aria-checked', 'true')
    await fireEvent.keyDown(selected, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('dark')
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus()
    expect(selected).toHaveAttribute('aria-checked', 'true')
    await view.rerender({ ...props, value: 'dark' })
    await fireEvent.keyDown(screen.getByRole('radio', { name: 'Dark' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('light')
    await fireEvent.keyDown(screen.getByRole('radio', { name: 'Dark' }), { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith('light')
    await fireEvent.keyDown(screen.getByRole('radio', { name: 'Dark' }), { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith('dark')
  })

  it('uses the same persisted state for multiple bindings and clears default overrides', () => {
    const values: string[] = []
    const stop = themeNameStore.subscribe((value) => values.push(value))
    themeNameStore.set('mocha')
    colorSchemeStore.set('dark')
    expect(values).toEqual(['tint', 'mocha'])
    expect(get(themeNameStore)).toBe('mocha')
    expect(get(colorSchemeStore)).toMatchObject({ preference: 'dark', resolved: 'dark' })
    expect(document.documentElement.dataset.theme).toBe('mocha')
    expect(document.documentElement.dataset.scheme).toBe('dark')
    expect(localStorage.getItem('tint-theme')).toBe('mocha')
    expect(localStorage.getItem('tint-color-scheme')).toBe('dark')
    stop()
    themeNameStore.set('tint')
    colorSchemeStore.set('system')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(document.documentElement.dataset.scheme).toBeUndefined()
  })
})
