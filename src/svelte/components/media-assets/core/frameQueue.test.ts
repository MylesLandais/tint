import { describe, expect, it } from "vitest"
import { createFrameQueue } from "./frameQueue"

describe("frame queue", () => {
  it("never runs more than the limit and drains as jobs finish", () => {
    const queue = createFrameQueue(2)
    const dones: (() => void)[] = []
    let started = 0
    for (let i = 0; i < 5; i++) queue.enqueue((done) => { started += 1; dones.push(done) })
    expect(started).toBe(2)
    dones[0]()
    dones[0]() // idempotent
    expect(started).toBe(3)
    expect(queue.running).toBe(2)
  })
  it("drops cancelled jobs before they start", () => {
    const queue = createFrameQueue(1)
    let ran = 0
    queue.enqueue(() => {})
    const cancel = queue.enqueue(() => { ran += 1 })
    cancel()
    expect(ran).toBe(0)
  })
})
