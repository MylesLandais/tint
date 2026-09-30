import { mount } from 'svelte'
import '../../index.css'
import '../../styles/themes/mocha.css'
import '../discord-bot-panel/panel.css'
import ModPanel from './ModPanel.svelte'

mount(ModPanel, { target: document.getElementById('root')! })
