<script lang="ts">
  import WorkspaceTabs from './WorkspaceTabs.svelte'
  let {value='alpha', onChange=(_:string)=>{}}:{value?:string;onChange?:(id:string)=>void}=$props()
</script>
{#snippet own()}<p>Owned tab content</p>{/snippet}
{#snippet content(tab: {id:string})}<p>{tab.id} session content</p>{/snippet}
<WorkspaceTabs tabs={[{id:'alpha',label:'Alpha'},{id:'beta',label:'Beta',content:own}]} {value} {onChange} label="Sessions" {content} />
