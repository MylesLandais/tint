import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import '../../components/form/styles.css'
import '../../styles/themes/mocha.css'
import '../discord-bot-panel/panel.css'
import { ModPanel } from './ModPanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModPanel />
  </StrictMode>,
)
