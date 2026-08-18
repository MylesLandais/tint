import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormLayout } from './FormLayout'
import { DEMO_FORM_SCHEMA } from './schemas'
import { FileField } from './inputs'
import { FormTransportError, defaultValuesForSchema } from './contracts'

describe('FormLayout', () => {
  it('is controlled and reports a submit envelope', async () => {
    const onValuesChange = vi.fn()
    const onSubmit = vi.fn()
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }

    render(
      <FormLayout
        schema={DEMO_FORM_SCHEMA}
        values={values}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ren' } })
    expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ren' }))

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      formId: 'tint.form.demo',
      schemaVersion: '1',
      values: expect.objectContaining({ name: 'Aiko', email: 'aiko@example.test' }),
    })
  })

  it('surfaces required-field issues instead of calling onSubmit', () => {
    const onSubmit = vi.fn()
    render(
      <FormLayout
        schema={DEMO_FORM_SCHEMA}
        values={defaultValuesForSchema(DEMO_FORM_SCHEMA)}
        onValuesChange={() => {}}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })

  it('locks the form while a transport submit is in flight and only writes once', async () => {
    let release: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const persist = vi.fn(async () => {
      await pending
    })
    const transport = {
      validate: async () => ({ ok: true as const, issues: [] }),
      submit: async () => {
        await persist()
        return { requestId: 'test', value: {}, warnings: [] as const }
      },
    }
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }

    render(
      <FormLayout
        schema={DEMO_FORM_SCHEMA}
        values={values}
        onValuesChange={() => {}}
        transport={transport}
      />,
    )

    const form = screen.getByRole('button', { name: 'Submit' }).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    expect(persist).toHaveBeenCalledOnce()
    release()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled())
  })

  it('surfaces a transport rejection in the form banner', async () => {
    const onSubmitError = vi.fn()
    const values = { ...defaultValuesForSchema(DEMO_FORM_SCHEMA), name: 'Aiko', email: 'aiko@example.test' }
    render(
      <FormLayout
        schema={DEMO_FORM_SCHEMA}
        values={values}
        onValuesChange={() => {}}
        onSubmitError={onSubmitError}
        transport={{
          validate: async () => ({ ok: true, issues: [] }),
          submit: async () => {
            throw new FormTransportError('The form transport could not be reached.')
          },
        }}
      />,
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('The form transport could not be reached.')
    expect(onSubmitError).toHaveBeenCalledOnce()
  })
})

describe('FileField', () => {
  it('does not throw when mimeType is missing', () => {
    render(
      <FileField
        id="avatar"
        value={{ name: 'portrait.png', mimeType: '', objectUrl: 'blob:missing' }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText('portrait.png')).toBeInTheDocument()
  })
})
