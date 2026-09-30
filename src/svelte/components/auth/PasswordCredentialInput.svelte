<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import PasswordField from '../../form/PasswordField.svelte'

  type Props = Omit<ComponentProps<typeof PasswordField>, 'id'> & { id?: string }
  let { id: suppliedId, ...rest }: Props = $props()
  const generatedId = $props.id()
  let id = $derived(suppliedId ?? generatedId)
</script>

<PasswordField {id} {...rest} />
