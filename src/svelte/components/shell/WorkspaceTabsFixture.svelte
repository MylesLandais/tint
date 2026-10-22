<script lang="ts">
  import WorkspaceTabs from './WorkspaceTabs.svelte'
  let {value='alpha', onChange=(_:string)=>{}, withActions=false}:{value?:string;onChange?:(id:string)=>void;withActions?:boolean}=$props()
</script>
{#snippet actions()}<button type="button">Pin tools</button>{/snippet}
{#snippet own()}<p>Owned tab content</p>{/snippet}
{#snippet content(tab: {id:string})}<p>{tab.id} session content</p>{/snippet}
<WorkspaceTabs tabs={[{id:'alpha',label:'Alpha'},{id:'beta',label:'Beta',content:own}]} {value} {onChange} label="Sessions" {content} actions={withActions ? actions : undefined} />
