import { mount } from 'svelte'
import '../index.css'
import '../styles/themes/solarized.css'
import '../styles/themes/gruvbox.css'
import '../styles/themes/latte.css'
import '../styles/themes/frappe.css'
import '../styles/themes/macchiato.css'
import '../styles/themes/mocha.css'
import './demo.css'
import DemoApp from './DemoApp.svelte'

mount(DemoApp, { target: document.getElementById('root')! })
