#!/usr/bin/env node
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { buildTokens, ROOT } from './design-tokens.mjs'

assert(process.argv.slice(2).every((argument) => argument === '--check'), 'Usage: node scripts/export-tokens.mjs [--check]')
const check = process.argv.includes('--check')
const { outputs, themes } = buildTokens()
const stale = []
for (const [path, contents] of outputs) {
  const target = join(ROOT, path)
  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== contents) stale.push(path)
  } else {
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }
}
for (const entry of readdirSync(join(ROOT, 'design/tokens'), { recursive: true })) {
  if (entry.endsWith('.json') && !outputs.has(`design/tokens/${entry}`)) stale.push(`design/tokens/${entry} (obsolete; remove explicitly)`)
}
assert(stale.length === 0, `Token drift. Run node scripts/export-tokens.mjs:\n${stale.join('\n')}`)
console.log(`${check ? 'Verified' : 'Exported'} ${outputs.size} files and ${themes.length} palette/scheme combinations.`)
