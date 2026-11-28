<script lang="ts">
  import { Button } from "../button"
  import { isVectorDiagram, type VectorDiagram, type VectorElement } from '../../../core/graph/vectorDiagram'

  let { diagram, label }: { diagram: VectorDiagram; label: string } = $props()
  const prefix = $props.id()
  let enlarged = $state(false)
  const width = $derived(Math.min(2200,Math.max(240,Number(diagram.viewBox.split(/[\s,]+/)[2]) || 600)))
  const ns = 'http://www.w3.org/2000/svg'
  const lengths = new Set('x y x1 y1 x2 y2 dx dy width height r rx ry cx cy refX refY markerWidth markerHeight stroke-width stroke-opacity fill-opacity opacity font-size'.split(' '))
  const fragment = /^[A-Za-z_][\w.:-]{0,160}$/
  function attribute(name: string, value: string): string | undefined {
    if (name === 'id' && fragment.test(value)) return prefix + '-' + value
    if (['marker-end','marker-start','clip-path'].includes(name)) {
      const id = /^url\(#([^)]*)\)$/.exec(value)?.[1]
      if (id && fragment.test(id)) return 'url(#' + prefix + '-' + id + ')'
    }
    if (name === 'fill' || name === 'stroke') {
      if (value === 'none') return value
      if (/^(ink|line|surface)(-(teal|amber|blue|violet|green|red))?$/.test(value)) return 'var(--diagram-' + value + ')'
    }
    if (lengths.has(name) && /^[-+.\deE]+(?:px|%)?$/.test(value)) return value
    if (['points','viewBox','stroke-dasharray'].includes(name) && /^[\dEe.,+\s-]+$/.test(value)) return value
    if (name === 'd' && /^[MmZzLlHhVvCcSsQqTtAa\dEe+.,\s-]+$/.test(value)) return value
    if (name === 'transform' && /^(?:(?:translate|scale|matrix|rotate|skewX|skewY)\([\dEe+.,\s-]+\)\s*)+$/.test(value)) return value
    const choices: Record<string, string[]> = {
      'text-anchor': ['start','middle','end'], 'dominant-baseline': ['central','middle','auto','alphabetic','hanging'],
      'font-weight': ['normal','bold','400','500','600','650','700'], 'stroke-linecap': ['round','butt','square'],
      'stroke-linejoin': ['round','miter','bevel'], 'fill-rule': ['evenodd','nonzero'], orient: ['auto','auto-start-reverse'],
      markerUnits: ['userSpaceOnUse','strokeWidth'],
    }
    if (Object.hasOwn(choices, name) && choices[name].includes(value)) return value
  }

  function draw(svg: SVGSVGElement, model: VectorDiagram) {
    function build(item: VectorElement): Node {
      if (item.tag === '#text') return document.createTextNode(item.text ?? '')
      const el = document.createElementNS(ns, item.tag)
      for (const [name, value] of Object.entries(item.attrs ?? {})) {
        const safe = attribute(name, value)
        if (safe !== undefined) el.setAttribute(name, safe)
      }
      if (item.label && (item.tag === 'g' || item.tag === 'text')) {
        el.setAttribute('data-diagram-node', '')
        el.setAttribute('tabindex', '0')
        el.setAttribute('role', 'button')
        el.setAttribute('aria-label', item.label)
        el.setAttribute('aria-pressed', 'false')
      }
      if (item.text && (item.tag === 'text' || item.tag === 'tspan')) el.textContent = item.text
      for (const child of item.children ?? []) el.appendChild(build(child))
      return el
    }
    function render(next: VectorDiagram) {
      if (isVectorDiagram(next)) svg.replaceChildren(...next.elements.map(build))
      else svg.replaceChildren()
    }
    function toggle(node: Element | null) {
      const active = svg.querySelector('[aria-pressed="true"]')
      active?.setAttribute('aria-pressed', 'false')
      if (node && node !== active) node.setAttribute('aria-pressed', 'true')
    }
    function activate(event: MouseEvent | KeyboardEvent) {
      const target = event.target instanceof Element ? event.target.closest('[data-diagram-node]') : null
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') { toggle(null); return }
        if (!target || !['Enter', ' '].includes(event.key)) return
        event.preventDefault()
      } else if (!window.getSelection()?.isCollapsed) return
      toggle(target)
    }
    render(model)
    svg.addEventListener('click', activate)
    svg.addEventListener('keydown', activate)
    return { update: render, destroy() { svg.removeEventListener('click', activate); svg.removeEventListener('keydown', activate) } }
  }
</script>

<div class="drawing">
  <div class="viewport">
    <svg use:draw={diagram} style:width={enlarged ? `max(100%, ${width * 1.5}px)` : `min(100%, ${width}px)`} viewBox={diagram.viewBox} aria-label={label} role="group"></svg>
  </div>
  <Button variant="ghost" size="sm" aria-pressed={enlarged} onclick={() => enlarged = !enlarged}>{enlarged ? "Fit diagram" : "Enlarge diagram"}</Button>
</div>

<style>
  .drawing {
    --diagram-ink: var(--tint-ink);
    --diagram-line: light-dark(#72777e,#9b9fa6);
    --diagram-surface: light-dark(#f2f3f4,#303338);
    --diagram-ring: var(--tint-focus);
    --diagram-line-teal: light-dark(#187c79,#69c7be); --diagram-surface-teal: light-dark(#e2f4f1,#193d39);
    --diagram-line-amber: light-dark(#976316,#e4b466); --diagram-surface-amber: light-dark(#fff1d9,#473821);
    --diagram-line-blue: light-dark(#54789f,#93b7de); --diagram-surface-blue: light-dark(#e9eff8,#293a4c);
    --diagram-line-violet: light-dark(#8263a9,#bb9fdd); --diagram-surface-violet: light-dark(#f1ebfa,#3c3048);
    --diagram-line-green: light-dark(#397c4a,#8acb98); --diagram-surface-green: light-dark(#e8f4e8,#2a3e2c);
    --diagram-line-red: light-dark(#a55556,#e39e9b); --diagram-surface-red: light-dark(#faeaea,#473233);
    --diagram-ink-teal: var(--diagram-ink); --diagram-ink-amber: var(--diagram-ink); --diagram-ink-blue: var(--diagram-ink);
    --diagram-ink-violet: var(--diagram-ink); --diagram-ink-green: var(--diagram-ink); --diagram-ink-red: var(--diagram-ink);
    overflow-x: auto; max-width: 100%; padding: .75rem; border: 1px solid var(--tint-border);
    border-radius: .75rem; background: var(--tint-panel); color: var(--diagram-ink);
  }
  .viewport { overflow-x: auto; padding: 4px; }
  svg { display: block; max-width: none; margin: auto; height: auto; fill: var(--diagram-ink); }
  svg :global(text) { font-family: inherit; user-select: text; }
  svg :global([data-diagram-node]) { cursor: pointer; }
  svg :global([data-diagram-node]:is(:hover,:focus-visible,[aria-pressed=true])) {
    --diagram-line: var(--diagram-ring); --diagram-line-teal: var(--diagram-ring); --diagram-line-amber: var(--diagram-ring);
    --diagram-line-blue: var(--diagram-ring); --diagram-line-violet: var(--diagram-ring);
    --diagram-line-green: var(--diagram-ring); --diagram-line-red: var(--diagram-ring);
    outline: 2px solid var(--diagram-ring); outline-offset: 2px;
  }
  svg :global([data-diagram-node][aria-pressed=true]) { filter: drop-shadow(0 0 2px var(--diagram-ring)); }
</style>
