import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { VideoPlayerDoc } from './VideoPlayerDoc'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VideoPlayerDoc />
  </StrictMode>,
)
