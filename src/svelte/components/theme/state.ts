import type { Readable } from 'svelte/store'
import { themeState, type ColorSchemePreference, type ColorSchemeState } from '../../../core/theme'

/** Svelte bindings over the shared plain TypeScript preference state. */
export const themeNameStore: Readable<string> & { set: (theme: string) => void } = {
  subscribe(run) {
    const publish = () => run(themeState.getTheme())
    publish()
    themeState.applyTheme(themeState.getTheme())
    return themeState.subscribeTheme(publish)
  },
  set: themeState.setTheme,
}

export const colorSchemeStore: Readable<ColorSchemeState> & { set: (preference: ColorSchemePreference) => void } = {
  subscribe(run) {
    const publish = () => {
      const preference = themeState.getPreference()
      run({ preference, resolved: preference === 'system' ? themeState.getSystemScheme() : preference, setPreference: themeState.setPreference })
    }
    publish()
    themeState.applyPreference(themeState.getPreference())
    const unsubscribePreference = themeState.subscribePreference(publish)
    const unsubscribeSystem = themeState.subscribeSystem(publish)
    return () => { unsubscribePreference(); unsubscribeSystem() }
  },
  set: themeState.setPreference,
}
