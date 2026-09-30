<script lang="ts">
  import type { BoardCard as BoardCardModel } from '../../../core/board'
  import BoardDetail from './BoardDetail.svelte'
  let { card }: { card: BoardCardModel | null } = $props()
</script>

<BoardDetail {card}><p>Live surface</p></BoardDetail>
