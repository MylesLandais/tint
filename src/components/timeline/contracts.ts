export type TimelineViewport = {
  /** Total musical document length. */
  totalBeats: number
  /** Current drawable CSS width, independent of device-pixel ratio. */
  widthPixels: number
  /** Horizontal zoom level. */
  pixelsPerBeat: number
  /** Musical beat at the viewport's left edge. */
  scrollBeat: number
}

export type TimelineViewportInput = TimelineViewport

export type TimelineBeatRange = {
  startBeat: number
  endBeat: number
}

export type AutomationPoint = {
  /** Beat offset from the beginning of an automation region. */
  beat: number
  value: number
}
