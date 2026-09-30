import { mount } from 'svelte'
import '../../index.css'
import '../../styles/themes/solarized.css'
import '../../styles/themes/gruvbox.css'
import '../../styles/themes/latte.css'
import '../../styles/themes/frappe.css'
import '../../styles/themes/macchiato.css'
import '../../styles/themes/mocha.css'
import DesignLab from './DesignLab.svelte'

const target = document.getElementById('design-lab')
if (!target) throw new Error('Design Lab mount point is missing')

mount(DesignLab, { target })
