import { createLowlight } from 'lowlight'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

/**
 * The one highlighter for every code surface in tint — the editor's code block,
 * the docs `CodeBlock`, and chat's `ChatCodeBlock`.
 *
 * A fixed language subset rather than `all`: registering every grammar
 * highlight.js ships would dwarf the rest of the library. Hosts that need more
 * can register onto the exported instance.
 */
export const lowlight = createLowlight()

lowlight.register({
  bash,
  css,
  go,
  java,
  javascript,
  json,
  markdown,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml,
})

// `xml` covers HTML; the rest are the aliases people actually type in a fence.
lowlight.registerAlias({
  bash: ['sh', 'shell', 'zsh'],
  javascript: ['js', 'jsx', 'mjs', 'cjs'],
  markdown: ['md'],
  python: ['py'],
  typescript: ['ts', 'tsx'],
  xml: ['html', 'svg', 'vue'],
  yaml: ['yml'],
})

/** Languages offered in the editor's code-block dropdown. */
export const CODE_LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'go', label: 'Go' },
  { value: 'html', label: 'HTML' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'yaml', label: 'YAML' },
] as const

/**
 * True when a grammar is registered under this name or alias. Callers use it to
 * fall back to plain text rather than letting lowlight throw on an unknown
 * language — a fenced block in chat can say anything.
 */
export function isSupportedLanguage(language: string | undefined): boolean {
  return Boolean(language) && lowlight.registered(language as string)
}
