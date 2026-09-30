<script lang="ts">
  import { onDestroy } from 'svelte'
  import { TerminalConsole, type TerminalOutput, type TerminalSession, type TerminalStatus } from '../../svelte/components/terminal'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  class DemoSession implements TerminalSession {
    private listeners = new Set<(chunk: TerminalOutput) => void>()
    private line = ''

    onOutput = (listener: (chunk: TerminalOutput) => void) => {
      this.listeners.add(listener)
      listener('Tint mock PTY — type help for commands.\r\n\r\nvisitor@tint$ ')
      return () => this.listeners.delete(listener)
    }

    sendInput = (data: string) => {
      for (const character of data) {
        if (character === '\r') {
          const command = this.line.trim()
          this.emit('\r\n')
          if (command === 'help') this.emit('help, echo TEXT, whoami, clear\r\n')
          else if (command === 'whoami') this.emit('visitor\r\n')
          else if (command === 'clear') this.emit('\x1b[2J\x1b[H')
          else if (command.startsWith('echo ')) this.emit(`${command.slice(5)}\r\n`)
          else if (command) this.emit(`${command}: command not found\r\n`)
          this.line = ''
          this.emit('visitor@tint$ ')
        } else if (character === '\x7f') {
          if (this.line) { this.line = this.line.slice(0, -1); this.emit('\b \b') }
        } else if (character >= ' ') {
          this.line += character
          this.emit(character)
        }
      }
    }

    resize = (_size: { cols: number; rows: number }) => {}

    reconnect() { this.emit('\r\nSession reconnected.\r\nvisitor@tint$ ') }

    private emit(chunk: string) { for (const listener of this.listeners) listener(chunk) }
  }

  const session = new DemoSession()
  let status = $state<TerminalStatus>('connected')
  let expanded = $state(true)
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  onDestroy(() => { if (reconnectTimer) clearTimeout(reconnectTimer) })

  function reconnect() {
    status = 'connecting'
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => { status = 'connected'; session.reconnect() }, 500)
  }

  const api: ApiRow[] = [
    { prop: 'session', type: 'TerminalSession', description: 'Host-owned raw input, output subscription, and resize adapter.' },
    { prop: 'status', type: 'connecting | connected | disconnected | error', description: 'Controlled transport status; disconnected state guards input.' },
    { prop: 'expanded / onExpandedChange', type: 'boolean / (expanded) => void', description: 'Controlled Panel disclosure.' },
    { prop: 'onReconnect / onClear', type: '() => void', description: 'Optional actions for connection retry and viewport clear.' },
    { prop: 'options', type: 'TintTerminalOptions', description: 'Initial xterm options. A new session identity resets the viewport.' },
    { prop: 'title / label / statusMessage', type: 'string', description: 'Visible title, accessible viewport name, and optional status copy.' },
    { prop: 'class / bodyClassName / viewportClassName', type: 'string', description: 'Optional classes on the terminal panel, body, and xterm viewport.' },
  ]
  const usage = `import { TerminalConsole, type TerminalSession } from '@nebula/tint/terminal'

const session: TerminalSession = {
  onOutput(listener) {
    const receive = (event: MessageEvent<string>) => listener(event.data)
    socket.addEventListener('message', receive)
    return () => socket.removeEventListener('message', receive)
  },
  sendInput(data) { socket.send(data) },
  resize({ cols, rows }) { socket.send(JSON.stringify({ type: 'resize', cols, rows })) },
}

let expanded = $state(true)
<TerminalConsole {session} status="connected" {expanded}
  onExpandedChange={(next) => expanded = next} />`
</script>

<DocPage title="Terminal" description="A browser terminal over a host-owned PTY session. Tint handles xterm display, theme, input forwarding, resize, and lifecycle; this preview uses an in-memory mock session." importPath="@nebula/tint/terminal" {usage} {api} accessibility="The viewport is a named application region. Connection state is announced as status text, the panel disclosure is keyboard operable, and reconnect and clear are named buttons. Input is disabled while the session is disconnected.">
  <div class="terminal-demo">
    <div class="controls"><span>Mock PTY · commands: help, echo, whoami, clear</span><button type="button" disabled={status !== 'connected'} onclick={() => status = 'disconnected'}>Disconnect</button></div>
    <TerminalConsole {session} {status} {expanded} onExpandedChange={(next) => expanded = next} onReconnect={reconnect} title="Demo terminal" label="Demo terminal viewport" />
  </div>
</DocPage>

<style>
  .terminal-demo { min-width: 0; }
  .controls { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: .75rem; color: var(--tint-muted); font-size: .8rem; }
  .controls button { min-height: 2.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .35rem .7rem; background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; font: inherit; }
  .controls button:disabled { opacity: .5; cursor: not-allowed; }
</style>
