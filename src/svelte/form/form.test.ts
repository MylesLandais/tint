import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { tick } from 'svelte'
import TintFluidForm from './TintFluidForm.svelte'
import TextField from './TextField.svelte'
import Token from './Token.svelte'
import Typeahead from './Typeahead.svelte'
import Tokenizer from './Tokenizer.svelte'
import FormFixture from './FormFixture.svelte'

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma', disabled: true },
]

describe('TintFluidForm', () => {
  it('exposes its title and error, and forwards submit intent', async () => {
    const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const { container } = render(TintFluidForm, { title: 'Profile', error: 'Fix the marked fields', onsubmit })
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Fix the marked fields')
    await fireEvent.submit(container.querySelector('form')!)
    expect(onsubmit).toHaveBeenCalledOnce()
  })

  it('passes Carbon fluid form context to its Tint fields', () => {
    const { container } = render(FormFixture)
    expect(container.querySelector('.bx--form--fluid .bx--text-input--fluid')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })
})

describe('TextField', () => {
  it('forwards input intent and relates help and error to the input', async () => {
    const onValueChange = vi.fn()
    render(TextField, {
      id: 'email', label: 'Email', value: '', onValueChange,
      description: 'Used for receipts', error: 'Email is required', required: true,
      describedBy: 'recovery-help',
    })
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'email-description error-email recovery-help')
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
    await fireEvent.input(input, { target: { value: 'a@example.com' } })
    expect(onValueChange).toHaveBeenCalledWith('a@example.com')
  })

  it('honors disabled state', () => {
    render(TextField, { id: 'name', label: 'Name', value: 'A', onValueChange: vi.fn(), disabled: true })
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled()
  })
})

describe('Token', () => {
  it('renders a named remove action and honors disabled state', async () => {
    const onRemove = vi.fn()
    const view = render(Token, { label: 'Alpha', onRemove })
    await fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }))
    expect(onRemove).toHaveBeenCalledOnce()
    await view.rerender({ label: 'Alpha', onRemove, disabled: true })
    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeDisabled()
  })
})

describe('Typeahead', () => {
  it('filters controlled query and selects with the keyboard', async () => {
    const onValueChange = vi.fn()
    const onQueryChange = vi.fn()
    const onOpenChange = vi.fn()
    const props = {
      id: 'city', label: 'City', value: '', onValueChange,
      query: '', onQueryChange, open: false, onOpenChange, options,
    }
    const view = render(Typeahead, props)
    const input = screen.getByRole('combobox', { name: 'City' })
    await fireEvent.focus(input)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await view.rerender({ ...props, open: true, query: 'be' })
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument()
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('beta')
    expect(onQueryChange).toHaveBeenCalledWith('Beta')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('skips disabled options during keyboard navigation', async () => {
    const onValueChange = vi.fn()
    render(Typeahead, {
      id: 'choice', label: 'Choice', value: '', onValueChange,
      query: '', onQueryChange: vi.fn(), open: true, onOpenChange: vi.fn(),
      options: [{ value: 'disabled', label: 'Disabled', disabled: true }, options[1]],
    })
    await fireEvent.keyDown(screen.getByRole('combobox', { name: 'Choice' }), { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('beta')
  })

  it('tracks the active option, closes on Escape, and clears stale selection when edited', async () => {
    const onValueChange = vi.fn()
    const onQueryChange = vi.fn()
    const onOpenChange = vi.fn()
    const props = {
      id: 'choice', label: 'Choice', value: 'alpha', onValueChange,
      query: 'Alpha', onQueryChange, open: true, onOpenChange, options,
    }
    const view = render(Typeahead, props)
    const input = screen.getByRole('combobox', { name: 'Choice' })
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', 'choice-options')
    expect(input).toHaveAttribute('aria-activedescendant', 'choice-option-0')
    await view.rerender({ ...props, query: '' })
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    await tick()
    expect(input).toHaveAttribute('aria-activedescendant', 'choice-option-1')
    await fireEvent.keyDown(input, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    await view.rerender({ ...props, open: false })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.input(input, { target: { value: 'Bet' } })
    expect(onQueryChange).toHaveBeenCalledWith('Bet')
    expect(onValueChange).toHaveBeenCalledWith('')
  })
})

describe('Tokenizer', () => {
  it('emits selection and removal intents without changing controlled state', async () => {
    const onSelectedChange = vi.fn()
    const props = {
      id: 'tags', label: 'Tags', selected: ['alpha'], onSelectedChange,
      query: '', onQueryChange: vi.fn(), open: true, onOpenChange: vi.fn(), options,
    }
    const view = render(Tokenizer, props)
    await fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(onSelectedChange).toHaveBeenCalledWith(['alpha', 'beta'])
    await view.rerender({ ...props, selected: ['alpha', 'beta'] })
    await fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }))
    expect(onSelectedChange).toHaveBeenCalledWith(['beta'])
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
  })

  it('removes the last selection with Backspace on an empty query', async () => {
    const onSelectedChange = vi.fn()
    render(Tokenizer, {
      id: 'tags', label: 'Tags', selected: ['alpha', 'beta'], onSelectedChange,
      query: '', onQueryChange: vi.fn(), open: false, onOpenChange: vi.fn(), options,
    })
    await fireEvent.keyDown(screen.getByRole('combobox', { name: 'Tags' }), { key: 'Backspace' })
    expect(onSelectedChange).toHaveBeenCalledWith(['alpha'])
  })

  it('moves through enabled options and toggles the active option with Enter', async () => {
    const onSelectedChange = vi.fn()
    render(Tokenizer, {
      id: 'tags', label: 'Tags', selected: ['alpha'], onSelectedChange,
      query: '', onQueryChange: vi.fn(), open: true, onOpenChange: vi.fn(), options,
    })
    const input = screen.getByRole('combobox', { name: 'Tags' })
    expect(screen.getByRole('group', { name: 'Selected Tags' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveAttribute('aria-disabled', 'true')
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', 'tags-option-1')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelectedChange).toHaveBeenCalledWith(['alpha', 'beta'])
  })
})
