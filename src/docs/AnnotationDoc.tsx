import { useState } from 'react'
import { AnnotationCanvas, type AnnotationRegion, type AnnotationTool } from '../components/annotation'
import { Button } from '../components/button'
import { DocsDemo, DocsFooter, DocsPage, DocsSection } from './components/DocsPage'

const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400"><rect width="720" height="400" fill="#d3dbd5"/><path d="M0 300L180 150L360 310L570 80L720 230V400H0Z" fill="#6f8c7a"/><circle cx="155" cy="90" r="34" fill="#f1df9a"/></svg>')}`
export function AnnotationDoc() {
  const [regions,setRegions]=useState<AnnotationRegion[]>([{id:'ridge',label:'Ridge',geometry:{kind:'box',x:.55,y:.12,width:.35,height:.7},tone:'proposal'}])
  const [selectedId,onSelect]=useState<string|null>(null)
  const [tool,setTool]=useState<AnnotationTool>('select')
  return <DocsPage route="components/annotation" title="Annotation Canvas" intro="Controlled source-frame geometry for curation and review workspaces. The host owns evidence, labels, history and persistence.">
    <DocsSection id="preview" title="Preview"><DocsDemo code={'<AnnotationCanvas image={frame} regions={regions} tool={tool}\n  onSelect={select} onCreate={create} onGeometryChange={edit} />'}>
      <div className="flex gap-2 p-3">{(['select','box','polygon'] as const).map(t=><Button key={t} size="sm" variant={t===tool?'primary':'ghost'} onClick={()=>setTool(t)}>{t}</Button>)}</div>
      <div className="overflow-auto"><AnnotationCanvas image={{id:'landscape',url:source,width:720,height:400}} regions={regions} selectedId={selectedId} tool={tool} onSelect={onSelect}
        onCreate={geometry=>{const id=crypto.randomUUID();setRegions([...regions,{id,label:'Region',geometry}]);onSelect(id);setTool('select')}}
        onGeometryChange={(id,geometry)=>setRegions(regions.map(r=>r.id===id?{...r,geometry}:r))} onDelete={id=>setRegions(regions.filter(r=>r.id!==id))}/></div>
    </DocsDemo></DocsSection>
    <DocsSection id="usage" title="Usage"><p>Coordinates are normalized to the orientation-corrected display frame. Drag boxes, move regions, resize the selected box, or adjust polygon vertices. Enter completes a polygon; Escape cancels a gesture. Brush and erase emit a PNG Blob through onMaskChange. Black mask pixels are background; white pixels are foreground. The caller stores artifacts and supplies their URLs.</p><p>Frame identity changes reset active gestures. The host supplies zoom and immutable frame references. Review decisions, keyboard undo, track visibility and occlusion, model provenance, source authorization and revision conflicts belong to the consuming application.</p></DocsSection>
    <DocsSection id="api" title="API"><pre className="overflow-auto rounded-lg bg-tint-surface p-4 text-xs"><code>{"import { AnnotationCanvas, interpolateGeometry, splitTrack, joinTracks } from 'tint/annotation'\n\nAnnotationCanvas(props: AnnotationCanvasProps)\n\nimage: { id, url, width, height }\nregions: readonly AnnotationRegion[]\ntool: 'select' | 'box' | 'polygon' | 'brush' | 'erase'\nselectedId?: string | null\nzoom?: number\nbrushSize?: number\ndisabled?: boolean\nonSelect(id): void\nonCreate(geometry): void\nonGeometryChange(id, geometry): void\nonMaskChange?(blob): void\nonDelete?(id): void"}</code></pre><p>Interpolation accepts boxes or polygons with matching vertex counts. Joining tracks rejects duplicate timestamps. The application validates geometry and applies its own interpolation and review policy.</p></DocsSection><DocsFooter/>
  </DocsPage>
}
