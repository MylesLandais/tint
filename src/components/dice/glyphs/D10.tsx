import type { SVGProps } from 'react'

/**
 * A ten-sided die (pentagonal trapezohedron), drawn to match lucide's
 * line-icon conventions — lucide has no d10/d20 glyphs, so this and `D20`
 * are hand-authored rather than imported.
 */
export function D10(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2 21 9 12 22 3 9Z" />
      <path d="M3 9h18" />
    </svg>
  )
}
