import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { isVectorDiagram, type VectorDiagram } from '../../../core/graph/vectorDiagram'
import VectorDiagramView from './VectorDiagramView.svelte'

describe('vector diagrams', () => {
  it('keeps labels selectable, toggles nodes, and scopes internal references', async () => {
    const diagram: VectorDiagram = { viewBox:'0 0 200 80', elements:[{tag:'g',label:'Start',children:[
      {tag:'rect',attrs:{id:'box',width:'100',height:'40',fill:'surface-teal',onclick:'invalid',style:'invalid'}},
      {tag:'text',text:'Start',attrs:{fill:'ink'}},
    ]}] }
    const { getByRole, container } = render(VectorDiagramView,{diagram,label:'Process'})
    const node = getByRole('button',{name:'Start'})
    await fireEvent.keyDown(node,{key:'Enter'})
    expect(node.getAttribute('aria-pressed')).toBe('true')
    await fireEvent.keyDown(node,{key:'Escape'})
    expect(node.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('rect')?.id).toMatch(/-box$/)
    expect(container.querySelector('rect')?.hasAttribute('onclick')).toBe(false)
    expect(container.querySelector('rect')?.hasAttribute('style')).toBe(false)
    expect(container.querySelector('svg text')?.textContent).toBe('Start')
    expect(isVectorDiagram({viewBox:'0 0 20 20',elements:[{tag:'script'}]})).toBe(false)
  })
})
