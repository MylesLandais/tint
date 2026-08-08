import type { SVGProps } from 'react'

/**
 * A twenty-sided die (icosahedron projection), drawn to match lucide's
 * line-icon conventions — see `D10` for why this is hand-authored.
 */
export function D20(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 2 21 7 21 17 12 22 3 17 3 7Z" />
      <path d="M12 12 12 2M12 12 21 7M12 12 21 17M12 12 12 22M12 12 3 17M12 12 3 7" />
    </svg>
  )
}
