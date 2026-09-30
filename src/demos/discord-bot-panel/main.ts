import { mount } from 'svelte'
import '../../index.css'
import '../../styles/themes/mocha.css'
import './panel.css'
import DiscordBotPanel from './DiscordBotPanel.svelte'

mount(DiscordBotPanel, { target: document.getElementById('root')! })
