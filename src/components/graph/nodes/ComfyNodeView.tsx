import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react'
import type { NodeViewProps } from '../contracts'
import { useGraphAdapter } from '../adapter/GraphAdapterContext'
import { patchComfyConfiguration, readIntWidget } from '../comfy/editableFields'
import type {
  ComfyEditableField,
  ComfyNodeConfiguration,
  ComfyReferenceImage,
} from '../comfy/types'

function roleKind(fields: readonly ComfyEditableField[] | undefined): string {
  if (!fields?.length) return 'comfy'
  if (fields.some((field) => field.role === 'prompt')) return 'prompt'
  if (fields.some((field) => field.role === 'image')) return 'image'
  if (fields.some((field) => field.role === 'latentSize')) return 'latent'
  if (fields.some((field) => field.role === 'int')) return 'param'
  return 'comfy'
}

function resolveComfyStatus(
  validation: NodeViewProps['validation'],
  runtime: NodeViewProps['runtime'],
): string {
  const hasError = validation.some((issue) => issue.severity === 'error')
  const hasWarn = validation.some((issue) => issue.severity === 'warning')

  if (runtime?.status === 'running') return 'running'
  if (runtime?.status === 'failed') return 'failed'
  if (runtime?.status === 'succeeded') return 'succeeded'
  if (hasError) return 'error'
  if (hasWarn) return 'warn'
  if (runtime?.status === 'idle') return 'idle'
  return 'ready'
}

function statusLabel(status: string): string {
  switch (status) {
    case 'error':
      return 'ERROR'
    case 'warn':
      return 'WARN'
    case 'running':
      return 'RUN'
    case 'succeeded':
      return 'DONE'
    case 'failed':
      return 'FAIL'
    case 'idle':
      return 'queue'
    default:
      return 'ready'
  }
}

export function ComfyNodeView({
  node,
  selected,
  readonly,
  validation,
  runtime,
  dispatch,
}: NodeViewProps<ComfyNodeConfiguration>) {
  const configuration = node.configuration
  const fields = configuration.editableFields ?? []
  const editable = fields.length > 0 && !readonly
  const { poppedNodeIds, togglePopped } = useGraphAdapter()
  const popped = poppedNodeIds.has(node.id)
  const status = resolveComfyStatus(validation, runtime)

  const commit = (patch: {
    widgetPatches?: Record<number, unknown>
    referenceImage?: ComfyNodeConfiguration['referenceImage']
  }) => {
    const next = patchComfyConfiguration(configuration, patch)
    dispatch({
      type: 'node.configure',
      nodeId: node.id,
      configuration: next,
    })
  }

  const togglePop = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    togglePopped(node.id)
  }

  return (
    <article
      data-tint-graph-node
      data-kind="comfy.node"
      data-comfy-class={configuration.classType}
      data-selected={selected ? 'true' : 'false'}
      data-popped={popped ? 'true' : 'false'}
      data-editable={editable ? 'true' : 'false'}
      data-status={status}
      className="tint-graph-node tint-graph-node--comfy"
    >
      <header className="tint-graph-node__header">
        <span className="tint-graph-node__kind">{roleKind(fields)}</span>
        <span className="tint-graph-node__status" data-status={status}>
          {statusLabel(status)}
        </span>
      </header>
      {runtime?.detail && (status === 'running' || status === 'failed') ? (
        <p className="tint-graph-node__runtime-detail">
          {runtime.detail}
        </p>
      ) : null}

      <div className="tint-graph-node__title-row">
        <h3 className="tint-graph-node__title">
          {node.presentation?.label ?? configuration.classType}
        </h3>
        {editable ? (
          <button
            type="button"
            className="nodrag nowheel tint-graph-node__expand"
            aria-expanded={popped}
            onClick={togglePop}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {popped ? 'Dock' : 'Pop out'}
          </button>
        ) : null}
      </div>
      <p className="tint-graph-node__description">{configuration.classType}</p>

      {editable && !popped ? (
        <div
          className="nodrag nowheel tint-graph-node__widgets"
        >
          {fields.map((field) => (
            <FieldEditor
              key={`${field.role}-${field.label}`}
              field={field}
              configuration={configuration}
              compact
              onCommit={commit}
            />
          ))}
        </div>
      ) : null}

      {!editable ? <CollapsedSummary configuration={configuration} fields={fields} /> : null}

      {validation.length ? (
        <ul className="tint-graph-node__issues" aria-label="Validation issues">
          {/* Two issues can share a code — one per offending path — so the code
              alone is not a key. */}
          {validation.map((issue, index) => (
            <li key={`${issue.code}:${issue.path ?? index}`} data-severity={issue.severity}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="tint-graph-node__ports" aria-label="Ports">
        {node.ports.slice(0, 4).map((port) => (
          <li key={port.id} data-direction={port.direction}>
            <span className="tint-graph-node__port-key">{port.key}</span>
            <span className="tint-graph-node__port-dir">
              {port.dataType?.localName ?? port.direction}
            </span>
          </li>
        ))}
        {node.ports.length > 4 ? (
          <li className="tint-graph-node__ports-more">+{node.ports.length - 4} ports</li>
        ) : null}
      </ul>

      {editable && popped ? (
        <div
          className="nodrag nowheel tint-graph-node__popout"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="tint-graph-node__popout-head">
            <span>Edit parameters</span>
            <button
              type="button"
              className="nodrag tint-graph-node__expand"
              onClick={togglePop}
            >
              Dock
            </button>
          </div>
          {fields.map((field) => (
            <FieldEditor
              key={`pop-${field.role}-${field.label}`}
              field={field}
              configuration={configuration}
              compact={false}
              onCommit={commit}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function CollapsedSummary({
  configuration,
  fields,
}: {
  configuration: ComfyNodeConfiguration
  fields: readonly ComfyEditableField[]
}) {
  if (configuration.referenceImage) {
    return (
      <div className="tint-graph-node__image-thumb">
        <img src={configuration.referenceImage.url} alt={configuration.referenceImage.name} />
        <span>{configuration.referenceImage.name}</span>
      </div>
    )
  }

  const promptField = fields.find((field) => field.role === 'prompt')
  if (promptField && configuration.promptText) {
    const text = configuration.promptText.trim().replace(/\s+/g, ' ')
    return (
      <p className="tint-graph-node__prompt-preview">
        {text.length > 110 ? `${text.slice(0, 110)}…` : text}
      </p>
    )
  }

  const latent = fields.find((field) => field.role === 'latentSize')
  if (latent) {
    const width = readIntWidget(configuration.widgets, latent.widthIndex, 0)
    const height = readIntWidget(configuration.widgets, latent.heightIndex, 0)
    const frames =
      latent.framesIndex == null
        ? null
        : readIntWidget(configuration.widgets, latent.framesIndex, 0)
    return (
      <p className="tint-graph-node__param-chip">
        {width}×{height}
        {frames != null ? ` · ${frames}f` : ''}
      </p>
    )
  }

  const intField = fields.find((field) => field.role === 'int')
  if (intField) {
    return (
      <p className="tint-graph-node__param-chip">
        {intField.label}: {readIntWidget(configuration.widgets, intField.widgetIndex, 0)}
      </p>
    )
  }

  if (configuration.modelName) {
    return (
      <ul className="tint-graph-node__widget-summary">
        <li>
          <code>{configuration.modelName}</code>
        </li>
      </ul>
    )
  }

  return null
}

function FieldEditor({
  field,
  configuration,
  compact,
  onCommit,
}: {
  field: ComfyEditableField
  configuration: ComfyNodeConfiguration
  compact: boolean
  onCommit: (patch: {
    widgetPatches?: Record<number, unknown>
    referenceImage?: ComfyNodeConfiguration['referenceImage']
  }) => void
}) {
  if (field.role === 'prompt') {
    return (
      <PromptField
        label={field.label}
        value={String(configuration.widgets[field.widgetIndex] ?? '')}
        compact={compact}
        onCommit={(value) =>
          onCommit({ widgetPatches: { [field.widgetIndex]: value } })
        }
      />
    )
  }

  if (field.role === 'int') {
    return (
      <IntField
        label={field.label}
        value={readIntWidget(configuration.widgets, field.widgetIndex, 0)}
        min={field.min}
        max={field.max}
        step={field.step}
        onCommit={(value) =>
          onCommit({ widgetPatches: { [field.widgetIndex]: value } })
        }
      />
    )
  }

  if (field.role === 'latentSize') {
    return (
      <LatentSizeField
        label={field.label}
        width={readIntWidget(configuration.widgets, field.widthIndex, 512)}
        height={readIntWidget(configuration.widgets, field.heightIndex, 512)}
        frames={
          field.framesIndex == null
            ? undefined
            : readIntWidget(configuration.widgets, field.framesIndex, 1)
        }
        onCommit={(next) => {
          const widgetPatches: Record<number, unknown> = {
            [field.widthIndex]: next.width,
            [field.heightIndex]: next.height,
          }
          if (field.framesIndex != null && next.frames != null) {
            widgetPatches[field.framesIndex] = next.frames
          }
          onCommit({ widgetPatches })
        }}
      />
    )
  }

  return (
    <ImageDropField
      label={field.label}
      accept={field.accept}
      image={configuration.referenceImage ?? null}
      width={
        field.widthIndex == null
          ? undefined
          : readIntWidget(configuration.widgets, field.widthIndex, 512)
      }
      height={
        field.heightIndex == null
          ? undefined
          : readIntWidget(configuration.widgets, field.heightIndex, 512)
      }
      onImage={(image, size) => {
        const widgetPatches: Record<number, unknown> = {}
        if (field.widthIndex != null && size) widgetPatches[field.widthIndex] = size.width
        if (field.heightIndex != null && size) widgetPatches[field.heightIndex] = size.height
        onCommit({
          referenceImage: image,
          widgetPatches: Object.keys(widgetPatches).length ? widgetPatches : undefined,
        })
      }}
      onClear={() => onCommit({ referenceImage: null })}
    />
  )
}

function PromptField({
  label,
  value,
  compact,
  onCommit,
}: {
  label: string
  value: string
  compact: boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const fieldId = useId()

  /*
   * Explicitly associated rather than wrapped. The apply button used to sit
   * inside the <label>, so its text was part of the textarea's accessible name
   * ("Prompt Apply prompt") and clicking it also redirected focus to the field.
   */
  return (
    <div className="tint-graph-field">
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        className="nodrag nowheel"
        rows={compact ? 3 : 8}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft)
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
      <button
        type="button"
        className="nodrag tint-graph-field__apply"
        disabled={draft === value}
        onClick={() => onCommit(draft)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        Apply prompt
      </button>
    </div>
  )
}

function IntField({
  label,
  value,
  min = 1,
  max = 4096,
  step = 1,
  onCommit,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onCommit: (value: number) => void
}) {
  /**
   * Edited as a draft, committed on blur or Enter.
   *
   * It used to dispatch `node.configure` on every keystroke, which bumped the
   * document revision and rebuilt every node in the graph per character. Worse,
   * it committed `Number(event.target.value)` whenever that was finite — and
   * `Number('') === 0` is finite, so clearing the field to retype a value wrote
   * a 0 and the field could never be emptied.
   */
  const [draft, setDraft] = useState(String(value))
  const committed = useRef(value)
  if (committed.current !== value) {
    committed.current = value
    setDraft(String(value))
  }

  const commitDraft = () => {
    const next = Number(draft)
    // An empty or unparseable field reverts rather than committing a zero.
    if (draft.trim() === '' || !Number.isFinite(next)) {
      setDraft(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, next))
    setDraft(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <label className="tint-graph-field tint-graph-field--inline">
      <span>{label}</span>
      <input
        className="nodrag nowheel"
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitDraft()
          }
          if (event.key === 'Escape') setDraft(String(value))
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </label>
  )
}

function LatentSizeField({
  label,
  width,
  height,
  frames,
  onCommit,
}: {
  label: string
  width: number
  height: number
  frames?: number
  onCommit: (next: { width: number; height: number; frames?: number }) => void
}) {
  const [w, setW] = useState(width)
  const [h, setH] = useState(height)
  const [f, setF] = useState(frames ?? 1)
  useEffect(() => {
    setW(width)
    setH(height)
    if (frames != null) setF(frames)
  }, [frames, height, width])

  const dirty = w !== width || h !== height || (frames != null && f !== frames)

  return (
    <div className="tint-graph-field">
      <span>{label}</span>
      <div className="tint-graph-field__row">
        <label>
          W
          <input
            className="nodrag nowheel"
            type="number"
            min={16}
            max={4096}
            step={8}
            value={w}
            onChange={(event) => setW(Number(event.target.value))}
            onPointerDown={(event) => event.stopPropagation()}
          />
        </label>
        <label>
          H
          <input
            className="nodrag nowheel"
            type="number"
            min={16}
            max={4096}
            step={8}
            value={h}
            onChange={(event) => setH(Number(event.target.value))}
            onPointerDown={(event) => event.stopPropagation()}
          />
        </label>
        {frames != null ? (
          <label>
            Frames
            <input
              className="nodrag nowheel"
              type="number"
              min={1}
              max={257}
              step={1}
              value={f}
              onChange={(event) => setF(Number(event.target.value))}
              onPointerDown={(event) => event.stopPropagation()}
            />
          </label>
        ) : null}
      </div>
      <button
        type="button"
        className="nodrag tint-graph-field__apply"
        disabled={!dirty}
        onClick={() =>
          onCommit(frames != null ? { width: w, height: h, frames: f } : { width: w, height: h })
        }
        onPointerDown={(event) => event.stopPropagation()}
      >
        Apply size
      </button>
    </div>
  )
}

function ImageDropField({
  label,
  accept,
  image,
  width,
  height,
  onImage,
  onClear,
}: {
  label: string
  accept: string
  image: ComfyReferenceImage | null
  width?: number
  height?: number
  onImage: (
    image: ComfyReferenceImage,
    size?: { width: number; height: number },
  ) => void
  onClear: () => void
}) {
  const fieldId = useId()
  const labelId = `${fieldId}-label`
  const valueId = `${fieldId}-value`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  /**
   * Object URLs this field created, revoked when it is replaced or unmounted.
   * Without this each drop leaks its blob for the lifetime of the page.
   */
  const ownedUrls = useRef<string[]>([])
  useEffect(
    () => () => {
      for (const url of ownedUrls.current) URL.revokeObjectURL(url)
      ownedUrls.current = []
    },
    [],
  )

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    ownedUrls.current.push(url)
    const reference: ComfyReferenceImage = {
      name: file.name,
      mimeType: file.type,
      size: file.size,
      url,
    }
    // Natural size is a nicety; a decode failure still records the file.
    const probe = new Image()
    probe.onload = () =>
      onImage(reference, { width: probe.naturalWidth, height: probe.naturalHeight })
    probe.onerror = () => onImage(reference)
    probe.src = url
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) readFile(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  return (
    <div className="tint-graph-field">
      <span id={labelId}>{label}</span>
      <div
        className={`nodrag nowheel tint-graph-drop${dragging ? ' tint-graph-drop--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onPointerDown={(event) => event.stopPropagation()}
        role="button"
        tabIndex={0}
        // Names the control after what it sets, and after what it currently
        // holds — the `useId` here was previously computed, put on the hidden
        // <input>, and referenced by nothing, leaving the file picker unnamed.
        aria-labelledby={labelId}
        aria-describedby={image ? valueId : undefined}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          // Space scrolls the page unless the default is taken.
          event.preventDefault()
          inputRef.current?.click()
        }}
      >
        {image ? (
          <>
            <img src={image.url} alt="" />
            <span id={valueId}>{image.name}</span>
            {width && height ? (
              <span className="tint-graph-drop__meta">
                {width}×{height}
              </span>
            ) : null}
          </>
        ) : (
          <span>Drop a reference image, or click to browse</span>
        )}
      </div>
      <input
        ref={inputRef}
        className="nodrag"
        type="file"
        accept={accept}
        aria-labelledby={labelId}
        hidden
        onChange={onInputChange}
      />
      {image ? (
        <button
          type="button"
          className="nodrag tint-graph-field__apply"
          onClick={(event) => {
            event.stopPropagation()
            onClear()
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Clear image
        </button>
      ) : null}
    </div>
  )
}
