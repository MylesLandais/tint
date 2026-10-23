import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import FileField from './FileField.svelte'
import NumberField from './NumberField.svelte'
import PasswordField from './PasswordField.svelte'
import Select from './Select.svelte'
import SelectField from './SelectField.svelte'
import SliderField from './SliderField.svelte'
import TagsField from './TagsField.svelte'
import TextAreaField from './TextAreaField.svelte'
import TextField from './TextField.svelte'
import ToggleField from './ToggleField.svelte'

describe('Svelte form fields', () => {
  it('forwards the native text-field key event so hosts can prevent implicit submission', async () => {
    const onkeydown = vi.fn((event: KeyboardEvent) => { if (event.key === 'Enter') event.preventDefault() })
    render(TextField, { id: 'detail', label: 'Detail', value: '', onValueChange: vi.fn(), onkeydown })
    const input = screen.getByRole('textbox', { name: 'Detail' })
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    await fireEvent(input, enter)
    expect(onkeydown).toHaveBeenCalledTimes(1)
    expect(onkeydown.mock.calls[0][0]).toBe(enter)
    expect(enter.target).toBe(input)
    expect(enter.defaultPrevented).toBe(true)
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    await fireEvent(input, arrow)
    expect(arrow.defaultPrevented).toBe(false)
  })
  it('forwards optional native text bounds without truncating host values', async () => {
    const props = { id: 'search', label: 'Search', value: 'authoritative value', onValueChange: vi.fn() }
    const view = render(TextField, props)
    const input = screen.getByRole('textbox', { name: 'Search' })
    expect(input).not.toHaveAttribute('maxlength')
    await view.rerender({ ...props, maxLength: 4 })
    expect(input).toHaveAttribute('maxlength', '4')
    expect(input).toHaveValue(props.value)
    expect(props.onValueChange).not.toHaveBeenCalled()
    await view.rerender({ ...props, maxLength: 0 })
    expect(input).toHaveAttribute('maxlength', '0')
    await view.rerender({ ...props, maxLength: undefined })
    expect(input).not.toHaveAttribute('maxlength')
  })
  it('keeps a rejected selection or pending toggle at the host-observed value', async () => {
    const onValueChange = vi.fn(), onCheckedChange = vi.fn()
    const { rerender } = render(Select, { 'aria-label': 'Source file', value: 'a', onValueChange, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
    const select = screen.getByRole('combobox', { name: 'Source file' })
    await fireEvent.change(select, { target: { value: 'b' } })
    expect(onValueChange).toHaveBeenCalledWith('b')
    expect(select).toHaveValue('a')
    await rerender({ 'aria-label': 'Source file', value: 'b', onValueChange, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
    expect(select).toHaveValue('b')
    render(ToggleField, { id: 'observed', label: 'Observed service', checked: false, onCheckedChange })
    const toggle = screen.getByRole('checkbox', { name: 'Observed service' })
    await fireEvent.click(toggle)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(toggle).not.toBeChecked()
  })
  it('preserves textarea bounds and native spelling choices through the public field API', async () => {
    const props = { id: 'message', label: 'Message', value: '', onValueChange: vi.fn(), maxLength: 4000 }
    const view = render(TextAreaField, props)
    const input = screen.getByRole('textbox', { name: 'Message' })
    expect(input).toHaveAttribute('maxlength', '4000')
    expect(input).not.toHaveAttribute('spellcheck')
    await view.rerender({ ...props, spellcheck: false })
    expect(input).toHaveAttribute('spellcheck', 'false')
    await view.rerender({ ...props, spellcheck: true })
    expect(input).toHaveAttribute('spellcheck', 'true')
  })
  it('keeps compact row selection named when its label is visually hidden', async () => {
    const onCheckedChange = vi.fn()
    const { container } = render(ToggleField, { id: 'row-selection', label: 'Select recording', hideLabel: true, checked: false, onCheckedChange })
    const checkbox = screen.getByRole('checkbox', { name: 'Select recording' })
    expect(container.querySelector('label')).toHaveClass('visually-hidden')
    await fireEvent.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
  it('keeps a blank number distinct from zero', async () => {
    const onValueChange = vi.fn()
    render(NumberField, { id: 'count', label: 'Count', value: 3, onValueChange })
    await fireEvent.input(screen.getByRole('spinbutton', { name: 'Count' }), { target: { value: '' } })
    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('shows write only password state and respects controlled visibility', async () => {
    const onVisibleChange = vi.fn()
    const props = {
      id: 'secret', label: 'Secret', value: '', onValueChange: vi.fn(),
      required: true, hasStoredValue: true, visible: false, onVisibleChange,
    }
    const view = render(PasswordField, props)
    const input = screen.getByLabelText('Secret')
    expect(input).not.toBeRequired()
    expect(input).toHaveAttribute('aria-describedby', 'secret-stored')
    expect(screen.getByText('A value is stored. Leave blank to keep it.')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(onVisibleChange).toHaveBeenCalledWith(true)
    expect(input).toHaveAttribute('type', 'password')
    await view.rerender({ ...props, visible: true })
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('forwards textarea, select, toggle and slider changes', async () => {
    const onText = vi.fn()
    const onSelect = vi.fn()
    const onChecked = vi.fn()
    const onSlider = vi.fn()
    render(TextAreaField, { id: 'bio', label: 'Bio', value: '', onValueChange: onText })
    render(SelectField, {
      id: 'role', label: 'Role', value: 'viewer', onValueChange: onSelect,
      options: [{ value: 'viewer', label: 'Viewer' }, { value: 'editor', label: 'Editor' }],
    })
    render(ToggleField, { id: 'enabled', label: 'Enabled', checked: false, onCheckedChange: onChecked })
    render(SliderField, { id: 'level', label: 'Level', value: 0.5, onValueChange: onSlider })
    await fireEvent.input(screen.getByRole('textbox', { name: 'Bio' }), { target: { value: 'Hello' } })
    await fireEvent.change(screen.getByRole('combobox', { name: 'Role' }), { target: { value: 'editor' } })
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }))
    await fireEvent.input(screen.getByRole('slider', { name: 'Level' }), { target: { value: '0.75' } })
    expect(onText).toHaveBeenCalledWith('Hello')
    expect(onSelect).toHaveBeenCalledWith('editor')
    expect(onChecked).toHaveBeenCalledWith(true)
    expect(onSlider).toHaveBeenCalledWith(0.75)
  })

  it('uses Tokenizer for freeform tags and emits the next selected list', async () => {
    const onValueChange = vi.fn()
    const props = { id: 'tags', label: 'Tags', value: ['alpha'], onValueChange }
    const view = render(TagsField, props)
    const input = screen.getByRole('combobox', { name: 'Tags' })
    await fireEvent.input(input, { target: { value: ' beta ' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith(['alpha', 'beta'])
    await view.rerender({ ...props, value: ['alpha', 'beta'] })
    await fireEvent.click(screen.getByRole('button', { name: 'Remove alpha' }))
    expect(onValueChange).toHaveBeenCalledWith(['beta'])
  })

  it('renders an existing file without assuming a mime type', () => {
    render(FileField, {
      id: 'avatar', label: 'Avatar',
      value: { name: 'portrait.png', mimeType: '', objectUrl: 'blob:missing' },
      onValueChange: vi.fn(),
    })
    expect(screen.getByText('portrait.png')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('Select', () => {
  it('is a native, labelled select that reports invalid state and changes', async () => {
    const onChange = vi.fn()
    render(SelectField, { id: 'plan', label: 'Plan', value: 'a', onValueChange: onChange, error: 'Pick one', options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', disabled: true }, { value: 'c', label: 'Gamma' }] })
    const select = screen.getByLabelText('Plan') as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveClass('tint-select')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAttribute('aria-describedby', expect.stringContaining('plan'))
    expect(within(select).getByRole('option', { name: 'Beta' })).toBeDisabled()
    await fireEvent.change(select, { target: { value: 'c' } })
    expect(onChange).toHaveBeenCalledWith('c')
  })
})
