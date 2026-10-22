import { render,screen,fireEvent } from '@testing-library/svelte'
import { expect,it,vi } from 'vitest'
import Fixture from './WorkspaceTabsFixture.svelte'
it('renders data-driven session content and preserves per-tab snippets',async()=>{
 const onChange=vi.fn()
 const view=render(Fixture,{value:'alpha',onChange})
 expect(screen.getByRole('tabpanel',{name:'Alpha'})).toHaveTextContent('alpha session content')
 await fireEvent.click(screen.getByRole('tab',{name:'Beta'}))
 expect(onChange).toHaveBeenCalledWith('beta')
 await view.rerender({value:'beta',onChange})
 expect(screen.getByRole('tabpanel',{name:'Beta'})).toHaveTextContent('Owned tab content')
 expect(screen.queryByText('beta session content')).not.toBeInTheDocument()
})

it('keeps adjacent actions outside the tablist while retaining tab keyboard navigation', async () => {
 const onChange=vi.fn()
 render(Fixture,{value:'alpha',onChange,withActions:true})
 const action=screen.getByRole('button',{name:'Pin tools'})
 expect(action.closest('[role="tablist"]')).toBeNull()
 await fireEvent.keyDown(screen.getByRole('tab',{name:'Alpha'}),{key:'ArrowRight'})
 expect(onChange).toHaveBeenCalledWith('beta')
 expect(screen.getByRole('tab',{name:'Beta'})).toHaveFocus()
})
