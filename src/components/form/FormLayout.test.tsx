import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormLayout } from './FormLayout'
import { DEMO_FORM_SCHEMA } from './schemas'
import { defaultValuesForSchema } from './contracts'

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
    expect(onSubmit).toHaveBeenCalledOnce()
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
})
