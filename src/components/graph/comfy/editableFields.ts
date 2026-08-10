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
    const normalized = key.toLowerCase()
    fields.push({
      role: 'int',
      key,
      widgetIndex: 0,
      label: key,
      min: normalized.includes('frame') || normalized.includes('duration') ? 1 : 16,
      max: normalized.includes('frame') ? 120 : normalized.includes('duration') ? 60 : 4096,
      step: normalized.includes('width') || normalized.includes('height') ? 8 : 1,
    })
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
      label: classType === 'LoadImage' ? 'Reference image' : 'Reference image',
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
