#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const A11Y_FILE = 'migration/svelte-a11y-reviewed.txt'
const STATUS_FILE = 'docs/migrations/svelte-status.md'
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.svelte', '.css'])
const IMPORT_RE = /\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*|@import\s+|@use\s+)['"]([^'"]+)['"]/g
const REACT_PACKAGE_RE = /(?:^|\/|@|-)react(?:$|\/|-)|^recharts$/
const CARBON_PACKAGE_RE = /^(?:(?:carbon-components-svelte|carbon-icons-svelte)(?:\/|$)|@carbon\/)/
const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const CARBON_IMPLEMENTATION_PATHS = ['src/svelte/components/', 'src/svelte/form/', 'src/svelte/internal/']
const ADDITIONAL_PACKAGES = new Set(['auth/client', 'calendar/client', 'client', 'demos/discord-panel', 'docs', 'lib', 'test'])
const SHARED_DOC_PAGES = new Map([
  ['audio-engine', 'src/docs/DJDoc.svelte'],
  ['audio-workspace', 'src/docs/DJDoc.svelte'],
  ['scatter-plot', 'src/docs/ReleaseChartDoc.svelte'],
  ['release-chart', 'src/docs/ReleaseChartDoc.svelte'],
  ['timeline', 'src/docs/DJDoc.svelte'],
])

function read(relative) {
  return readFileSync(path.join(ROOT, relative), 'utf8')
}

function walk(relative) {
  if (!existsSync(path.join(ROOT, relative))) return []
  return readdirSync(path.join(ROOT, relative), { withFileTypes: true }).flatMap((entry) => {
    const file = `${relative}/${entry.name}`
    return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : []
  }).sort()
}

function sourceFiles() {
  const source = walk('src').filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
  const configs = ['vite.config.ts', 'vitest.config.ts', 'playwright.config.ts']
    .filter((file) => existsSync(path.join(ROOT, file)))
  return [...source, ...configs]
}

function importSpecifiers(source) {
  return [...source.matchAll(IMPORT_RE)].map((match) => match[1])
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length
}

function add(findings, file, kind, amount = 1) {
  if (amount > 0) {
    const key = `${file}\t${kind}`
    findings.set(key, (findings.get(key) ?? 0) + amount)
  }
}

function scan(files, manifest) {
  const findings = new Map()
  const carbonViolations = []

  for (const file of files) {
    const source = read(file)
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) add(findings, file, 'jsx-source')
    add(findings, file, 'ReactNode', count(source, /\bReactNode\b/g))
    add(findings, file, 'JSX.', count(source, /\bJSX\./g))
    add(findings, file, 'React.', count(source, /\bReact\.[A-Za-z_$]/g))

    for (const specifier of importSpecifiers(source)) {
      if (REACT_PACKAGE_RE.test(specifier)) add(findings, file, `import:${specifier}`)
      if (CARBON_PACKAGE_RE.test(specifier) && !CARBON_IMPLEMENTATION_PATHS.some((prefix) => file.startsWith(prefix))) {
        carbonViolations.push(`${file} -> ${specifier}`)
      }
    }
  }

  for (const section of DEPENDENCY_SECTIONS) {
    for (const name of Object.keys(manifest[section] ?? {})) {
      if (REACT_PACKAGE_RE.test(name)) add(findings, 'package.json', `dependency:${section}:${name}`)
    }
  }

  const lockPackages = JSON.parse(read('package-lock.json')).packages ?? {}
  for (const name of ['react', 'react-dom']) {
    if (lockPackages[`node_modules/${name}`]) add(findings, 'package-lock.json', `runtime:${name}`)
  }

  return { findings, carbonViolations: carbonViolations.sort() }
}

function readA11yReviews(packages) {
  const reviewed = new Set()
  if (!existsSync(path.join(ROOT, A11Y_FILE))) return reviewed
  for (const [index, line] of read(A11Y_FILE).split('\n').entries()) {
    const name = line.trim()
    if (!name || name.startsWith('#')) continue
    if (!packages.has(name) || reviewed.has(name)) throw new Error(`${A11Y_FILE}:${index + 1}: unknown or duplicate package ${name}`)
    reviewed.add(name)
  }
  return reviewed
}

function packageDirectories() {
  const components = path.join(ROOT, 'src/components')
  const names = readdirSync(components, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && walk(`src/components/${entry.name}`).length > 0)
    .map((entry) => entry.name)
  const svelteComponents = path.join(ROOT, 'src/svelte/components')
  const newNames = existsSync(svelteComponents) ? readdirSync(svelteComponents, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'testing')
    .map((entry) => entry.name) : []
  const core = path.join(ROOT, 'src/core')
  const coreNames = readdirSync(core, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  return [...new Set([...names, ...newNames, ...coreNames, ...ADDITIONAL_PACKAGES])].sort()
}

function publicComponentPackages(manifest) {
  return new Set(Object.entries(manifest.exports ?? {})
    .filter(([subpath, target]) => /^\.\/[^/]+$/.test(subpath) && typeof target === 'string')
    .map(([subpath]) => subpath.slice(2))
    .filter((name) => existsSync(path.join(ROOT, `src/components/${name}`)) ||
      existsSync(path.join(ROOT, `src/svelte/components/${name}`))))
}

function svelteAliasTarget(manifest, name) {
  const target = manifest.exports?.[`./${name}`]
  if (typeof target !== 'string') return null
  const match = /^\.\/src\/svelte\/components\/([^/]+)\//.exec(target)
  return match && match[1] !== name ? match[1] : null
}

function packagePath(name) {
  if (ADDITIONAL_PACKAGES.has(name)) return `src/${name}`
  return `src/components/${name}`
}

function matchesPackage(file, prefix) {
  return file.startsWith(`${prefix}/`)
}

function titleCase(name) {
  return name.split(/[-/]/).map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join('')
}

function directSvelteComponent(file, name) {
  if (!file.startsWith('src/svelte/') || file.slice('src/svelte/'.length).includes('/')) return false
  const stem = path.basename(file, '.svelte').replace(/[^a-z0-9]/gi, '').toLowerCase()
  return stem === name.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function packageSvelteFiles(files, name) {
  const sveltePaths = [`src/svelte/${name}`, `src/svelte/components/${name}`]
  const componentPath = packagePath(name)
  return files.filter((file) => file.endsWith('.svelte') && !/(?:Harness|Fixture)\.svelte$/.test(file) &&
    (sveltePaths.some((prefix) => matchesPackage(file, prefix)) || matchesPackage(file, componentPath) || directSvelteComponent(file, name)))
}

function packageSvelteTests(files, name, hasSvelte) {
  const sveltePaths = [`src/svelte/${name}`, `src/svelte/components/${name}`]
  const componentPath = name === 'client' ? null : packagePath(name)
  return hasSvelte && files.some((file) => /\.(?:test|spec)\.ts$/.test(file) &&
    (sveltePaths.some((prefix) => matchesPackage(file, prefix)) || (componentPath && matchesPackage(file, componentPath)) ||
      (file.startsWith('src/svelte/components/') && read(file).includes(`describe('${titleCase(name)}'`))))
}

function packageSvelteDocs(files, name) {
  if (name === 'docs') return files.some((file) => matchesPackage(file, 'src/docs/svelte') && file.endsWith('.svelte'))
  if (name === 'demos/discord-panel') {
    return ['discord-bot-panel.html', 'discord-mod-panel.html'].every((file) => existsSync(path.join(ROOT, file))) &&
      files.some((file) => matchesPackage(file, 'src/demos/discord-panel') && file.endsWith('.svelte'))
  }
  const sharedPage = SHARED_DOC_PAGES.get(name)
  if (sharedPage) return files.includes(sharedPage)
  const stem = name.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return files.some((file) => {
    if (!file.startsWith('src/docs/') || !file.endsWith('.svelte')) return false
    if (matchesPackage(file, `src/docs/${name}`)) return true
    const basename = path.basename(file, '.svelte').replace(/[^a-z0-9]/gi, '').toLowerCase()
    return basename === `${stem}doc` || basename === `${stem}docs`
  })
}

function generateStatus(files, findings, manifest, carbonViolations) {
  const packages = packageDirectories()
  const reviewed = readA11yReviews(new Set(packages))
  const publicPackages = publicComponentPackages(manifest)
  let publicReactBacked = 0
  let publicUiPackages = 0
  let publicUiGatesMet = 0
  let extractedCorePackages = 0
  const rows = packages.map((name) => {
    const base = packagePath(name)
    const reactFindings = [...findings.keys()].filter((key) => key.startsWith(`${base}/`))
    const reactRemoved = reactFindings.length === 0
    if (publicPackages.has(name) && !reactRemoved) publicReactBacked++
    const core = files.some((file) => file.startsWith(`src/core/${name}/`) || file === `src/core/${name}.ts`)
    if (core) extractedCorePackages++
    const svelteFiles = packageSvelteFiles(files, name)
    const svelteBinding = name === 'client' && files.some((file) => matchesPackage(file, 'src/svelte/client') && file.endsWith('.ts'))
    const svelte = svelteFiles.length > 0 || svelteBinding
    const uiSource = files.some((file) => matchesPackage(file, base) && file.endsWith('.tsx')) || svelteFiles.length > 0
    const tests = packageSvelteTests(files, name, svelte)
    const docs = packageSvelteDocs(files, name)
    const a11y = reviewed.has(name)
    const aliasTarget = svelteAliasTarget(manifest, name)
    const localGatesMet = reactRemoved && svelte && tests && docs && a11y
    if (publicPackages.has(name) && uiSource) {
      publicUiPackages++
      if (localGatesMet) publicUiGatesMet++
    }
    const status = !reactRemoved ? 'React remains'
      : !svelte ? aliasTarget ? `Svelte alias → ${aliasTarget}` : core ? 'Core only' : 'Plain TS'
        : localGatesMet ? 'Local gates met' : 'Needs gates'
    return `| ${name} | ${core ? 'Yes' : '—'} | ${svelteBinding ? 'Binding' : svelte ? 'Yes' : '—'} | ${tests ? 'Yes' : '—'} | ${docs ? 'Yes' : '—'} | ${uiSource ? a11y ? 'Reviewed' : 'Pending' : '—'} | ${reactRemoved ? 'Yes' : 'No'} | ${status} |`
  })

  const tsx = files.filter((file) => file.endsWith('.tsx')).length
  const reactImports = [...findings].filter(([key]) => key.endsWith('\timport:react')).reduce((sum, [, amount]) => sum + amount, 0)
  const reactDomImports = [...findings].filter(([key]) => key.includes('\timport:react-dom')).reduce((sum, [, amount]) => sum + amount, 0)
  const reactDependencies = [...findings.keys()].filter((key) => key.startsWith('package.json\tdependency:')).length
  // The historical smoke fixture is staged for removal outside this migration
  // series. Exclude it from the inventory in both its present and absent states.
  const svelte = files.filter((file) => file.endsWith('.svelte') && file !== 'src/svelte/TintSvelteSmoke.svelte').length
  return [
    '# Svelte migration status',
    '',
    'Generated by `npm run migration:refresh`. CI checks this inventory and the zero-React boundary with `npm run check:migration`.',
    'A11y review is recorded manually in `migration/svelte-a11y-reviewed.txt`; source inspection cannot prove keyboard and screen-reader behavior.',
    '“Tests” means a non-React TypeScript test beside a Svelte package. “Docs” means a Svelte docs page or dedicated live demo.',
    'Rows reflect source files and local migration gates; behavior parity and consumer validation require separate review.',
    '',
    `- .tsx files remaining: **${tsx}**`,
    `- Imports from react: **${reactImports}**`,
    `- Imports from react-dom: **${reactDomImports}**`,
    `- React-specific direct dependency entries: **${reactDependencies}**`,
    `- React findings: **${findings.size}**`,
    `- Svelte files (excluding the retired smoke fixture): **${svelte}**`,
    `- Packages with extracted core modules: **${extractedCorePackages}**`,
    `- Carbon imports outside approved Tint implementation paths: **${carbonViolations.length}**`,
    `- Public component packages still React-backed: **${publicReactBacked}**`,
    `- Public UI packages with local gates met: **${publicUiGatesMet}/${publicUiPackages} (${publicUiPackages ? `${Math.round(publicUiGatesMet / publicUiPackages * 100)}%` : 'n/a'})**`,
    '',
    '| Package | Core extracted | Svelte component | Tests | Docs | A11y | React removed | Status |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

function main() {
  const options = new Set(process.argv.slice(2))
  const supported = new Set(['--print-findings', '--refresh'])
  for (const option of options) if (!supported.has(option)) throw new Error(`Unknown option: ${option}`)
  if (options.size > 1) throw new Error('Use only one option at a time')

  const files = sourceFiles()
  const manifest = JSON.parse(read('package.json'))
  const { findings, carbonViolations } = scan(files, manifest)
  if (options.has('--print-findings')) {
    for (const [key, amount] of [...findings].sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`${key}\t${amount}`)
    }
    if (!findings.size) console.log('No React findings.')
    return
  }

  const errors = [
    ...[...findings].map(([key, amount]) => `React source or dependency: ${key} (${amount})`),
    ...carbonViolations.map((violation) => `Carbon import outside approved Tint implementation paths: ${violation}`),
  ]
  if (errors.length) throw new Error(errors.join('\n'))

  const status = generateStatus(files, findings, manifest, carbonViolations)
  if (options.has('--refresh')) {
    writeFileSync(path.join(ROOT, STATUS_FILE), status)
    console.log(`Updated ${STATUS_FILE}`)
    return
  }

  if (read(STATUS_FILE) !== status) errors.push(`${STATUS_FILE} is stale. Run npm run migration:refresh.`)
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`Migration check passed: 0 .tsx files; 0 React findings; 0 Carbon boundary violations.`)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
