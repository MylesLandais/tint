import {useEffect,useRef,useState,type CanvasHTMLAttributes} from 'react'
import {rgbaPresenter} from './rgbaPresenter'

export type FramebufferProps = {url:string;accountId:string;encoding?:'rgba'|'png';mode?:'frame'|'map';onStatus?:(status:string)=>void;showStatus?:boolean;canvasProps?:CanvasHTMLAttributes<HTMLCanvasElement>}

/** Displays the account-bound raw RGBA stream supplied by a game runtime. */
export function Framebuffer({url,accountId,encoding='rgba',mode='frame',onStatus,showStatus=true,canvasProps}:FramebufferProps) {
  const canvas=useRef<HTMLCanvasElement>(null)
  const [status,setStatus]=useState('Connecting'),[generation,setGeneration]=useState(0)
  const statusCallback=useRef(onStatus);statusCallback.current=onStatus
  useEffect(()=>{statusCallback.current?.(status)},[status])
  useEffect(()=>{
    setStatus('Connecting')
    let closed=false,socket:WebSocket|undefined,timer=0,watchdog=0,lastFrame=Date.now(),session=''
    const scratch=encoding==='png'?new OffscreenCanvas(1,1):null
    const context=scratch?.getContext('2d')
    let destroy=()=>{}
    const element=canvas.current!
    const reconnect=()=>{if(!closed){setStatus('Reconnecting');clearTimeout(timer);timer=window.setTimeout(()=>setGeneration(v=>v+1),1000)}}
    const settings=()=>{lastFrame=Date.now();if(encoding==='png'&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({kind:mode,width:1280,height:720,paused:document.hidden}))}
    document.addEventListener('visibilitychange',settings)
    const lost=(event:Event)=>{event.preventDefault();reconnect()}
    element.addEventListener('webglcontextlost',lost);element.addEventListener('framecontextlost',lost)
    void rgbaPresenter(element,generation>0).then(presenter=>{
      if(closed){presenter.destroy();return}
      destroy=presenter.destroy
      socket=new WebSocket(url);socket.binaryType='arraybuffer'
      socket.onopen=settings
      watchdog=window.setInterval(()=>{if(!document.hidden&&socket?.readyState===WebSocket.OPEN&&Date.now()-lastFrame>5000){setStatus('Frames are stale');socket.close()}},1000)
      socket.onmessage=async event=>{
        if(closed)return
        let bitmap:ImageBitmap|undefined
        try{
          const buffer=event.data as ArrayBuffer
          if(buffer.byteLength<4)throw new Error('Truncated frame')
          const size=new DataView(buffer).getUint32(0)
          if(size>65536||size+4>buffer.byteLength)throw new Error('Invalid frame header')
          const header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,size)))
          const {width,height}=header
          if(header.account_id!==accountId||!header.session_id||(session&&session!==header.session_id))throw new Error('Frame session mismatch')
          if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>2048||height>2048||(encoding==='rgba'&&buffer.byteLength!==size+4+width*height*4))throw new Error('Invalid frame dimensions')
          session=header.session_id
          let pixels:Uint8ClampedArray
          if(encoding==='png'){
            bitmap=await createImageBitmap(new Blob([buffer.slice(size+4)],{type:'image/png'}))
            if(closed)return
            if(bitmap.width!==width||bitmap.height!==height)throw new Error('Frame image dimensions mismatch')
            if(scratch!.width!==width||scratch!.height!==height){scratch!.width=width;scratch!.height=height}
            context!.clearRect(0,0,width,height);context!.drawImage(bitmap,0,0)
            pixels=context!.getImageData(0,0,width,height).data
          }else pixels=new Uint8ClampedArray(buffer,size+4)
          lastFrame=Date.now()
          if(!document.hidden){presenter.draw(pixels,width,height);element.dataset.frameId=String(header.frame_id);element.dataset.sessionId=header.session_id;element.dataset.backend=presenter.backend;setStatus('Live')}
        }catch(error){if(!closed){setStatus(String(error));socket?.close()}}finally{bitmap?.close();if(!closed&&encoding==='png'&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'ack'}))}
      }
      socket.onclose=reconnect
    }).catch(error=>{if(!closed)setStatus(String(error))})
    return()=>{closed=true;clearTimeout(timer);clearInterval(watchdog);socket?.close();document.removeEventListener('visibilitychange',settings);element.removeEventListener('webglcontextlost',lost);element.removeEventListener('framecontextlost',lost);destroy()}
  },[url,accountId,encoding,mode,generation])
  return <div style={{width:'100%',height:'100%'}}><canvas {...canvasProps} key={`${url}:${accountId}:${encoding}:${mode}:${generation}`} ref={canvas} aria-label={`${accountId} native framebuffer`} style={{width:'100%',height:'100%',objectFit:'contain',...canvasProps?.style}}/>{showStatus&&<p role="status">{accountId} · {status}</p>}</div>
}
