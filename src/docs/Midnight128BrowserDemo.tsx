import { useState } from 'react'
import {
  createBrowserMidnight128Runtime,
  type BrowserAudioEnvironment,
} from '../components/audio-react/browserMidnight128Runtime'
import { Midnight128Workspace } from '../components/audio-react/Midnight128Workspace'

export type Midnight128BrowserDemoProps = {
  environment?: BrowserAudioEnvironment
}

export function Midnight128BrowserDemo({ environment }: Midnight128BrowserDemoProps) {
  const [runtime] = useState(() => createBrowserMidnight128Runtime(environment))
  const [importOpen, setImportOpen] = useState(true)
  return (
    <div className="space-y-4">
      {!importOpen && runtime.importStore.getSnapshot().state !== 'ready' && (
        <button
          type="button"
          className="rounded-md bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent"
          onClick={() => setImportOpen(true)}
        >
          Import reference tracks
        </button>
      )}
      <Midnight128Workspace
        importOpen={importOpen}
        importStore={runtime.importStore}
        registry={runtime.registry}
        engineStore={runtime.engineStore}
        onCloseImport={() => setImportOpen(false)}
      />
    </div>
  )
}
