export type RGB = [number, number, number]

function linearize(channel: number): number {
  const value = channel / 255
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}

export function getLuminance([red, green, blue]: RGB): number {
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  )
}

export function getContrastRatio(foreground: RGB, background: RGB): number {
  const foregroundLuminance = getLuminance(foreground)
  const backgroundLuminance = getLuminance(background)
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  )
}

export function parseHexColor(value: string): RGB {
  const match = /^#([\da-f]{6})(?:[\da-f]{2})?$/i.exec(value.trim())
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${value}"`)
  }

  const hex = match[1]!
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

export function validateColorTokenPair(
  tokenName: string,
  foreground: RGB,
  background: RGB,
  isLargeText = false,
): void {
  const ratio = getContrastRatio(foreground, background)
  const threshold = isLargeText ? 3 : 4.5

  if (ratio < threshold) {
    throw new Error(
      `[A11Y LINT ERROR] Token pair "${tokenName}" failed WCAG AA contrast. ` +
        `Expected >= ${threshold}:1, got ${ratio.toFixed(2)}:1`,
    )
  }
}
