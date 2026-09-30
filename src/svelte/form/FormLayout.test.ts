import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import {
  FormTransportError,
  defaultValuesForSchema,
  type FormSchema,
} from '../../core/form/contracts'
import { DEMO_FORM_SCHEMA, createCredentialFormSchema } from '../../core/form/schemas'
import { CHARACTER_CARD_FORM_SCHEMA } from '../../core/character-card/schema'
import { emptyTavernCard } from '../../core/character-card/parse'
import FormLayout from './FormLayout.svelte'

describe('Svelte FormLayout', () => {
  it('is controlled and submits an envelope built from the supplied values', async () => {
    const onValuesChange = vi.fn()
    const onSubmit = vi.fn()
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }
    render(FormLayout, { schema: DEMO_FORM_SCHEMA, values, onValuesChange, onSubmit })

    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ren' } })
    expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ren' }))
    await fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      formId: 'tint.form.demo', schemaVersion: '1',
      values: expect.objectContaining({ name: 'Aiko', email: 'aiko@example.test' }),
    })
  })

  it('reports local validation issues and blocks submission', async () => {
    const onSubmit = vi.fn()
    const onValidation = vi.fn()
    render(FormLayout, {
      schema: DEMO_FORM_SCHEMA,
      values: defaultValuesForSchema(DEMO_FORM_SCHEMA),
      onValuesChange: vi.fn(), onSubmit, onValidation,
    })
    await fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onValidation).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ path: 'name' })]))
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus())
  })

  it('locks during one transport write and releases after completion', async () => {
    let release: () => void = () => {}
    const pending = new Promise<void>((resolve) => { release = resolve })
    const persist = vi.fn(async () => { await pending })
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }
    const transport = {
      validate: async () => ({ ok: true as const, issues: [] }),
      submit: async () => {
        await persist()
        return { requestId: 'test', value: {}, warnings: [] as const }
      },
    }
    render(FormLayout, { schema: DEMO_FORM_SCHEMA, values, onValuesChange: vi.fn(), transport })
    const form = screen.getByRole('button', { name: 'Submit' }).closest('form')!
    await fireEvent.submit(form)
    await fireEvent.submit(form)
    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    expect(persist).toHaveBeenCalledOnce()
    release()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled())
  })

  it('surfaces transport errors in a form alert', async () => {
    const onSubmitError = vi.fn()
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }
    render(FormLayout, {
      schema: DEMO_FORM_SCHEMA, values, onValuesChange: vi.fn(), onSubmitError,
      transport: {
        validate: async () => ({ ok: true, issues: [] }),
        submit: async () => { throw new FormTransportError('Transport unavailable') },
      },
    })
    await fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Transport unavailable')
    expect(onSubmitError).toHaveBeenCalledOnce()
  })

  it('aborts an in-flight validation and does not continue after unmount', async () => {
    let release: (result: { ok: boolean; issues: [] }) => void = () => {}
    const pending = new Promise<{ ok: boolean; issues: [] }>((resolve) => { release = resolve })
    const submit = vi.fn(async () => ({ requestId: 'test', value: {}, warnings: [] }))
    const onSubmit = vi.fn()
    let signal: AbortSignal | undefined
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }
    const view = render(FormLayout, {
      schema: DEMO_FORM_SCHEMA, values, onValuesChange: vi.fn(), onSubmit,
      transport: {
        validate: async (_envelope: unknown, options?: { signal?: AbortSignal }) => {
          signal = options?.signal
          return pending
        },
        submit,
      },
    })
    await fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    expect(signal).toBeDefined()
    view.unmount()
    expect(signal?.aborted).toBe(true)
    release({ ok: true, issues: [] })
    await Promise.resolve()
    expect(submit).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('uses nested paths for repeatable item edits', async () => {
    const schema: FormSchema = {
      id: 'nested', version: '1', title: 'Nested',
      sections: [{ id: 'one', title: 'Entries', fields: [{
        name: 'entries', kind: 'repeatable', label: 'Entry',
        itemSchema: { id: 'item', title: '', fields: [{ name: 'title', kind: 'text', label: 'Title' }] },
      }] }],
    }
    const onValuesChange = vi.fn()
    render(FormLayout, { schema, values: { entries: [{ title: 'Old' }] }, onValuesChange })
    await fireEvent.input(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'New' } })
    expect(onValuesChange).toHaveBeenCalledWith({ entries: [{ title: 'New' }] })
    await fireEvent.click(screen.getByRole('button', { name: 'Remove Entry 1' }))
    expect(onValuesChange).toHaveBeenCalledWith({ entries: [] })
  })

  it('renders the existing credential schema with its host labels', async () => {
    const schema = createCredentialFormSchema({
      identifier: 'Email or username', password: 'Password',
      showPassword: 'Show password', hidePassword: 'Hide password',
    })
    const onValuesChange = vi.fn()
    render(FormLayout, {
      schema, values: { identifier: 'aiko', password: 'secret' }, onValuesChange,
      busy: true, error: 'Credentials rejected', submitLabel: 'Sign in',
      submittingLabel: 'Signing in…',
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Credentials rejected')
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    expect(screen.getByLabelText('Email or username')).toBeDisabled()
  })

  it('renders the character-card schema and preserves nested values on change', async () => {
    const card = emptyTavernCard()
    const onValuesChange = vi.fn()
    render(FormLayout, {
      schema: CHARACTER_CARD_FORM_SCHEMA,
      values: { ...card, avatar: null },
      onValuesChange,
      hideSubmit: true,
    })
    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ren' } })
    expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'Ren', extensions: card.data.extensions }),
    }))
    await fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        character_book: expect.objectContaining({ entries: [expect.objectContaining({ keys: [] })] }),
      }),
    }))
  })
})
