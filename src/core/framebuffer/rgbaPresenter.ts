/// <reference types="@webgpu/types" />
/** A decoded image the GPU can copy directly: a PNG `ImageBitmap` or a WebCodecs `VideoFrame`. */
export type DecodedImage = ImageBitmap | VideoFrame
const imageSize = (image: DecodedImage) => 'displayWidth' in image ? [image.displayWidth, image.displayHeight] as const : [image.width, image.height] as const
/** `drawBitmap` uploads a decoded straight-alpha image directly, skipping a CPU pixel readback. */
export type Presenter = {draw:(pixels:Uint8ClampedArray,width:number,height:number)=>void;drawBitmap?:(bitmap:DecodedImage)=>void;destroy:()=>void;backend:string}
async function gpuRequest<T>(request:Promise<T>,onLate?:(value:T)=>void):Promise<T> {
  let expired=false,timer:ReturnType<typeof setTimeout>|undefined
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error('GPU initialization timed out'))},2000)})
  try{return await Promise.race([request.then(value=>{if(expired)onLate?.(value);return value}),timeout])}
  finally{clearTimeout(timer)}
}
/** A hardware compatibility adapter can be available when Core offers only software. */
export async function requestFrameAdapter(gpu:GPU):Promise<GPUAdapter|null> {
  let core:GPUAdapter|null=null
  try {core=await gpuRequest(gpu.requestAdapter())}catch{/* Try the smaller feature set before WebGL2. */}
  if(core&&!core.info?.isFallbackAdapter)return core
  // Frame upload, textureLoad and a single render target fit Compatibility mode.
  // In particular, Linux GLES hardware may expose this while Core uses SwiftShader.
  try {
    const compatible=await gpuRequest(gpu.requestAdapter({featureLevel:'compatibility'}))
    if(compatible&&!compatible.info?.isFallbackAdapter)return compatible
    return core??compatible
  }catch{return core}
}
export async function rgbaPresenter(canvas:HTMLCanvasElement,forceWebGL=false):Promise<Presenter> {
  if(!forceWebGL && navigator.gpu) {
    let adapter:GPUAdapter|null=null,device:GPUDevice|undefined
    try {adapter=await requestFrameAdapter(navigator.gpu);if(adapter)device=await gpuRequest(adapter.requestDevice(),late=>late.destroy())}catch{/* Try WebGL2 when WebGPU initialization is unavailable. */}
    if(adapter&&device) {
      const gpu=device,context=canvas.getContext('webgpu')!
      const format=navigator.gpu.getPreferredCanvasFormat()
      context.configure({device:gpu,format,alphaMode:'premultiplied'})
      const shader=gpu.createShaderModule({code:`
        @vertex fn vertex(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
          var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return vec4f(p[i],0,1);
        }
        @group(0) @binding(0) var frame:texture_2d<f32>;
        @fragment fn fragment(@builtin(position) p:vec4f)->@location(0) vec4f {
          let c=textureLoad(frame,vec2i(p.xy),0);return vec4f(c.rgb*c.a,c.a);
        }`})
      const pipeline=gpu.createRenderPipeline({layout:'auto',vertex:{module:shader,entryPoint:'vertex'},fragment:{module:shader,entryPoint:'fragment',targets:[{format}]}})
      let texture:GPUTexture|undefined,binding:GPUBindGroup,width=0,height=0,lost=false,uploaded:Uint8ClampedArray|undefined
      void gpu.lost.then(()=>{lost=true;canvas.dispatchEvent(new Event('framecontextlost'))})
      // External image copies need RENDER_ATTACHMENT on the destination texture.
      const allocate=(w:number,h:number)=>{
        if(lost)throw new Error('WebGPU device lost')
        if(w===width&&h===height)return
        texture?.destroy();width=w;height=h;canvas.width=w;canvas.height=h;uploaded=undefined
        texture=gpu.createTexture({size:[w,h],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT})
        binding=gpu.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:texture.createView()}]})
      }
      const render=()=>{
        const command=gpu.createCommandEncoder(),pass=command.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:[0,0,0,0]}]})
        pass.setPipeline(pipeline);pass.setBindGroup(0,binding!);pass.draw(3);pass.end();gpu.queue.submit([command.finish()])
      }
      return {backend:'WebGPU',draw(pixels,w,h){
        allocate(w,h)
        if(uploaded!==pixels){gpu.queue.writeTexture({texture:texture!},pixels as Uint8ClampedArray<ArrayBuffer>,{bytesPerRow:w*4},[w,h]);uploaded=pixels}
        render()
      },drawBitmap(bitmap){
        const [w,h]=imageSize(bitmap)
        allocate(w,h)
        // The shader premultiplies once, so the copy keeps straight alpha and source row order.
        gpu.queue.copyExternalImageToTexture({source:bitmap,flipY:false},{texture:texture!,premultipliedAlpha:false},[w,h])
        uploaded=undefined
        render()
      },destroy(){texture?.destroy();context.unconfigure();gpu.destroy()}}
    }
  }
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false})
  if(!gl)throw new Error('WebGPU and WebGL2 are unavailable')
  const compile=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Shader compilation failed');return s}
  const vertex=compile(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}')
  const fragment=compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;uniform sampler2D frame;uniform int height;out vec4 color;void main(){vec4 c=texelFetch(frame,ivec2(int(gl_FragCoord.x),height-1-int(gl_FragCoord.y)),0);color=vec4(c.rgb*c.a,c.a);}')
  const program=gl.createProgram()!;gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program)
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Frame shader link failed')
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST)
  const heightUniform=gl.getUniformLocation(program,'height')
  let width=0,height=0,uploaded:Uint8ClampedArray|undefined
  const prepare=(w:number,h:number)=>{
    if(gl.isContextLost())throw new Error('WebGL2 context lost')
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    gl.viewport(0,0,w,h);gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE)
  }
  const render=(h:number)=>{gl.uniform1i(heightUniform,h);gl.drawArrays(gl.TRIANGLES,0,3)}
  return {backend:'WebGL2',draw(pixels,w,h){
    prepare(w,h)
    if(width!==w||height!==h){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);width=w;height=h;uploaded=pixels}
    else if(uploaded!==pixels){gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);uploaded=pixels}
    render(h)
  },drawBitmap(bitmap){
    const [w,h]=imageSize(bitmap)
    prepare(w,h)
    // Storage is reallocated only when the size changes; later frames update it in place.
    if(width!==w||height!==h){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);width=w;height=h}
    else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bitmap)
    uploaded=undefined
    render(h)
  },destroy(){gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment)}}
}
