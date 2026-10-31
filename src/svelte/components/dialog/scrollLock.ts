type DialogEntry = { key: symbol; returnTo: HTMLElement | null; root: HTMLElement | null }
const openDialogs: DialogEntry[] = []
const closingDialogs: DialogEntry[] = []
let originalOverflow = ''

/** Keep modal focus ancestry while a host closes or replaces a dialog. */
export function lockDialogScroll(opener: HTMLElement | null): (root: HTMLElement | null) => () => void {
  let returnTo = opener
  // The removed panel may have left body focused before its replacement mounts.
  if (!returnTo || returnTo === document.body) returnTo = closingDialogs.at(-1)?.returnTo ?? returnTo
  for (const closing of [...closingDialogs].reverse()) {
    if (returnTo && closing.root?.contains(returnTo)) returnTo = closing.returnTo
  }
  const entry: DialogEntry = { key: Symbol('tint-dialog'), returnTo, root: null }
  if (openDialogs.length === 0) {
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  openDialogs.push(entry)

  return (root) => {
    const index = openDialogs.indexOf(entry)
    if (index < 0) return () => {}
    const wasTopmost = index === openDialogs.length - 1
    openDialogs.splice(index, 1)
    entry.root = root
    // A surviving child/replacement cannot return into a panel being removed.
    for (const other of [...openDialogs, ...closingDialogs]) {
      if (other.returnTo && root?.contains(other.returnTo)) other.returnTo = entry.returnTo
    }
    closingDialogs.push(entry)
    const remainingTop = openDialogs.at(-1)?.key
    if (openDialogs.length === 0) document.body.style.overflow = originalOverflow
    return () => {
      const closingIndex = closingDialogs.indexOf(entry)
      if (closingIndex < 0) return
      closingDialogs.splice(closingIndex, 1)
      // A later modal owns focus; the original host may also have re-enabled
      // its opener only after the DOM update that called this callback.
      if (wasTopmost && openDialogs.at(-1)?.key === remainingTop && entry.returnTo?.isConnected) entry.returnTo.focus()
    }
  }
}
