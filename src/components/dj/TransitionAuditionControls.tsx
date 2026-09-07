export type TransitionAuditionState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'unavailable'
  | 'error'

export type TransitionAuditionControlsProps = {
  state: TransitionAuditionState
  onAudition: () => void
  onStop: () => void
  unavailableReason?: string
  error?: string
  className?: string
}

export function TransitionAuditionControls({
  state,
  onAudition,
  onStop,
  unavailableReason,
  error,
  className,
}: TransitionAuditionControlsProps) {
  const status = state === 'unavailable'
    ? unavailableReason ?? 'Transition audition is unavailable'
    : state === 'loading'
      ? 'Preparing audition'
      : state === 'playing'
        ? 'Audition playing'
        : 'Audition ready'

  return (
    <section
      aria-label="Transition audition"
      className={className ?? 'flex flex-wrap items-center gap-2'}
    >
      <button
        type="button"
        disabled={state !== 'idle' && state !== 'error'}
        className="rounded-md bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onAudition}
      >
        Audition transition
      </button>
      <button
        type="button"
        disabled={state !== 'playing' && state !== 'loading'}
        className="rounded-md border border-tint-border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onStop}
      >
        Stop audition
      </button>
      {state === 'error' ? (
        <span role="alert" className="text-sm text-tint-danger">
          {error ?? 'Transition audition failed'}
        </span>
      ) : (
        <span role="status" className="text-sm text-tint-muted">{status}</span>
      )}
    </section>
  )
}
