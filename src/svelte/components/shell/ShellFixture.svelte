<script lang="ts">
  import WorkspaceLayout from './WorkspaceLayout.svelte'
  import WorkspaceSplit from './WorkspaceSplit.svelte'
  import WorkspaceTabs from './WorkspaceTabs.svelte'

  type Props = {
    size: number
    onSizeChange: (size: number) => void
    activeTab: string
    onTabChange: (id: string) => void
  }
  let { size, onSizeChange, activeTab, onTabChange }: Props = $props()
</script>

{#snippet navigation()}<p>Navigation region</p>{/snippet}
{#snippet inspector()}<p>Inspector region</p>{/snippet}
{#snippet first()}<p>First pane</p>{/snippet}
{#snippet second()}<p>Second pane</p>{/snippet}
{#snippet onePanel()}<p>One panel</p>{/snippet}
{#snippet twoPanel()}<p>Two panel</p>{/snippet}
{#snippet primary()}
  <WorkspaceSplit {size} {onSizeChange} minSize={100} maxSize={300} label="Resize workspace" {first} {second} />
  <WorkspaceTabs
    tabs={[{ id: 'one', label: 'One', content: onePanel }, { id: 'disabled', label: 'Disabled', disabled: true }, { id: 'two', label: 'Two', content: twoPanel }]}
    value={activeTab} onChange={onTabChange} label="Workspace views" />
{/snippet}

<WorkspaceLayout theme="studio" split="always" navigationWidth={200} inspectorWidth="22rem"
  {navigation} {inspector} {primary} />
