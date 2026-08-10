import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadComfyLtx23Document } from './fixtures/comfy/loadComfyFixture'
import {
  buildMockI2VRuntimeMap,
  createMockI2VRun,
  selectMockI2VRunQueue,
} from './mockI2VRun'

describe('mockI2VRun', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('selects an image→video-ish queue including EmptyImage and LTXVImgToVideo', () => {
    const document = loadComfyLtx23Document()
    const queue = selectMockI2VRunQueue(document)
    const classTypes = queue.map((step) => step.classType)

    expect(classTypes).toContain('EmptyImage')
    expect(classTypes).toContain('LTXVImgToVideoInplace')
    expect(classTypes).toContain('EmptyLTXVLatentVideo')
    expect(classTypes).toContain('SamplerCustomAdvanced')
    expect(classTypes).toContain('CreateVideo')

    const imageIndex = classTypes.indexOf('EmptyImage')
    const i2vIndex = classTypes.indexOf('LTXVImgToVideoInplace')
    const createIndex = classTypes.indexOf('CreateVideo')
    expect(imageIndex).toBeGreaterThanOrEqual(0)
    expect(i2vIndex).toBeGreaterThan(imageIndex)
    expect(createIndex).toBeGreaterThan(i2vIndex)
  })

  it('marks prior steps succeeded and the current step running', () => {
    const queue = [
      { nodeId: 'a', classType: 'EmptyImage', label: 'Reference image' },
      { nodeId: 'b', classType: 'LTXVImgToVideoInplace', label: 'I2V' },
      { nodeId: 'c', classType: 'CreateVideo', label: 'CreateVideo' },
    ]
    const map = buildMockI2VRuntimeMap(queue, 1, 'running', new Set())
    expect(map.get('a')?.status).toBe('succeeded')
    expect(map.get('b')?.status).toBe('running')
    expect(map.get('c')?.status).toBe('idle')
  })

  it('advances through the queue on an interval and completes', () => {
    vi.useFakeTimers()
    const document = loadComfyLtx23Document()
    const updates: string[] = []
    const controller = createMockI2VRun(document, {
      intervalMs: 100,
      onUpdate: (snapshot) => {
        updates.push(`${snapshot.phase}:${snapshot.stepIndex}`)
      },
    })

    controller.start()
    expect(controller.getSnapshot().phase).toBe('running')
    expect(controller.getSnapshot().current?.classType).toBeTruthy()

    const steps = controller.getSnapshot().stepCount
    vi.advanceTimersByTime(100 * (steps + 2))

    const final = controller.getSnapshot()
    expect(final.phase).toBe('completed')
    expect(final.progress).toBe(1)
    expect(updates.some((entry) => entry.startsWith('completed:'))).toBe(true)

    const failed = [...final.runtimeByNodeId.values()].filter(
      (runtime) => runtime.status === 'failed',
    )
    expect(failed.length).toBeGreaterThanOrEqual(1)
  })
})
