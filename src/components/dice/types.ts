import type { HTMLAttributes } from 'react'

export type DiceKind = 'd6' | 'd10' | 'd20'

export type DiceRollerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  /** Which die to render. */
  kind?: DiceKind
  /** The settled face to display while not rolling. */
  value: number
  /**
   * True while a roll is in flight — the die free-spins through random faces
   * until this flips back to `false`, at which point it settles on `value`.
   * A controlled flag rather than inferring "rolling" from `value` changing,
   * so a roll that lands on the same face it started on still animates.
   */
  rolling?: boolean
  /** Fired when the roll trigger is activated; the app owns the randomness. */
  onRoll?: () => void
  /** Accessible/visible label for the roll trigger. */
  label?: string
}
