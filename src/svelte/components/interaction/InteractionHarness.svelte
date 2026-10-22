<script lang="ts">
  import Button from '../button/Button.svelte'
  import Menu from '../menu/Menu.svelte'
  import Popover from '../popover/Popover.svelte'
  import Dialog from '../dialog/Dialog.svelte'

  let {
    kind, open, onOpenChange, onSelect, placement = 'center', busy = false,
  }: {
    kind: 'menu' | 'popover' | 'dialog' | 'async-dialog'
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect?: () => void
    placement?: 'center' | 'right'
    busy?: boolean
  } = $props()
</script>

{#if kind === 'async-dialog'}
  <Button disabled={busy} onclick={() => onOpenChange(true)}>Open pending dialog</Button>
  <Dialog {open} {onOpenChange} title="Pending operation">
    <p>Host-owned pending operation.</p>
  </Dialog>
{:else if kind === 'menu'}
  <Menu {open} {onOpenChange} label="Actions menu" items={[
    { id: 'archive', label: 'Archive', onSelect },
    { id: 'separator', type: 'separator' },
    { id: 'disabled', label: 'Unavailable', disabled: true },
    { id: 'delete', label: 'Delete', danger: true, onSelect },
  ]}>
    {#snippet trigger(props)}<button type="button" {...props}>Actions</button>{/snippet}
  </Menu>
{:else if kind === 'popover'}
  <Popover {open} {onOpenChange} title="Details" description="More information" side="bottom">
    {#snippet trigger(props)}<button type="button" {...props}>Show details</button>{/snippet}
    <button type="button">Inside</button>
    <button type="button">Also inside</button>
  </Popover>
{:else}
  <Dialog {open} {onOpenChange} title="Add item" description="Fill in the details" {placement}>
    <button type="button">Inside dialog</button>
    {#snippet actions()}<button type="button">Save</button>{/snippet}
  </Dialog>
{/if}
