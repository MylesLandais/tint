import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
// Optional palettes. Library consumers import only the ones they offer; the docs
// site offers all of them, so it loads all of them.
import '@/styles/themes/solarized.css'
import '@/styles/themes/gruvbox.css'
import { DocsApp } from './DocsApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocsApp />
  </StrictMode>,
)
