#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { extname, resolve } from 'node:path'
import { createHash } from 'node:crypto'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(resolve(root, 'migration/workspace-names.json'), 'utf8'))
const exceptions = new Set([...Object.keys(manifest.compatibility_files), ...Object.keys(manifest.historical_files)])
const files = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))]
const textExtensions = new Set(['.ts', '.svelte', '.mjs', '.js', '.css', '.json', '.md', '.html', '.yml', '.yaml', '.txt'])
const retired = /workbench/i
const failures = []
for (const name of exceptions) if (!files.includes(name)) failures.push(`Stale exception: ${name}`)
for (const [name, expected] of Object.entries(manifest.historical_files)) {
  const actual = createHash('sha256').update(readFileSync(resolve(root, name))).digest('hex')
  if (actual !== expected.sha256) failures.push(`Historical snapshot changed: ${name}`)
}
for (const name of files) {
  if (exceptions.has(name)) continue
  if (retired.test(name)) failures.push(name)
  if (!textExtensions.has(extname(name))) continue
  let source
  try { source = readFileSync(resolve(root, name), 'utf8') }
  catch (cause) { if (cause.code === 'ENOENT') continue; throw cause }
  source.split('\n').forEach((line, index) => { if (retired.test(line)) failures.push(`${name}:${index + 1}`) })
}
if (failures.length) {
  console.error(`Retired names outside explicit compatibility/provenance:\n${failures.join('\n')}`)
  process.exitCode = 1
} else console.log('Workspace naming: maintained source and paths passed.')
