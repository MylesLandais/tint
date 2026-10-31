import { expect, test } from '@playwright/test'

test('horizontal route navigation wraps and preserves native keyboard links at 390px',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/#/components/navigation')
 const nav=page.getByRole('navigation',{name:'Example routes'})
 await expect(nav).toHaveAttribute('data-orientation','horizontal')
 const first=nav.getByRole('link',{name:'Navigation',exact:true}),second=nav.getByRole('link',{name:'Table',exact:true})
 await expect(first).toHaveAttribute('aria-current','page');await expect(second).toHaveAttribute('href','#/components/table')
 const boxes=await nav.getByRole('link').evaluateAll(links=>links.map(link=>{const r=link.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top}}))
 expect(boxes.every(b=>b.left>=0&&b.right<=390)).toBe(true);expect(boxes[1].left).toBeGreaterThan(boxes[0].left)
 await first.focus();await page.keyboard.press('Tab');await expect(second).toBeFocused()
 await page.keyboard.press('Enter');await expect(page).toHaveURL(/components\/table/)
})

test('graph projections expose unknown and cancelled outcomes consistently',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#/components/graph')
 const graph=page.locator('[data-tint-graph-view]'),force=page.locator('[data-tint-force-graph]'),timeline=page.locator('[data-tint-timeline]')
 await expect(graph.locator('[data-graph-node][data-status="unknown"]')).toHaveCount(1)
 await expect(graph.locator('[data-graph-node][data-status="cancelled"]')).toHaveCount(1)
 await expect(force.getByRole('button',{name:/Enrich entities \(script, unknown\)/})).toBeVisible()
 await expect(force.getByRole('button',{name:/Score candidates \(script, cancelled\)/})).toBeVisible()
 await expect(timeline.getByRole('button',{name:'Enrich entities (unknown)'})).toBeVisible()
 await expect(timeline.getByRole('button',{name:'Score candidates (cancelled)'})).toBeVisible()
})
