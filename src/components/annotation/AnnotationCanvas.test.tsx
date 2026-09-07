import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AnnotationCanvas } from './AnnotationCanvas'
import { interpolateGeometry, joinTracks } from './geometry'

beforeEach(()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({clearRect:vi.fn()} as unknown as CanvasRenderingContext2D)
  vi.spyOn(SVGElement.prototype,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:200,height:100} as DOMRect)
  SVGElement.prototype.setPointerCapture=vi.fn()
  SVGElement.prototype.hasPointerCapture=()=>false
})
it('emits normalized box coordinates under display zoom',()=>{
  const onCreate=vi.fn()
  render(<AnnotationCanvas image={{id:'a',url:'frame.png',width:400,height:200}} regions={[]} tool="box" zoom={.5} onSelect={()=>{}} onGeometryChange={()=>{}} onCreate={onCreate}/>)
  const editor=screen.getByRole('application')
  fireEvent.pointerDown(editor,{button:0,pointerId:1,clientX:20,clientY:10})
  fireEvent.pointerMove(editor,{pointerId:1,clientX:100,clientY:60})
  fireEvent.pointerUp(editor,{pointerId:1,clientX:100,clientY:60})
  expect(onCreate).toHaveBeenCalledWith({kind:'box',x:.1,y:.1,width:.4,height:.5})
})
it('requires explicit polygon completion and cancels with Escape',()=>{
  const onCreate=vi.fn()
  render(<AnnotationCanvas image={{id:'a',url:'frame.png',width:200,height:100}} regions={[]} tool="polygon" onSelect={()=>{}} onGeometryChange={()=>{}} onCreate={onCreate}/>)
  const editor=screen.getByRole('application')
  for(const [x,y] of [[20,10],[100,10],[100,60]])fireEvent.pointerDown(editor,{button:0,clientX:x,clientY:y})
  expect(onCreate).not.toHaveBeenCalled()
  fireEvent.keyDown(editor,{key:'Escape'})
  fireEvent.keyDown(editor,{key:'Enter'})
  expect(onCreate).not.toHaveBeenCalled()
  for(const [x,y] of [[20,10],[100,10],[100,60]])fireEvent.pointerDown(editor,{button:0,clientX:x,clientY:y})
  fireEvent.keyDown(editor,{key:'Enter'})
  expect(onCreate).toHaveBeenCalledWith({kind:'polygon',points:[{x:.1,y:.1},{x:.5,y:.1},{x:.5,y:.6}]})
})
it('does not interpolate incompatible topology or silently join overlaps',()=>{
  expect(interpolateGeometry({kind:'box',x:0,y:0,width:.2,height:.2},{kind:'box',x:.4,y:.6,width:.4,height:.4},.5)).toEqual({kind:'box',x:.2,y:.3,width:.30000000000000004,height:.30000000000000004})
  expect(interpolateGeometry({kind:'polygon',points:[]},{kind:'polygon',points:[{x:0,y:0}]},.5)).toBeNull()
  expect(()=>joinTracks([{timestamp:10}],[{timestamp:10}])).toThrow('overlap')
})
