import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildTokens, colorValue, convertToken, declarations, penpotToken, ROOT } from './design-tokens.mjs'
import { buildInventory, mappingStatus } from './design-inventory.mjs'

test('CSS comments and reduced-motion overrides do not overwrite the base scale', () => {
  const values = declarations('/* --tint-space-1: 999px; */ :root { --tint-space-1: .25rem; --tint-motion-fast: 110ms; } @media (prefers-reduced-motion: reduce) { :root { --tint-motion-fast: 0ms; } }', 'fixture.css')
  assert.equal(values.normal['--tint-space-1'].cssValue, '.25rem')
  assert.equal(values.normal['--tint-motion-fast'].cssValue, '110ms')
  assert.equal(values.reduced['--tint-motion-fast'].cssValue, '0ms')
  assert.throws(() => declarations(':root { --tint-bg: #fff; --tint-bg: #000; }', 'fixture.css'), /duplicate/)
  assert.throws(() => declarations('@media (width < 500px) { :root { --tint-bg: #fff; } }', 'fixture.css'), /unsupported token condition/)
})

test('DTCG preserves RGB alpha, dimensions, fonts and both nested light-dark branches', () => {
  const entry = { cssVariable: '--tint-shadow-color', cssValue: 'light-dark(rgb(30 42 58 / 0.1), rgb(0 0 0 / 0.5))', source: 'fixture.css', line: 1 }
  assert.deepEqual(convertToken(entry, 'light').$value, { colorSpace: 'srgb', components: [30 / 255, 42 / 255, 58 / 255], alpha: 0.1 })
  assert.equal(convertToken(entry, 'dark').$value.alpha, 0.5)
  assert.equal(colorValue('#fff8').alpha, 136 / 255)
  assert.throws(() => colorValue('rgb(999 0 0)'), /Invalid color/)
  const size = convertToken({ ...entry, cssVariable: '--tint-space-1', cssValue: '0.25rem' })
  assert.deepEqual(size.$value, { value: 0.25, unit: 'rem' })
  assert.equal(penpotToken(size).$value, '4px')
  assert.equal(penpotToken(convertToken({ ...entry, cssValue: '110ms' })), null)
  assert.throws(() => convertToken({ ...entry, cssValue: 'var(--unknown)' }), /unsupported/)
})

test('all eight source palettes retain both scheme contexts and fixed Catppuccin colors', () => {
  const { sets, themes } = buildTokens()
  assert.equal(themes.length, 16)
  assert.deepEqual(sets['themes/mocha/light'].tint.bg.$value, sets['themes/mocha/dark'].tint.bg.$value)
  assert.notDeepEqual(sets['themes/tint/light'].tint.bg.$value, sets['themes/tint/dark'].tint.bg.$value)
  assert.deepEqual(sets.global.tint['motion-fast'].$value, { value: 110, unit: 'ms' })
  assert.deepEqual(sets['motion/reduced'].tint['motion-fast'].$value, { value: 0, unit: 'ms' })
})

test('mapping requires paired IDs and a matching source digest before marking a component mapped', () => {
  const id = '00000000-0000-4000-8000-000000000001'
  assert.equal(mappingStatus({ fileId: null, componentId: null, validatedSourceSha256: null }, 'a'), 'pending-import')
  assert.throws(() => mappingStatus({ fileId: id, componentId: null }, 'a'), /both/)
  assert.equal(mappingStatus({ fileId: id, componentId: id, validatedSourceSha256: 'a' }, 'b'), 'needs-review')
  assert.equal(mappingStatus({ fileId: id, componentId: id, validatedSourceSha256: 'a' }, 'a'), 'mapped')
  assert.throws(() => mappingStatus({ fileId: 'invented', componentId: 'invented' }, 'a'), /UUID/)
})

test('public aliases and existing Penpot identities survive an inventory refresh', () => {
  const inventory = buildInventory()
  const audio = inventory.components.find((component) => component.source.endsWith('/ChatAudio.svelte'))
  assert(audio.exports.some((item) => item.entrypoint === '@nebula/tint/chat' && item.name === 'ChatAudio'))
  assert(audio.exports.some((item) => item.entrypoint === '@nebula/tint' && item.name === 'ChatAudio'))
  assert.equal(audio.priority, 'voice-client')
  const id = '00000000-0000-4000-8000-000000000001'
  audio.penpot = { fileId: id, componentId: id, validatedSourceSha256: audio.sourceSha256 }
  const refreshed = buildInventory(ROOT, inventory).components.find((component) => component.id === audio.id)
  assert.deepEqual(refreshed.penpot, audio.penpot)
  assert.equal(refreshed.status, 'mapped')
})

test('the check command rejects generated token drift without rewriting it', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'tint-token-drift-'))
  try {
    for (const directory of ['scripts', 'src/styles', 'design']) {
      cpSync(join(ROOT, directory), join(temporary, directory), { recursive: true })
    }
    mkdirSync(join(temporary, 'src'), { recursive: true })
    cpSync(join(ROOT, 'src/index.css'), join(temporary, 'src/index.css'))
    symlinkSync(join(ROOT, 'node_modules'), join(temporary, 'node_modules'), 'dir')
    execFileSync(process.execPath, ['scripts/export-tokens.mjs'], { cwd: temporary, stdio: 'pipe' })
    execFileSync(process.execPath, ['scripts/export-tokens.mjs', '--check'], { cwd: temporary, stdio: 'pipe' })
    const file = join(temporary, 'design/tokens/global.json')
    writeFileSync(file, '{}\n')
    assert.throws(() => execFileSync(process.execPath, ['scripts/export-tokens.mjs', '--check'], { cwd: temporary, stdio: 'pipe' }), (error) => error.stderr.toString().includes('design/tokens/global.json'))
    assert.equal(readFileSync(file, 'utf8'), '{}\n')
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
