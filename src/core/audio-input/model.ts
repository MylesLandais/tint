export function joinTranscript(...parts: string[]): string {
  return parts.reduce((result, part) => {
    if (!part) return result
    if (!result) return part
    return /\s$/.test(result) || /^\s/.test(part) ? `${result}${part}` : `${result} ${part}`
  }, '')
}
