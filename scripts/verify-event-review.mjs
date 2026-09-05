import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'

// Generic in-browser consumer smoke. Run against `npm run dev`.
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  // Isolate this consumer from unrelated docs demos and their network clients.
  await page.route('**/src/main.tsx', route => route.fulfill({ contentType: 'application/javascript', body: '' }))
  await page.goto('http://127.0.0.1:45173')
  await page.evaluate(async () => {
    await import('/src/index.css')
    const ReactModule = await import('/node_modules/.vite/deps/react.js')
    const React = ReactModule.default ?? ReactModule
    const ReactDOM = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { createRoot } = ReactDOM.default ?? ReactDOM
    const { EventReviewControls } = await import('/src/components/media-workspace/index.ts')
    const host = document.createElement('div')
    document.body.replaceChildren(host)
    window.reviewIntents = []
    createRoot(host).render(React.createElement(EventReviewControls, {
      quickFilters: [{ id: 'all', label: 'All events' }, { id: 'pending', label: 'Pending' }],
      selectedQuickFilterId: 'all', onQuickFilterChange: id => window.reviewIntents.push(['filter', id]),
      historyDate: { dateTime: '2026-01-02', label: 'January 2, 2026' },
      mediaTimestampSeconds: 65.5, onSeek: seconds => window.reviewIntents.push(['seek', seconds]),
      candidatePeople: [{ id: 'person-a', label: 'Person A' }], selectedCandidatePersonIds: ['external-id'],
      onCandidatePersonIdsChange: ids => window.reviewIntents.push(['people', ids]),
    }))
  })
  await page.getByRole('button', { name: 'Pending' }).click()
  await page.getByRole('button', { name: 'Seek to 1:05' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('checkbox', { name: 'Person A' }).click()
  assert.deepEqual(await page.evaluate(() => window.reviewIntents), [
    ['filter', 'pending'], ['seek', 65.5], ['people', ['external-id', 'person-a']],
  ])
  assert.equal(await page.getByRole('button', { name: 'All events' }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.getByRole('checkbox', { name: 'Person A' }).isChecked(), false)
  assert.equal(await page.locator('time').getAttribute('datetime'), '2026-01-02')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  // The direct-port diagnostic URL cannot reach this repo's proxy-only HMR socket.
  const runtimeErrors = errors.filter(message => message !== 'WebSocket closed without opened.')
  assert.deepEqual(runtimeErrors, [])
  console.log('PASS: real Chromium controlled filter, keyboard seek, candidate selection, separate history date, 390px layout; no component runtime errors')
  if (errors.length) console.log('Environment warning: proxy-only Vite HMR socket unavailable on direct-port URL')
} finally {
  await browser.close()
}
