import type { ComfyEditableField, ComfyNode, ComfyNodeConfiguration } from './types'

function titleOf(node: ComfyNode): string {
  return (node.title ?? '').trim()
}

/**
 * Derive which widget surfaces tint should expose as in-node editors.
 * Kept intentionally small: prompt, latent/output resolution, and reference image.
 */
export function deriveEditableFields(node: ComfyNode): ComfyEditableField[] {
  const title = titleOf(node).toLowerCase()
  const classType = node.type
  const fields: ComfyEditableField[] = []

  if (classType === 'PrimitiveStringMultiline' && (title.includes('prompt') || title === '')) {
    fields.push({
      role: 'prompt',
      widgetIndex: 0,
      label: titleOf(node) || 'Prompt',
    })
  }

  if (classType === 'PrimitiveInt') {
    const key = titleOf(node) || 'value'
    /*
     * A ComfyUI `PrimitiveInt` carries no range, so the bounds are guessed from
     * the node's title. This is a heuristic tuned to English titles, and it is
     * only ever a nicety: the field still accepts what the workflow already
     * contains, and a wrong guess widens or narrows the spinner, nothing more.
     */
    fields.push({ role: 'int', key, widgetIndex: 0, label: key, ...intRange(key) })
  }

  if (classType === 'EmptyLTXVLatentVideo' || classType === 'EmptyLatentImage') {
    fields.push({
      role: 'latentSize',
      label: 'Latent resolution',
      widthIndex: 0,
      heightIndex: 1,
      framesIndex: classType === 'EmptyLTXVLatentVideo' ? 2 : undefined,
    })
  }

  if (classType === 'EmptyImage' || classType === 'LoadImage') {
    fields.push({
      role: 'image',
      label: 'Reference image',
      accept: 'image/*',
      widthIndex: classType === 'EmptyImage' ? 0 : undefined,
      heightIndex: classType === 'EmptyImage' ? 1 : undefined,
    })
  }

  if (classType === 'ResizeImageMaskNode') {
    fields.push({
      role: 'latentSize',
      label: 'Output size',
      widthIndex: 1,
      heightIndex: 2,
    })
  }

  return fields
}

export function patchComfyConfiguration(
  configuration: ComfyNodeConfiguration,
  patch: {
    widgetPatches?: Record<number, unknown>
    referenceImage?: ComfyNodeConfiguration['referenceImage']
  },
): ComfyNodeConfiguration {
  const widgets = [...configuration.widgets]
  if (patch.widgetPatches) {
    for (const [index, value] of Object.entries(patch.widgetPatches)) {
      widgets[Number(index)] = value
    }
  }

  const next: ComfyNodeConfiguration = {
    ...configuration,
    widgets,
    referenceImage:
      patch.referenceImage === undefined
        ? configuration.referenceImage
        : patch.referenceImage,
  }

  if (next.isPrompt && typeof widgets[0] === 'string') {
    next.promptText = widgets[0]
  }

  return next
}

export function readIntWidget(widgets: unknown[], index: number, fallback = 0): number {
  const value = widgets[index]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Best-effort bounds for an untyped integer widget. See the call site. */
function intRange(title: string): { min: number; max: number; step: number } {
  const normalized = title.toLowerCase()
  const has = (word: string) => normalized.includes(word)

  if (has('frame')) return { min: 1, max: 120, step: 1 }
  if (has('duration')) return { min: 1, max: 60, step: 1 }
  if (has('width') || has('height')) return { min: 16, max: 4096, step: 8 }
  return { min: 16, max: 4096, step: 1 }
}
