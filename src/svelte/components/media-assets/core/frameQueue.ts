/**
 * Bounded queue for first-frame video previews. Browsers cap concurrent media
 * connections per host; unbounded <video preload> tiles hold them open and
 * every later tile stalls. Jobs run at most ``limit`` at a time and must call
 * ``done`` once their video is released.
 */
type Job = (done: () => void) => void

export function createFrameQueue(limit = 3) {
  let running = 0
  const waiting: Job[] = []
  const pump = () => {
    while (running < limit && waiting.length) {
      const job = waiting.shift()!
      running += 1
      let finished = false
      job(() => {
        if (finished) return
        finished = true
        running -= 1
        pump()
      })
    }
  }
  return {
    /** Queue a job; returns a cancel function for tiles that unmount first. */
    enqueue(job: Job): () => void {
      waiting.push(job)
      pump()
      return () => {
        const index = waiting.indexOf(job)
        if (index >= 0) waiting.splice(index, 1)
      }
    },
    get running() {
      return running
    },
  }
}

export const frameQueue = createFrameQueue(3)
