import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import '../../components/form/styles.css'
import '../../styles/themes/mocha.css'
import './panel.css'
import { DiscordBotPanel } from './DiscordBotPanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DiscordBotPanel />
  </StrictMode>,
)
