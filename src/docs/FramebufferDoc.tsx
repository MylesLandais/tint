import {useEffect,useState} from 'react'
import {DocsPage} from './components/DocsPage'
import {WorkspaceLayout} from '../components/shell'
import {Framebuffer} from '../components/framebuffer'
export function FramebufferDoc(){
  const [accounts,setAccounts]=useState<string[]>([]),[account,setAccount]=useState(''),[error,setError]=useState('')
  useEffect(()=>{
    let closed=false,timer=0
    const refresh=async()=>{try{
      const response=await fetch('/api/workbench/list_sessions',{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Client':'workspace'},body:'{}'})
      if(!response.ok)throw new Error('Game runtime unavailable')
      const value=await response.json(),ids=value.sessions.map((s:{account_id:string})=>s.account_id) as string[]
      if(!closed){setAccounts(ids);setAccount(current=>ids.includes(current)?current:ids[0]??'');setError('')}
    }catch(e){if(!closed)setError(String(e))}if(!closed)timer=window.setTimeout(refresh,5000)}
    void refresh();return()=>{closed=true;clearTimeout(timer)}
  },[])
  const url=new URL(`/api/workbench/frames/${encodeURIComponent(account)}`,location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:'
  return <DocsPage route="components/framebuffer" title="PokéForce sessions" intro="Switch between your running game clients.">
    <WorkspaceLayout theme="pokeforce" toolbar={<div role="tablist" aria-label="Game clients" className="flex gap-1 overflow-x-auto border-b border-tint-border p-2">{accounts.map(id=><button key={id} role="tab" aria-selected={id===account} aria-controls="pokeforce-session-view" className={`rounded px-4 py-2 ${id===account?'bg-tint-accent text-white':'text-tint-muted'}`} onClick={()=>setAccount(id)}>{id}</button>)}</div>}
      primary={<div id="pokeforce-session-view" role="tabpanel" aria-label={account||'Game session'} style={{aspectRatio:'16 / 9'}}>{account?<Framebuffer key={account} accountId={account} url={url.href} showStatus={false}/>:<p>Waiting for connected game clients…</p>}</div>}/>
    {error&&<p role="alert">{error}</p>}
  </DocsPage>
}
