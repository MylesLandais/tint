<script lang="ts">
  import { boxFromPoints, drawMaskStroke, loadMask, movedGeometry, normalizedPoint,
    type AnnotationImage, type AnnotationRegion, type AnnotationTool,
    type Point, type RegionGeometry, type VectorGeometry } from '../../../core/annotation'

  type Props = {
    image: AnnotationImage
    regions: readonly AnnotationRegion[]
    selectedId?: string | null
    tool: AnnotationTool
    zoom?: number
    brushSize?: number
    disabled?: boolean
    onSelect: (id: string | null) => void
    onCreate: (geometry: VectorGeometry) => void
    onGeometryChange: (id: string, geometry: VectorGeometry) => void
    onMaskChange?: (blob: Blob) => void
    onDelete?: (id: string) => void
    class?: string
  }

  let {
    image, regions, selectedId = null, tool, zoom = 1, brushSize = 20,
    disabled = false, onSelect, onCreate, onGeometryChange, onMaskChange,
    onDelete, class: className,
  }: Props = $props()
  const maskPrefix = $props.id()
  let svg = $state<SVGSVGElement | null>(null)
  let stage = $state<HTMLDivElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  let box = $state<VectorGeometry | null>(null)
  let points = $state<Point[]>([])
  let preview = $state<{ id: string; geometry: VectorGeometry } | null>(null)
  let gesture: { start: Point; region?: AnnotationRegion; vertex?: number; corner?: boolean } | null = null
  let selected = $derived(regions.find((region) => region.id === selectedId))
  let maskUrl = $derived(selected?.geometry.kind === 'mask' ? selected.geometry.url : undefined)
  let painting = $derived(tool === 'brush' || tool === 'erase')
  let rendered = $derived(regions.filter((region) => !region.hidden))
  let lastGestureKey = ''

  $effect(() => {
    const key = `${image.id}:${tool}`
    if (key === lastGestureKey) return
    lastGestureKey = key
    points = []; box = null; preview = null; gesture = null
  })
  $effect(() => {
    if (canvas) return loadMask(canvas, image, maskUrl)
  })

  function position(event: PointerEvent): Point {
    return normalizedPoint(event.clientX, event.clientY, svg!.getBoundingClientRect())
  }
  function draw(from: Point, to: Point) {
    if (canvas) drawMaskStroke(canvas, image, from, to, brushSize, tool === 'erase')
  }
  function down(event: PointerEvent) {
    if (disabled || event.button !== 0 || !svg || !stage) return
    stage.focus()
    const point = position(event)
    if (tool === 'polygon') { points = [...points, point]; return }
    const target = event.target instanceof Element ? event.target : null
    const id = target?.closest('[data-region-id]')?.getAttribute('data-region-id')
    const region = regions.find((item) => item.id === id)
    if (tool === 'select') onSelect(region?.id ?? null)
    const vertex = target?.getAttribute('data-vertex')
    gesture = { start: point, region, vertex: vertex == null ? undefined : Number(vertex), corner: target?.hasAttribute('data-corner') }
    stage.setPointerCapture?.(event.pointerId)
    if (painting) draw(point, { x: point.x + .00001, y: point.y + .00001 })
  }
  function move(event: PointerEvent) {
    if (!gesture || disabled) return
    const point = position(event)
    if (painting) { draw(gesture.start, point); gesture.start = point; return }
    if (tool === 'box') box = boxFromPoints(gesture.start, point)
    else if (tool === 'select' && gesture.region && gesture.region.geometry.kind !== 'mask') {
      preview = { id: gesture.region.id, geometry: movedGeometry(gesture.region.geometry, gesture.start, point, gesture.vertex, gesture.corner) }
    }
  }
  function up(event: PointerEvent) {
    if (!gesture) return
    if (painting && onMaskChange && canvas) canvas.toBlob((blob) => { if (blob) onMaskChange?.(blob) }, 'image/png')
    if (box?.kind === 'box' && box.width > .0001 && box.height > .0001) onCreate(box)
    if (preview) onGeometryChange(preview.id, preview.geometry)
    gesture = null; box = null; preview = null
    if (stage?.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId)
  }
  function cancel() { gesture = null; box = null; preview = null }
  function key(event: KeyboardEvent) {
    if (disabled) return
    if (event.key === 'Escape') { points = []; cancel() }
    if (event.key === 'Enter' && points.length >= 3) {
      onCreate({ kind: 'polygon', points }); points = []; event.preventDefault()
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId && tool === 'select') {
      onDelete?.(selectedId); event.preventDefault()
    }
  }
</script>

{#snippet shape(geometry: RegionGeometry, id: string)}
  {#if geometry.kind === 'box'}
    <rect x={geometry.x * image.width} y={geometry.y * image.height} width={geometry.width * image.width} height={geometry.height * image.height} />
  {:else if geometry.kind === 'polygon'}
    <polygon points={geometry.points.map((point) => `${point.x * image.width},${point.y * image.height}`).join(' ')} />
  {:else}
    <defs><mask id={`${maskPrefix}-${id}`}><image href={geometry.url} width={image.width} height={image.height} /></mask></defs>
    <rect width={image.width} height={image.height} fill="var(--tint-accent)" stroke="none" opacity="0.45" mask={`url(#${maskPrefix}-${id})`} />
  {/if}
{/snippet}

<div data-tint-annotation-canvas="" class={['annotation-canvas', className].filter(Boolean).join(' ')}>
  <!-- The drawing surface is one keyboard-operated application, with focus on its stage. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div bind:this={stage} class="stage" style:width={`${image.width * zoom}px`} style:height={`${image.height * zoom}px`}
    role="application" aria-label="Annotation editor. Draw regions; Enter completes a polygon; Escape cancels." tabindex="0"
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancel} onkeydown={key}>
    <img src={image.url} alt="Annotation source frame" draggable="false" />
    <canvas bind:this={canvas} width={image.width} height={image.height} aria-hidden="true" class:painting></canvas>
    <svg bind:this={svg} viewBox={`0 0 ${image.width} ${image.height}`} width="100%" height="100%" aria-hidden="true"
      style:cursor={tool === 'select' ? 'default' : 'crosshair'}>
      {#each rendered as region (region.id)}
        <g data-region-id={region.id} aria-label={region.label}
          stroke={region.id === selectedId ? 'var(--tint-accent)' : region.tone === 'accepted' ? 'var(--tint-success)' : 'var(--tint-info)'}
          stroke-width={2 / zoom} fill="transparent" stroke-dasharray={region.tone === 'proposal' ? `${6 / zoom} ${4 / zoom}` : undefined}>
          {@render shape(preview?.id === region.id ? preview.geometry : region.geometry, region.id)}
          {#if region.id === selectedId && tool === 'select' && region.geometry.kind === 'polygon'}
            {#each region.geometry.points as point, index (index)}<circle data-vertex={index} cx={point.x * image.width} cy={point.y * image.height} r={5 / zoom} fill="var(--tint-accent)" />{/each}
          {:else if region.id === selectedId && tool === 'select' && region.geometry.kind === 'box'}
            <rect data-corner="" x={(region.geometry.x + region.geometry.width) * image.width - 5 / zoom} y={(region.geometry.y + region.geometry.height) * image.height - 5 / zoom} width={10 / zoom} height={10 / zoom} fill="var(--tint-accent)" />
          {/if}
        </g>
      {/each}
      {#if box}<g stroke="var(--tint-accent)" fill="transparent" stroke-width={2 / zoom}>{@render shape(box, 'preview')}</g>{/if}
      {#if points.length}<polyline points={points.map((point) => `${point.x * image.width},${point.y * image.height}`).join(' ')} stroke="var(--tint-accent)" fill="transparent" stroke-width={2 / zoom} />{/if}
    </svg>
  </div>
  {#if rendered.length > 0}
    <ul class="region-list" aria-label="Annotation regions">
      {#each rendered as region (region.id)}
        <li><button type="button" aria-pressed={region.id === selectedId} {disabled}
          onclick={() => onSelect(region.id)}>{region.label}{region.tone ? ` · ${region.tone}` : ''}</button></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .annotation-canvas { max-width: 100%; overflow: auto; }
  .stage { position: relative; margin: auto; }
  img, canvas { position: absolute; width: 100%; height: 100%; }
  canvas { opacity: 0; mix-blend-mode: screen; pointer-events: none; }
  canvas.painting { opacity: .5; }
  svg { position: relative; touch-action: none; }
  .stage:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .region-list { display: flex; flex-wrap: wrap; gap: var(--tint-space-2); margin: var(--tint-space-2) 0 0; padding: 0; list-style: none; }
  .region-list button { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: var(--tint-space-1) var(--tint-space-2); background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; }
  .region-list button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent-soft); }
  .region-list button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .region-list button:disabled { opacity: .55; cursor: not-allowed; }
</style>
