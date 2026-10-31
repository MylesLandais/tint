/** Internal clipboard feedback shared by chat presentations; the host supplies platform access. */
export type ChatCopyState = 'idle' | 'pending' | 'copied' | 'failed'
type Source = { identity: string; text: string }

export function createChatClipboard(
  readSource: () => Source | null,
  writeText: (text: string) => Promise<void>,
  publish: (state: ChatCopyState) => void,
) {
  let active = true, epoch = 0, pending = false
  let timer: ReturnType<typeof setTimeout> | undefined
  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  function invalidate() {
    ++epoch; pending = false; clearTimer()
    if (active) publish('idle')
  }
  async function copy(acknowledge?: () => void): Promise<boolean> {
    const source = readSource()
    if (!active || pending || source === null) return false
    const owner = epoch
    const current = () => {
      const next = readSource()
      return active && epoch === owner && next?.identity === source.identity && next.text === source.text
    }
    pending = true; clearTimer(); publish('pending')
    try {
      // The platform write cannot be cancelled. Feedback and follow-up callbacks
      // belong only to the source that requested it, even after an A → B → A edit.
      await writeText(source.text)
      if (!current()) return false
    } catch {
      if (current()) { pending = false; publish('failed') }
      return false
    }
    if (!current()) return false
    pending = false; publish('copied')
    timer = setTimeout(() => { if (current()) publish('idle'); timer = undefined }, 1500)
    acknowledge?.()
    return true
  }
  function dispose() { active = false; ++epoch; pending = false; clearTimer() }
  return { copy, invalidate, dispose }
}
