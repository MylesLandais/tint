<script lang="ts">
  import { onDestroy, tick } from 'svelte'
  import type { FormIssue, FormSchema } from '../../core/form/contracts'
  import {
    FormAbortError,
    createFormSubmitEnvelope,
    isFormError,
    setAtPath,
    validateForm,
    type FormSubmitEnvelope,
    type FormTransport,
    type FormValues,
  } from '../../core/form/contracts'
  import { firstFormErrorsByPath } from '../../core/form/render'
  import FormSectionView from './FormSectionView.svelte'
  import TintFluidForm from './TintFluidForm.svelte'
  import './styles.css'

  type Props = {
    schema: FormSchema
    values: FormValues
    onValuesChange: (values: FormValues) => void
    issues?: readonly FormIssue[]
    busy?: boolean
    disabled?: boolean
    readOnly?: boolean
    error?: string
    density?: 'compact' | 'comfortable'
    columns?: 1 | 2
    submitLabel?: string
    submittingLabel?: string
    hideSubmit?: boolean
    className?: string
    transport?: FormTransport<FormValues, unknown>
    onSubmit?: (envelope: FormSubmitEnvelope<FormValues>) => void | Promise<void>
    onValidation?: (issues: readonly FormIssue[]) => void
    onSubmitError?: (error: unknown) => void
  }

  let {
    schema, values, onValuesChange, issues: issueProp,
    busy = false, disabled = false, readOnly = false, error,
    density = 'comfortable', columns = 1,
    submitLabel = 'Submit', submittingLabel = 'Submitting…',
    hideSubmit = false, className,
    transport, onSubmit, onValidation, onSubmitError,
  }: Props = $props()

  const prefix = $props.id()
  let localIssues = $state<readonly FormIssue[]>([])
  let submitError = $state<string | null>(null)
  let submitting = $state(false)
  let inFlight = false
  let abortController: AbortController | null = null
  let mounted = true

  let issues = $derived(issueProp ?? localIssues)
  let issuesByPath = $derived(firstFormErrorsByPath(issues))
  let locked = $derived(busy || disabled || readOnly || submitting)
  let banner = $derived(error ?? submitError ?? undefined)

  onDestroy(() => {
    mounted = false
    abortController?.abort()
  })

  function setPath(path: string, value: unknown) {
    onValuesChange(setAtPath(values, path, value))
  }

  function failSubmit(cause: unknown) {
    if (cause instanceof FormAbortError) return
    onSubmitError?.(cause)
    if (!mounted) return
    submitError = isFormError(cause) || cause instanceof Error
      ? cause.message
      : 'The form could not be submitted.'
  }

  async function focusFirstInvalid(form: HTMLFormElement) {
    await tick()
    if (mounted) form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (locked || inFlight) return
    const result = validateForm(schema, values)
    localIssues = result.issues
    submitError = null
    onValidation?.(result.issues)
    if (!result.ok) {
      void focusFirstInvalid(event.currentTarget as HTMLFormElement)
      return
    }

    const envelope = createFormSubmitEnvelope(schema, values)
    inFlight = true
    submitting = true
    void settleSubmit(envelope, event.currentTarget as HTMLFormElement)
  }

  async function settleSubmit(envelope: FormSubmitEnvelope<FormValues>, form: HTMLFormElement) {
    const controller = new AbortController()
    abortController = controller
    let focusInvalid = false
    try {
      if (transport) {
        const remote = await transport.validate(envelope, { signal: controller.signal })
        if (controller.signal.aborted) return
        if (!remote.ok) {
          if (mounted) {
            localIssues = remote.issues
            focusInvalid = true
          }
          onValidation?.(remote.issues)
          return
        }
        await transport.submit(envelope, { signal: controller.signal })
        if (controller.signal.aborted) return
      }
      await onSubmit?.(envelope)
    } catch (cause) {
      failSubmit(cause)
    } finally {
      inFlight = false
      abortController = null
      if (mounted) {
        submitting = false
        if (focusInvalid) void focusFirstInvalid(form)
      }
    }
  }
</script>

<TintFluidForm
  title={schema.title || undefined}
  description={schema.description}
  error={banner}
  {density}
  columns={1}
  busy={busy || submitting}
  noValidate
  {className}
  onsubmit={submit}
>
  {#each schema.sections as section (section.id)}
    <FormSectionView
      {section}
      {prefix}
      {values}
      {issuesByPath}
      {locked}
      {columns}
      onSetPath={setPath}
      {onValuesChange}
    />
  {/each}
  {#if !hideSubmit}
    <button type="submit" class="tint-svelte-form-submit" disabled={locked}>
      {busy || submitting ? submittingLabel : submitLabel}
    </button>
  {/if}
</TintFluidForm>
