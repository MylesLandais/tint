import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(cleanup)

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  value: function scrollTo(options?: ScrollToOptions | number) {
    if (typeof options === 'number') {
      this.scrollTop = options
      return
    }
    if (options?.top !== undefined) this.scrollTop = options.top
  },
})

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})
