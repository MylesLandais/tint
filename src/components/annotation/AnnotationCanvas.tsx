import { useEffect, useId, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import type { Point, VectorGeometry } from './geometry'

export type RegionGeometry = VectorGeometry | { kind: 'mask'; url: string }
export type AnnotationRegion = { id: string; label: string; geometry: RegionGeometry; tone?: 'proposal' | 'accepted' | 'draft'; hidden?: boolean }
export type AnnotationTool = 'select' | 'box' | 'polygon' | 'brush' | 'erase'
export type AnnotationCanvasProps = {
  image: { id: string; url: string; width: number; height: number }
  regions: readonly AnnotationRegion[]
  selectedId?: string | null
  tool: AnnotationTool
  zoom?: number
  brushSize?: number
  disabled?: boolean
  onSelect(id: string | null): void
  onCreate(geometry: VectorGeometry): void
  onGeometryChange(id: string, geometry: VectorGeometry): void
  onMaskChange?(blob: Blob): void
  onDelete?(id: string): void
  className?: string
}

const clamp = (n: number) => Math.max(0, Math.min(1,n))

/** Controlled annotation interaction. The host owns frames, labels, review and artifact storage. */
export function AnnotationCanvas({ image, regions, selectedId, tool, zoom = 1, brushSize = 20, disabled,
  onSelect, onCreate, onGeometryChange, onMaskChange, onDelete, className }: AnnotationCanvasProps) {
  const maskPrefix = useId()
  const pendingBox = useRef<VectorGeometry | null>(null)
  const pendingPreview = useRef<{id:string;geometry:VectorGeometry}|null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const gesture = useRef<{ start: Point; region?: AnnotationRegion; vertex?: number; corner?: boolean } | null>(null)
  const [box, setBox] = useState<VectorGeometry | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [preview, setPreview] = useState<{ id: string; geometry: VectorGeometry } | null>(null)
  const selected = regions.find(r => r.id === selectedId)
  const maskUrl = selected?.geometry.kind === 'mask' ? selected.geometry.url : undefined
  const painting = tool === 'brush' || tool === 'erase'
  useEffect(() => { setPoints([]); setBox(null); setPreview(null); gesture.current = null }, [image.id, tool])
  useEffect(() => {
    const target = canvas.current
    const context = target?.getContext('2d')
    if (!target || !context) return
    let active = true
    context.clearRect(0,0,image.width,image.height)
    if (maskUrl) {
      const bitmap = new Image()
      bitmap.crossOrigin = 'anonymous'
      bitmap.onload = () => { if (active) context.drawImage(bitmap,0,0,image.width,image.height) }
      bitmap.src = maskUrl
    }
    return () => { active = false }
  }, [image.id, image.width, image.height, maskUrl, selectedId])

  const position = (e: PointerEvent) => {
    const rect = svg.current!.getBoundingClientRect()
    return { x: clamp((e.clientX-rect.left)/rect.width), y: clamp((e.clientY-rect.top)/rect.height) }
  }
  const draw = (from: Point, to: Point) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = 'white'; ctx.lineWidth = brushSize; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(from.x*image.width,from.y*image.height)
    ctx.lineTo(to.x*image.width,to.y*image.height); ctx.stroke()
  }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled || e.button !== 0) return
    e.currentTarget.focus()
    const p = position(e)
    if (tool === 'polygon') { setPoints(current => [...current,p]); return }
    const element = e.target as SVGElement
    const id = element.closest('[data-region-id]')?.getAttribute('data-region-id')
    const region = regions.find(r => r.id === id)
    if (tool === 'select') onSelect(region?.id ?? null)
    const vertex = element.getAttribute('data-vertex')
    gesture.current = { start: p, region, vertex: vertex == null ? undefined : Number(vertex), corner: element.hasAttribute('data-corner') }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (painting) draw(p, { x:p.x+.00001,y:p.y+.00001 })
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current
    if (!current || disabled) return
    const p = position(e), start = current.start
    if (painting) { draw(start,p); current.start=p; return }
    if (tool === 'box') {
      const next:VectorGeometry={ kind:'box',x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),width:Math.abs(p.x-start.x),height:Math.abs(p.y-start.y) }
      pendingBox.current=next;setBox(next)
    } else if (tool === 'select' && current.region && current.region.geometry.kind !== 'mask') {
      const g=current.region.geometry
      let next: VectorGeometry
      if (g.kind === 'polygon') {
        const dx=Math.max(-Math.min(...g.points.map(v=>v.x)),Math.min(1-Math.max(...g.points.map(v=>v.x)),p.x-start.x))
        const dy=Math.max(-Math.min(...g.points.map(v=>v.y)),Math.min(1-Math.max(...g.points.map(v=>v.y)),p.y-start.y))
        next={ kind:'polygon',points:g.points.map((v,i)=>current.vertex == null ? {x:v.x+dx,y:v.y+dy} : i===current.vertex ? p : v) }
      } else if (current.corner) next={...g,width:Math.max(.0001,p.x-g.x),height:Math.max(.0001,p.y-g.y)}
      else next={...g,x:Math.max(0,Math.min(1-g.width,g.x+p.x-start.x)),y:Math.max(0,Math.min(1-g.height,g.y+p.y-start.y))}
      pendingPreview.current={id:current.region.id,geometry:next};setPreview(pendingPreview.current)
    }
  }
  const up = (e: PointerEvent<SVGSVGElement>) => {
    if (!gesture.current) return
    if (painting && onMaskChange) canvas.current?.toBlob(blob => { if (blob) onMaskChange(blob) },'image/png')
    const box=pendingBox.current,preview=pendingPreview.current
    if (box?.kind === 'box' && box.width>.0001 && box.height>.0001) onCreate(box)
    if (preview) onGeometryChange(preview.id,preview.geometry)
    gesture.current=null; pendingBox.current=null;pendingPreview.current=null;setBox(null); setPreview(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const key = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Escape') { setPoints([]); gesture.current=null; pendingBox.current=null;pendingPreview.current=null;setBox(null); setPreview(null) }
    if (e.key === 'Enter' && points.length>=3) { onCreate({kind:'polygon',points}); setPoints([]); e.preventDefault() }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && tool==='select') { onDelete?.(selectedId); e.preventDefault() }
  }
  const shape = (g: RegionGeometry, id = "preview") => g.kind==='box'
    ? <rect x={g.x*image.width} y={g.y*image.height} width={g.width*image.width} height={g.height*image.height}/>
    : g.kind==='polygon' ? <polygon points={g.points.map(p=>`${p.x*image.width},${p.y*image.height}`).join(' ')}/>
    : <><defs><mask id={`${maskPrefix}-${id}`}><image href={g.url} width={image.width} height={image.height}/></mask></defs><rect width={image.width} height={image.height} fill="var(--tint-accent)" stroke="none" opacity={.45} mask={`url(#${maskPrefix}-${id})`}/></>
  const rendered = regions.filter(r=>!r.hidden)
  return <div className={className} data-annotation-canvas="">
    <div style={{position:'relative',width:image.width*zoom,height:image.height*zoom,margin:'auto'}}>
      <img src={image.url} alt="Annotation source frame" draggable={false} style={{position:'absolute',width:'100%',height:'100%'}}/>
      <canvas ref={canvas} width={image.width} height={image.height} aria-hidden="true" style={{position:'absolute',width:'100%',height:'100%',opacity: painting ? .5 : 0,mixBlendMode:'screen',pointerEvents:'none'}}/>
      <svg ref={svg} viewBox={`0 0 ${image.width} ${image.height}`} width="100%" height="100%" tabIndex={0}
        role="application" aria-label="Annotation editor. Draw regions; Enter completes a polygon; Escape cancels."
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{gesture.current=null;setBox(null);setPreview(null)}} onKeyDown={key}
        style={{position:'relative',touchAction:'none',cursor:tool==='select'?'default':'crosshair'}}>
        {rendered.map(region => <g key={region.id} data-region-id={region.id} aria-label={region.label}
          stroke={region.id===selectedId?'var(--tint-accent)':region.tone==='accepted'?'var(--tint-success)':'var(--tint-info)'} strokeWidth={2/zoom}
          fill="transparent" strokeDasharray={region.tone==='proposal'?`${6/zoom} ${4/zoom}`:undefined}>
          {shape(preview?.id===region.id?preview.geometry:region.geometry,region.id)}
          {region.id===selectedId && tool==='select' && region.geometry.kind==='polygon' ? region.geometry.points.map((p,i)=><circle key={i} data-vertex={i} cx={p.x*image.width} cy={p.y*image.height} r={5/zoom} fill="var(--tint-accent)"/>) : null}
          {region.id===selectedId && tool==='select' && region.geometry.kind==='box' ? <rect data-corner="" x={(region.geometry.x+region.geometry.width)*image.width-5/zoom} y={(region.geometry.y+region.geometry.height)*image.height-5/zoom} width={10/zoom} height={10/zoom} fill="var(--tint-accent)"/> : null}
        </g>)}
        {box ? <g stroke="var(--tint-accent)" fill="transparent" strokeWidth={2/zoom}>{shape(box)}</g>:null}
        {points.length ? <polyline points={points.map(p=>`${p.x*image.width},${p.y*image.height}`).join(' ')} stroke="var(--tint-accent)" fill="transparent" strokeWidth={2/zoom}/>:null}
      </svg>
    </div>
  </div>
}
