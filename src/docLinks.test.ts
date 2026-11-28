import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error -- plain ESM script shared with consumers; no declaration file.
import { anchorsIn, checkLinks } from '../scripts/check-doc-links.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const scratch: string[] = []

function fixture(files: Record<string, string>): string {
  const base = mkdtempSync(path.join(tmpdir(), 'tint-doc-links-'))
  scratch.push(base)
  const root = path.join(base, 'repo')
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
    writeFileSync(path.join(root, name), body)
  }
  return root
}

afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('documentation links', () => {
  it('resolve inside the Tint repository', () => {
    expect(checkLinks({ root: ROOT })).toEqual([])
  })

  it('accept ordinary relative links, anchors, definitions and external URLs', () => {
    const root = fixture({
      'README.md': '# Tint\n\n[Guide](docs/guide.md#two-words) [Self](#tint) [Dir](docs/)\n\n[ref]: docs/guide.md\n\nSee <https://example.test/x> and [Upstream](https://git.example.test/x/y.md).\n',
      'docs/guide.md': '# Guide\n\n## Two words\n\n## Two words\n\n[Back](../README.md#tint) [Dup](#two-words-1)\n\n```md\n[ignored](missing.md)\n```\n',
    })
    expect(checkLinks({ root })).toEqual([])
  })

  it('reject traversal outside the root', () => {
    const root = fixture({ 'docs/a.md': '[Out](../../outside.md)\n' })
    writeFileSync(path.join(root, '..', 'outside.md'), '# Outside\n')
    expect(checkLinks({ root })).toEqual([expect.stringContaining('escapes the repository root')])
  })

  it('reject symlinks that escape the root', () => {
    const root = fixture({ 'docs/a.md': '[Linked](linked.md)\n' })
    writeFileSync(path.join(root, '..', 'secret.md'), '# Secret\n')
    symlinkSync(path.join(root, '..', 'secret.md'), path.join(root, 'docs/linked.md'))
    expect(checkLinks({ root, scan: ['docs/a.md'] })).toEqual([expect.stringContaining('symlink that escapes')])
  })

  it('reject missing files, missing anchors, absolute paths and other schemes', () => {
    const root = fixture({
      'a.md': '# A\n\n[Missing](nope.md) [Anchor](b.md#nowhere) [Abs](/etc/x.md) [File](file:///x.md)\n',
      'b.md': '# B\n',
    })
    const problems = checkLinks({ root })
    expect(problems).toHaveLength(4)
    expect(problems.join('\n')).toMatch(/missing target 'nope.md'[\s\S]*missing anchor '#nowhere'[\s\S]*absolute path[\s\S]*unsupported link scheme/)
  })

  it('limits checks to a target prefix for consumers', () => {
    const root = fixture({ 'docs/a.md': '[Vendored](../vendor-tint/docs/x.md) [Other](missing.md)\n', 'vendor-tint/docs/y.md': '# Y\n' })
    expect(checkLinks({ root, scan: ['docs'], targetPrefix: 'vendor-tint' })).toEqual([expect.stringContaining('missing target')])
  })

  it('derives GitHub heading slugs', () => {
    expect([...anchorsIn('# Feed ↔ Channel (proposed)\n## R1–R9\n## `code` title\n')]).toEqual(['feed--channel-proposed', 'r1r9', 'code-title'])
  })
})
