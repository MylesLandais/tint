#!/usr/bin/env node
// Markdown link integrity. Tint must be understandable and verifiable when
// cloned on its own, so every relative link must resolve inside the repository
// root (after following symlinks), and every #anchor must name a real heading.
// Cross-project references use absolute https:// URLs, which are not fetched.
//
//   node scripts/check-doc-links.mjs                      # Tint, whole repo
//   node scripts/check-doc-links.mjs --root <dir> [--scan <file|dir>...] [--target-prefix <dir>]
//
// --scan limits which Markdown files are read; --target-prefix limits which
// links are checked to those resolving under that directory (a consumer uses it
// to check only its links into a vendored Tint checkout).
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-ssr', 'playwright-report', 'test-results', 'vendor', '.direnv', 'target'])
const EXTERNAL = /^(?:https?:|mailto:)/i
const SCHEME = /^[a-z][a-z0-9+.-]*:/i

export function markdownFiles(root, scan = ['.']) {
  const out = []
  const walk = (entry) => {
    const stat = statSync(entry)
    if (stat.isDirectory()) {
      for (const name of readdirSync(entry)) {
        if (SKIP_DIRS.has(name)) continue
        walk(path.join(entry, name))
      }
    } else if (entry.endsWith('.md')) out.push(entry)
  }
  for (const item of scan) walk(path.resolve(root, item))
  return out.sort()
}

/** Strip fenced code blocks (headings and links inside them are examples). */
function withoutFences(source) {
  return source.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ' '))
}

/** Strip fenced and inline code so example links are not checked. */
function prose(source) {
  return withoutFences(source).replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length))
}

/** [text](target), ![alt](target) and [label]: target definitions. */
export function linksIn(source) {
  const text = prose(source)
  const links = []
  const lineOf = (index) => text.slice(0, index).split('\n').length
  for (const match of text.matchAll(/!?\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) links.push({ target: match[1], line: lineOf(match.index) })
  for (const match of text.matchAll(/^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+"[^"]*")?\s*$/gm)) links.push({ target: match[1], line: lineOf(match.index) })
  return links
}

/** GitHub-style heading slugs, with -1, -2 suffixes for duplicates, plus explicit ids. */
export function anchorsIn(source) {
  const anchors = new Set()
  const seen = new Map()
  for (const match of withoutFences(source).matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = match[1].toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-')
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    anchors.add(count ? `${base}-${count}` : base)
  }
  for (const match of source.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) anchors.add(match[1])
  return anchors
}

function inside(root, target) {
  const relative = path.relative(root, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export function checkLinks({ root, scan = ['.'], targetPrefix = null }) {
  const absoluteRoot = path.resolve(root)
  const realRoot = realpathSync(absoluteRoot)
  const prefix = targetPrefix ? path.resolve(absoluteRoot, targetPrefix) : null
  const anchorCache = new Map()
  const anchorsOf = (file) => {
    if (!anchorCache.has(file)) anchorCache.set(file, anchorsIn(readFileSync(file, 'utf8')))
    return anchorCache.get(file)
  }
  const problems = []
  for (const file of markdownFiles(absoluteRoot, scan)) {
    const where = (line) => `${path.relative(absoluteRoot, file)}:${line}`
    for (const { target, line } of linksIn(readFileSync(file, 'utf8'))) {
      if (EXTERNAL.test(target)) continue
      if (SCHEME.test(target)) { problems.push(`${where(line)}: unsupported link scheme '${target}'`); continue }
      const [rawPath, anchor] = target.split('#', 2)
      let decoded
      try { decoded = decodeURIComponent(rawPath) } catch { decoded = rawPath }
      if (decoded.startsWith('/')) { problems.push(`${where(line)}: absolute path '${target}' — use a relative link or an https:// URL`); continue }
      const resolved = decoded ? path.resolve(path.dirname(file), decoded) : file
      if (prefix && !inside(prefix, resolved)) continue
      if (!inside(absoluteRoot, resolved)) { problems.push(`${where(line)}: '${target}' escapes the repository root — use an https:// URL for other projects`); continue }
      if (!existsSync(resolved)) { problems.push(`${where(line)}: missing target '${target}'`); continue }
      if (!inside(realRoot, realpathSync(resolved))) { problems.push(`${where(line)}: '${target}' is a symlink that escapes the repository root`); continue }
      if (anchor && resolved.endsWith('.md') && !anchorsOf(resolved).has(anchor.toLowerCase())) {
        problems.push(`${where(line)}: missing anchor '#${anchor}' in ${path.relative(absoluteRoot, resolved)}`)
      }
    }
  }
  return problems
}

function main(argv) {
  const value = (flag) => { const index = argv.indexOf(flag); return index >= 0 ? argv[index + 1] : undefined }
  const values = (flag) => {
    const index = argv.indexOf(flag)
    if (index < 0) return undefined
    const out = []
    for (let next = index + 1; next < argv.length && !argv[next].startsWith('--'); next += 1) out.push(argv[next])
    return out
  }
  const root = value('--root') ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const problems = checkLinks({ root, scan: values('--scan') ?? ['.'], targetPrefix: value('--target-prefix') ?? null })
  if (problems.length) {
    console.error(problems.join('\n'))
    console.error(`\n${problems.length} documentation link problem(s).`)
    return 1
  }
  console.log('Documentation links: all relative links and anchors resolve inside the root.')
  return 0
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.exitCode = main(process.argv.slice(2))
