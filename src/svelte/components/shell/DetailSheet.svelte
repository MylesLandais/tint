<script lang="ts">
  import Dialog from '../dialog/Dialog.svelte'
  import type { DialogProps } from '../dialog/types'
  let { ...rest }: DialogProps = $props()
</script>

<Dialog {...rest} placement="right" />
