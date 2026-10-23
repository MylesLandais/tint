import { expect,test } from '@playwright/test'
test('shared native file input exposes its original name, permits repeat choices and clears removal',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/#/components/form-fields')
 const input=page.getByLabel('Cover artwork',{exact:true});const file={name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('synthetic image')}
 await input.setInputFiles(file);await expect(page.getByText('Original file: synthetic.png',{exact:false})).toBeVisible();expect(await input.inputValue()).toBe('')
 await page.getByRole('button',{name:'Remove synthetic.png',exact:true}).click();await expect(page.getByText('Original file: none',{exact:false})).toBeVisible();await input.setInputFiles(file);await expect(page.getByRole('button',{name:'Remove synthetic.png',exact:true})).toBeVisible();expect(errors).toEqual([])
})
test('shared JSON preview uses native Tint disclosure and restores full text',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/#/components/code')
 const region=page.getByRole('region',{name:'Bounded evidence',exact:true});await expect(region).toContainText('…');expect((await region.textContent())!.length).toBe(122)
 const button=page.getByRole('button',{name:/Show all/});await button.focus();await button.press('Enter');await expect(region).not.toContainText('…');await page.getByRole('button',{name:'Show less',exact:true}).click();expect((await region.textContent())!.length).toBe(122);expect(errors).toEqual([])
})
