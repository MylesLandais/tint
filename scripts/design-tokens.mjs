import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const EXTENSION = 'app.nebula.tint'
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`
export const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const sorted = (values) => [...values].sort()

export function filesUnder(root, directory) {
  return readdirSync(join(root, directory)).sort().flatMap((name) => {
    const path = `${directory}/${name}`
    return statSync(join(root, path)).isDirectory() ? filesUnder(root, path) : [path]
  })
}

// CSS conditional overrides must remain separate from the normal token set.
export function declarations(css, path) {
  const contexts = { normal: {}, reduced: {} }
  postcss.parse(css, { from: path }).walkDecls((declaration) => {
    if (!/^--(?:tint-|font-(?:sans|mono)$)/.test(declaration.prop)) return
    let context = 'normal'
    for (let parent = declaration.parent; parent; parent = parent.parent) {
      if (parent.type !== 'atrule' || parent.name === 'theme') continue
      assert(parent.name === 'media' && parent.params === '(prefers-reduced-motion: reduce)',
        `${path}: unsupported token condition @${parent.name} ${parent.params}`)
      context = 'reduced'
    }
    assert(!contexts[context][declaration.prop], `${path}: duplicate ${declaration.prop} in ${context}`)
    contexts[context][declaration.prop] = {
      cssVariable: declaration.prop,
      cssValue: declaration.value,
      source: path,
      line: declaration.source.start.line,
    }
  })
  return contexts
}

function splitArguments(value) {
  const parts = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '(') depth += 1
    if (value[index] === ')') depth -= 1
    if (value[index] === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(value.slice(start).trim())
  return parts
}

export function resolveScheme(value, scheme) {
  if (!value.startsWith('light-dark(')) return value
  assert(value.endsWith(')'), `Malformed light-dark(): ${value}`)
  const parts = splitArguments(value.slice(11, -1))
  assert(parts.length === 2, `Expected two light-dark() arguments: ${value}`)
  assert(['light', 'dark'].includes(scheme), `Unknown scheme ${scheme}`)
  return parts[scheme === 'light' ? 0 : 1]
}

export function colorValue(css) {
  let components
  let alpha = 1
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(css)) {
    let hex = css.slice(1)
    if (hex.length < 5) hex = [...hex].map((character) => character.repeat(2)).join('')
    components = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    if (hex.length === 8) alpha = Number.parseInt(hex.slice(6), 16) / 255
  } else {
    const match = /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/.exec(css)
    assert(match, `Unsupported CSS color: ${css}`)
    components = match.slice(1, 4).map((part) => Number(part) / 255)
    alpha = match[4] === undefined ? 1 : Number(match[4])
  }
  assert([...components, alpha].every((number) => number >= 0 && number <= 1), `Invalid color: ${css}`)
  return { colorSpace: 'srgb', components, alpha }
}

export function convertToken(entry, scheme) {
  const css = resolveScheme(entry.cssValue, scheme)
  let type
  let value
  if (entry.cssVariable.startsWith('--font-')) {
    type = 'fontFamily'
    value = splitArguments(css).map((part) => part.replace(/^['"]|['"]$/g, ''))
  } else if (/^(?:#|rgb\()/.test(css)) {
    type = 'color'
    value = colorValue(css)
  } else if (/^-?[\d.]+(?:px|rem|ms|s)$/.test(css)) {
    const [, number, unit] = /^(-?[\d.]+)(px|rem|ms|s)$/.exec(css)
    type = ['ms', 's'].includes(unit) ? 'duration' : 'dimension'
    value = { value: Number(number), unit }
  } else if (/^\d+(?:\.\d+)?$/.test(css)) {
    type = 'number'
    value = Number(css)
  } else if (/^cubic-bezier\(/.test(css)) {
    type = 'cubicBezier'
    value = splitArguments(css.slice(13, -1)).map(Number)
    assert(value.length === 4 && value.every(Number.isFinite), `Invalid easing: ${css}`)
  } else {
    throw new Error(`${entry.source}:${entry.line}: unsupported ${entry.cssVariable}: ${css}`)
  }
  return { $type: type, $value: value, $description: entry.cssVariable, $extensions: { [EXTENSION]: entry } }
}

export function penpotToken(token, rootFontSize = 16) {
  const { cssVariable, cssValue } = token.$extensions[EXTENSION]
  let type = token.$type
  let value = token.$value
  if (['duration', 'cubicBezier'].includes(type)) return null
  if (type === 'color') {
    const [r, g, b] = value.components.map((channel) => Math.round(channel * 255))
    value = `rgb(${r} ${g} ${b} / ${value.alpha})`
  } else if (type === 'dimension') {
    value = `${value.value * (value.unit === 'rem' ? rootFontSize : 1)}px`
    if (cssVariable.startsWith('--tint-font-size-')) type = 'fontSizes'
  } else if (type === 'fontFamily') {
    type = 'fontFamilies'
  } else if (type === 'number') {
    value = String(value)
  }
  return { $type: type, $value: value, $description: `${cssVariable}: ${cssValue}`, $extensions: token.$extensions }
}

export function buildTokens(root = ROOT) {
  const inputs = new Map()
  const read = (path) => {
    const contents = readFileSync(join(root, path), 'utf8')
    inputs.set(path, { path, sha256: sha256(contents) })
    return contents
  }
  const entries = (path) => declarations(read(path), path)
  const sets = {}
  const global = entries('src/styles/layout-scale.css')
  const fonts = entries('src/index.css')
  const makeSet = (values, scheme) => ({ tint: Object.fromEntries(Object.keys(values).sort().map((name) => [name.replace(/^--(?:tint-)?/, ''), convertToken(values[name], scheme)])) })
  sets.global = makeSet({ ...global.normal, ...Object.fromEntries(Object.entries(fonts.normal).filter(([name]) => name.startsWith('--font-'))) })
  sets['motion/reduced'] = makeSet(global.reduced)
  const themePaths = filesUnder(root, 'src/styles/themes').filter((path) => path.endsWith('.css'))
  const requiredNames = new Set()
  postcss.parse(read('src/styles/contract.css')).walkDecls((declaration) => {
    for (const match of declaration.value.matchAll(/var\((--tint-[\w-]+)\)/g)) requiredNames.add(match[1])
  })
  const required = sorted(requiredNames)
  const themes = []
  for (const path of themePaths) {
    const values = entries(path)
    assert.deepEqual(Object.keys(values.reduced), [], `${path}: unexpected conditional palette`)
    assert.deepEqual(sorted(Object.keys(values.normal)), required, `${path}: theme token parity`)
    const name = path.split('/').at(-1).replace('.css', '')
    for (const scheme of ['light', 'dark']) {
      const setName = `themes/${name}/${scheme}`
      sets[setName] = makeSet(values.normal, scheme)
      themes.push({
        name: `${name}-${scheme}`, group: 'Palette',
        selectedTokenSets: { global: 'enabled', [setName]: 'enabled' },
      })
    }
  }
  const penpotSets = {}
  const excluded = []
  for (const [name, set] of Object.entries(sets)) {
    const tokens = {}
    for (const [tokenName, token] of Object.entries(set.tint)) {
      const converted = penpotToken(token)
      if (converted) tokens[tokenName] = converted
      else excluded.push({ set: name, token: `tint.${tokenName}`, type: token.$type })
    }
    if (Object.keys(tokens).length) penpotSets[name] = { tint: tokens }
  }
  const sources = [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'))
  const inputSha256 = sha256(json(sources))
  const outputs = new Map()
  for (const [name, set] of Object.entries(sets)) outputs.set(`design/tokens/${name}.json`, json(set))
  outputs.set('design/penpot/tokens.json', json({
    ...penpotSets, $themes: themes,
    $metadata: { tokenSetOrder: Object.keys(penpotSets), activeThemes: ['Palette/tint-light'], activeSets: ['global', 'themes/tint/light'] },
  }))
  outputs.set('design/penpot/token-manifest.json', json({
    schemaVersion: 1, library: 'Tint UI Kit', direction: 'tint-to-penpot',
    inputSha256,
    paletteCount: themePaths.length, schemes: ['light', 'dark'],
    tokenSets: Object.keys(sets), penpotImport: 'design/penpot/tokens.json',
    dtcgProfile: '2025.10', penpotProfile: 'CSS-valued Tokens Studio sets/themes',
    rootFontSizePx: 16, penpotExcludedTokens: excluded,
    inputs: sources,
  }))
  return { outputs, sets, themes }
}
