/** A roll result belongs to the host. These helpers only choose decorative faces. */
export type DiceKind = 'd6' | 'd10' | 'd20'

export const FACE_COUNT: Record<DiceKind, number> = { d6: 6, d10: 10, d20: 20 }

export function animationFace(kind: DiceKind, random: () => number = Math.random): number {
  const fraction = random()
  if (!Number.isFinite(fraction)) return 1
  return 1 + Math.floor(Math.max(0, Math.min(fraction, 0.9999999999999999)) * FACE_COUNT[kind])
}
