const openDialogs: symbol[] = []
let originalOverflow = ''

/** Returns whether this dialog was topmost when it released the body lock. */
export function lockDialogScroll(): () => boolean {
  const key = Symbol('tint-dialog')
  if (openDialogs.length === 0) {
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  openDialogs.push(key)

  return () => {
    const index = openDialogs.indexOf(key)
    if (index < 0) return false
    const wasTopmost = index === openDialogs.length - 1
    openDialogs.splice(index, 1)
    if (openDialogs.length === 0) document.body.style.overflow = originalOverflow
    return wasTopmost
  }
}
