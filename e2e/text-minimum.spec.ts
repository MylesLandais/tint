import { expect, test } from '@playwright/test'
test('native minimum length qualifies user input without rewriting host state',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto('/#/components/form-fields')
 const input=page.getByRole('textbox',{name:'Bounded text',exact:true})
 await expect(input).toHaveAttribute('minlength','3');await expect(input).toHaveAttribute('maxlength','12')
 await input.pressSequentially('ab');expect(await input.evaluate(el=>(el as HTMLInputElement).validity.tooShort)).toBe(true)
 await input.pressSequentially('c');expect(await input.evaluate(el=>(el as HTMLInputElement).checkValidity())).toBe(true)
 await input.fill('');expect(await input.evaluate(el=>(el as HTMLInputElement).checkValidity())).toBe(true)
 expect(errors).toEqual([])
})
