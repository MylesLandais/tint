<script lang="ts">
  import { SessionHeader, ParticipantList, RequestQueue, SyncStatus, StageView, Button } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import { SessionFixture } from './fixtures/session/fakeSession'
  import type { SessionParticipantView, SessionRequestView, SessionPlaybackState } from '../svelte'
  const fixture = new SessionFixture()
  let snapshot = $state(fixture.state)
  let description = $state('Initial session')
  const participants = $derived<SessionParticipantView[]>(snapshot.participants.map((p) => ({id:p.principal_id,name:'Viewer',kind:'human',state:p.state as SessionParticipantView['state'],connections:snapshot.connections.filter((c)=>c.principal_id===p.principal_id&&c.attached).length,ready:snapshot.connections.some((c)=>c.principal_id===p.principal_id&&c.ready&&c.playback_instance_id===snapshot.playback.playback_instance_id)})))
  const requests = $derived<SessionRequestView[]>(snapshot.items.filter((i)=>i.state==='pending'||i.state==='playing').map((i)=>({id:i.item_id,title:i.source.title??'Film',requestedBy:'Viewer',current:i.state==='playing'})))
  function advance(){snapshot=fixture.advance();description=`${fixture.step?.now_ms} ms · ${fixture.step?.command.action}`}
</script>
<DocPage title="Watch together" description="Controlled session presentation. The host owns authorization, playback and presence; these examples replay Rust-validated snapshots with injected time." importPath="@nebula/tint/session" usage={'<SessionHeader channel="film" activity="watch" mode="text" />'} api={[]} accessibility="Participants, queue and synchronization status use named regions and text labels. The host provides keyboard accessible transport controls.">
  <SessionHeader channel="movie-night" activity="watch" mode="text" participantCount={participants.length}/>
  <p>{description}</p>
  <Button onclick={advance}>Next committed example</Button>
  <Button onclick={()=>{snapshot=fixture.reset();description='Initial session'}}>Reset</Button>
  <StageView state={snapshot.playback.state as SessionPlaybackState}><div class="stage">{snapshot.playback.item_id ? 'Film' : 'Nothing playing'}</div></StageView>
  <SyncStatus desiredMs={snapshot.playback.position_ms} observedMs={snapshot.playback.position_ms} state={snapshot.playback.state as SessionPlaybackState}/>
  <ParticipantList {participants}/>
  <RequestQueue {requests}/>
</DocPage>
<style>.stage{min-height:16rem;display:grid;place-items:center}</style>
