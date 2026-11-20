import { describe, expect, it } from "vitest"
import { clampAspect, justify } from "./justify"

describe("justify", () => {
  it("fills full rows exactly and keeps aspect", () => {
    const rows = justify(Array.from({ length: 9 }, () => ({ aspect: 1.5 })), { width: 1000, targetHeight: 200, gap: 4 })
    const full = rows.slice(0, -1)
    expect(full.length).toBeGreaterThan(0)
    for (const row of full) {
      const total = row.boxes.reduce((sum, box) => sum + box.width, 0) + 4 * (row.boxes.length - 1)
      expect(total).toBe(1000)
      expect(row.height).toBeLessThanOrEqual(200)
    }
  })

  it("does not stretch a short last row", () => {
    const rows = justify([{ aspect: 1 }], { width: 1200, targetHeight: 180 })
    expect(rows).toHaveLength(1)
    expect(rows[0].height).toBe(180)
    expect(rows[0].boxes[0].width).toBe(180)
  })

  it("clamps degenerate and extreme aspects", () => {
    expect(clampAspect(0)).toBe(1)
    expect(clampAspect(Number.NaN)).toBe(1)
    expect(clampAspect(10)).toBe(2.5)
    expect(clampAspect(0.1)).toBe(0.5)
  })

  it("returns nothing for zero width", () => {
    expect(justify([{ aspect: 1 }], { width: 0, targetHeight: 100 })).toEqual([])
  })
})
