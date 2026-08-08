import { useEffect, useState } from 'react'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Shuffle } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Icon, type IconGlyph } from '@/components/icon'
import { D10, D20 } from './glyphs'
import type { DiceKind, DiceRollerProps } from './types'

const D6_FACES = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

const FACE_COUNT: Record<DiceKind, number> = { d6: 6, d10: 10, d20: 20 }

const CUSTOM_GLYPH: Record<'d10' | 'd20', IconGlyph> = { d10: D10, d20: D20 }

function randomFace(kind: DiceKind) {
  return 1 + Math.floor(Math.random() * FACE_COUNT[kind])
}

/**
 * A worked example of extending `Icon` past lucide's catalog: lucide ships
 * `Dice1`–`Dice6` but no d10/d20, so those two faces render the hand-authored
 * `D10`/`D20` glyphs from `./glyphs` through the same `Icon` seam as every
 * other icon in the library.
 *
 * Controlled like the rest of tint: `value` is the settled face and `onRoll`
 * only reports intent — the app owns the randomness (and can make it
 * server-authoritative, seeded, loaded, whatever) and answers by setting
 * `rolling` and, once resolved, the new `value`.
 */
export function DiceRoller({
  kind = 'd6',
  value,
  rolling = false,
  onRoll,
  label = 'Roll',
  className,
  ...props
}: DiceRollerProps) {
  const [displayFace, setDisplayFace] = useState(value)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!rolling) {
      setDisplayFace(value)
      return
    }
    // Reduced motion still needs the result to change — it just skips the
    // flicker-through-random-faces spectacle on the way there.
    if (reduceMotion) return
    const id = window.setInterval(() => setDisplayFace(randomFace(kind)), 80)
    return () => window.clearInterval(id)
  }, [rolling, kind, value, reduceMotion])

  const custom = kind !== 'd6' ? CUSTOM_GLYPH[kind] : undefined

  return (
    <div
      data-dice-roller=""
      data-kind={kind}
      className={cn('inline-flex flex-col items-center gap-3', className)}
      {...props}
    >
      <motion.div
        role="status"
        aria-label={rolling ? 'Rolling' : `Rolled ${value}`}
        animate={
          rolling && !reduceMotion
            ? { rotate: [0, 16, -14, 10, -8, 0], scale: [1, 1.08, 0.96, 1.04, 1] }
            : { rotate: 0, scale: 1 }
        }
        transition={
          rolling && !reduceMotion
            ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 300, damping: 16 }
        }
        className="relative grid size-16 place-items-center rounded-2xl border border-tint-border bg-tint-panel text-tint-accent"
      >
        {custom ? (
          <>
            <Icon icon={custom} size="xl" className="text-tint-border" />
            <span className="absolute text-sm font-semibold tabular-nums text-tint-ink">
              {rolling ? displayFace : value}
            </span>
          </>
        ) : (
          <Icon icon={D6_FACES[(rolling ? displayFace : value) - 1] ?? Dice1} size="xl" />
        )}
      </motion.div>

      <button
        type="button"
        onClick={onRoll}
        disabled={rolling}
        className="inline-flex items-center gap-1.5 rounded-lg border border-tint-border bg-tint-panel px-3 py-1.5 text-xs font-medium text-tint-ink transition hover:bg-tint-surface disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
      >
        <Icon
          icon={Shuffle}
          size="sm"
          className={rolling ? 'animate-spin motion-reduce:animate-none' : undefined}
        />
        {label}
      </button>
    </div>
  )
}
