import { describe, expect, it } from 'vitest'

const sourceFiles = import.meta.glob('./**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('published source portability', () => {
  it('does not require Tint-specific TypeScript path aliases', () => {
    const offenders = Object.entries(sourceFiles).flatMap(([path, source]) => {
      const lines = source.split('\n')
      return lines.flatMap((line, index) =>
        /(?:from\s+|import\s*)['"]@\//.test(line)
          ? [`${path}:${index + 1}`]
          : [],
      )
    })

    expect(offenders).toEqual([])
  })
})
