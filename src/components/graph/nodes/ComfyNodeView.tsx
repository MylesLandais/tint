import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react'
import type { NodeViewProps } from '../contracts'
import { patchComfyConfiguration, readIntWidget } from '../comfy/editableFields'
import type {
  ComfyEditableField,
  ComfyNodeConfiguration,
  ComfyReferenceImage,
} from '../comfy/types'

/** Survives React Flow remounts when selection / document updates. */
const poppedNodeIds = new Set<string>()
const popListeners = new Set<() => void>()

function subscribePopped(onStoreChange: () => void) {
  popListeners.add(onStoreChange)
  return () => {
    popListeners.delete(onStoreChange)
  }
}

function isPopped(nodeId: string) {
  return poppedNodeIds.has(nodeId)
}

function setPopped(nodeId: string, next: boolean) {
  const had = poppedNodeIds.has(nodeId)
  if (next && !had) poppedNodeIds.add(nodeId)
  if (!next && had) poppedNodeIds.delete(nodeId)
  if (next !== had) {
    for (const listener of popListeners) listener()
  }
}

function roleKind(fields: readonly ComfyEditableField[] | undefined): string {
  if (!fields?.length) return 'comfy'
  if (fields.some((field) => field.role === 'prompt')) return 'prompt'
  if (fields.some((field) => field.role === 'image')) return 'image'
  if (fields.some((field) => field.role === 'latentSize')) return 'latent'
  if (fields.some((field) => field.role === 'int')) return 'param'
  return 'comfy'
}

export function ComfyNodeView({
  node,
  selected,
  readonly,
  validation,
  dispatch,
}: NodeViewProps<ComfyNodeConfiguration>) {
  const configuration = node.configuration
  const fields = configuration.editableFields ?? []
  const editable = fields.length > 0 && !readonly
  const popped = useSyncExternalStore(
    subscribePopped,
    () => isPopped(node.id),
    () => false,
  )
  const status = validation.some((issue) => issue.severity === 'error')
    ? 'error'
    : validation.some((issue) => issue.severity === 'warning')
      ? 'warn'
      : 'ready'

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
    setPopped(node.id, !popped)
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
          {status === 'error' ? 'ERROR' : status === 'warn' ? 'WARN' : 'ready'}
        </span>
      </header>

      <div className="tint-graph-node__title-row">
        <h3 className="tint-graph-node__title">
          {node.presentation?.label ?? configuration.classType}
        </h3>
        {editable ? (
          <button
            type="button"
            className="nodrag nowheel tint-graph-node__expand"
            data-testid={`comfy-expand-${node.id}`}
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
          data-testid={`comfy-widgets-${node.id}`}
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
          {validation.map((issue) => (
            <li key={issue.code} data-severity={issue.severity}>
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
          data-testid={`comfy-drawer-${node.id}`}
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
        <img src={configuration.referenceImage.dataUrl} alt={configuration.referenceImage.name} />
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

  return (
    <label className="tint-graph-field">
      <span>{label}</span>
      <textarea
        className="nodrag nowheel"
        data-testid="comfy-inline-prompt"
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
        data-testid="comfy-inline-prompt-apply"
        disabled={draft === value}
        onClick={() => onCommit(draft)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        Apply prompt
      </button>
    </label>
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
  return (
    <label className="tint-graph-field tint-graph-field--inline">
      <span>{label}</span>
      <input
        className="nodrag nowheel"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        data-testid={`comfy-inline-int-${label}`}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onCommit(next)
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
            data-testid="comfy-inline-latent-w"
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
            data-testid="comfy-inline-latent-h"
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
              data-testid="comfy-inline-latent-frames"
              onChange={(event) => setF(Number(event.target.value))}
              onPointerDown={(event) => event.stopPropagation()}
            />
          </label>
        ) : null}
      </div>
      <button
        type="button"
        className="nodrag tint-graph-field__apply"
        data-testid="comfy-inline-latent-apply"
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
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      const img = new Image()
      img.onload = () => {
        onImage(
          { name: file.name, mimeType: file.type, dataUrl },
          { width: img.naturalWidth, height: img.naturalHeight },
        )
      }
      img.onerror = () => {
        onImage({ name: file.name, mimeType: file.type, dataUrl })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
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
      <span>{label}</span>
      <div
        className={`nodrag nowheel tint-graph-drop${dragging ? ' tint-graph-drop--active' : ''}`}
        data-testid="comfy-inline-image-drop"
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
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
      >
        {image ? (
          <>
            <img src={image.dataUrl} alt={image.name} />
            <span>{image.name}</span>
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
        id={inputId}
        ref={inputRef}
        className="nodrag"
        type="file"
        accept={accept}
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
