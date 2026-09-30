<script lang="ts">
  import TintFluidForm from './TintFluidForm.svelte'
  import TextField from './TextField.svelte'

  let value = $state('')
</script>

<TintFluidForm title="Settings">
  <TextField id="fixture-name" label="Name" {value} onValueChange={(next) => value = next} />
</TintFluidForm>
