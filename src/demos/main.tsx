import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../styles/themes/solarized.css'
import '../styles/themes/gruvbox.css'
import '../styles/themes/latte.css'
import '../styles/themes/frappe.css'
import '../styles/themes/macchiato.css'
import '../styles/themes/mocha.css'
import './demo.css'
import { DemoApp } from './DemoApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
)
