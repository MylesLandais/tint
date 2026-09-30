import { mount } from 'svelte'
import '../../index.css'
import '../../styles/themes/solarized.css'
import '../../styles/themes/gruvbox.css'
import '../../styles/themes/latte.css'
import '../../styles/themes/frappe.css'
import '../../styles/themes/macchiato.css'
import '../../styles/themes/mocha.css'
import DocsApp from './DocsApp.svelte'

const target = document.getElementById('svelte-docs')
if (!target) throw new Error('Svelte docs mount point is missing')
mount(DocsApp, { target })
