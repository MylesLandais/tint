import {useState} from 'react'
import {fireEvent,render,screen,within} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
import {GroupEditor,type GroupFields} from './GroupEditor'
const value:GroupFields={name:'Team',members:['a','missing','b'],mutedMembers:['missing'],strategy:0,promptMode:1,allowSelfReplies:false,delay:5,prefix:'original prefix',suffix:'original suffix',favorite:false}
const characters=[{value:'a',label:'Aster'},{value:'b',label:'Birch'},{value:'c',label:'Cedar'}]
const strategies=[{value:0,label:'Natural'},{value:1,label:'Ordered'}]
const promptModes=[{value:0,label:'Current character'},{value:1,label:'Join characters'}]
it('preserves missing members, muted state and hidden templates through ordered edits',()=>{
 const changes=vi.fn()
 function Demo(){const [draft,setDraft]=useState(value);return <GroupEditor value={draft} characters={characters} strategies={strategies} promptModes={promptModes} onValueChange={next=>{changes(next);setDraft(next)}}/>}
 render(<Demo/>);
 const move=screen.getByRole('button',{name:'Move Birch up'});move.focus();fireEvent.click(move)
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'Move Birch up'}))
 expect(changes.mock.lastCall?.[0].members).toEqual(['a','b','missing'])
 fireEvent.click(screen.getByLabelText('Mute Aster'))
 fireEvent.change(screen.getByLabelText('Character prompts'),{target:{value:'0'}})
 expect(screen.queryByLabelText('Joined prompt prefix')).not.toBeInTheDocument()
 fireEvent.change(screen.getByLabelText('Group name'),{target:{value:'Revised'}})
 expect(changes.mock.lastCall?.[0]).toMatchObject({name:'Revised',mutedMembers:['missing','a'],prefix:value.prefix,suffix:value.suffix})
 fireEvent.click(screen.getByRole('button',{name:'Add member'}))
 expect(changes.mock.lastCall?.[0].members).toEqual(['a','b','missing','c'])
 fireEvent.click(screen.getByRole('button',{name:'Remove missing'}))
 expect(changes.mock.lastCall?.[0].mutedMembers).toEqual(['a'])
 expect(value.members).toEqual(['a','missing','b'])
})
it('keeps duplicate references visible and isolates accessible IDs between editors',()=>{
 const changes=vi.fn()
 const props={characters,strategies,promptModes,onValueChange:changes}
 render(<><GroupEditor {...props} value={{...value,members:['a','a'],strategy:87}} disabled/><GroupEditor {...props} value={value}/></>)
 const editors=screen.getAllByRole('group',{name:'Group details'})
 expect(within(editors[0]).getByLabelText('Speaker selection')).toHaveValue('87')
 expect(within(editors[0]).getAllByRole('button',{name:'Remove Aster'})).toHaveLength(2)
 for(const button of within(editors[0]).getAllByRole('button'))expect(button).toBeDisabled()
 const names=screen.getAllByLabelText('Group name');expect(names[0].id).not.toBe(names[1].id)
 fireEvent.change(within(editors[1]).getByLabelText('Automatic reply delay (seconds)'),{target:{value:''}})
 expect(changes.mock.lastCall?.[0].delay).toBe('')
})
