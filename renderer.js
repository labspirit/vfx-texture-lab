/* Render each layer to an image, transform/composite those images, then apply post effects. */
(() => {
'use strict';
const vertex = `attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const source = `precision highp float;
varying vec2 uv;
uniform vec4 layers[8],params[8],transforms[8],motion[8];
uniform float seeds[8],time,loop,activeLayer;
const float PI=3.14159265359;
float hash(vec2 p,float seed){return fract(sin(dot(p,vec2(127.1,311.7))+seed*7.13)*43758.5453);}
float noise(vec2 p,float seed){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i,seed),hash(i+vec2(1,0),seed),f.x),mix(hash(i+vec2(0,1),seed),hash(i+vec2(1,1),seed),f.x),f.y);}
float fbm(vec2 p,float seed){float v=0.,a=.55;for(int i=0;i<4;i++){v+=noise(p,seed)*a;p=p*2.03+3.7;a*=.49;}return v;}
float ring(float r,float radius,float width){return exp(-pow((r-radius)/width,2.));}
float disk(vec2 p,float radius){return 1.-smoothstep(radius-.015,radius+.015,length(p));}
float line(float x,float width){return 1.-smoothstep(width*.5,width,min(x,1.-x));}
float cells(vec2 q){vec2 g=floor(q),f=fract(q);float d1=10.,d2=10.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 b=vec2(float(x),float(y));vec2 o=vec2(hash(g+b,3.),hash(g+b,7.));float d=length(b+o-f);if(d<d1){d2=d1;d1=d;}else d2=min(d2,d);}return d2-d1;}
float field(float type,float radius,vec2 p,float scale,float warp,float seed,vec4 m){
 float t=time*2.*PI,r=length(p),a=atan(p.y,p.x);vec2 orbit=loop>.5?vec2(cos(t),sin(t)):vec2(time*.8,time*1.3);
 vec2 shift=m.xy*(loop>.5?sin(t):time)*3.;vec2 np=p*scale;
 float n=fbm(np+orbit*.55+shift,seed),fine=fbm(np*3.1-orbit*.8+shift,seed+13.);
 float rr=r+(n-.45)*warp*.3,v=0.;vec2 q=p*scale*2.+shift+orbit*.2,g=floor(q),f=fract(q);
 if(type<.5){float d=abs(rr-radius);v=exp(-d*d/.0007)*(.4+fine*.9)+exp(-d*d/.006)*.14;}
 else if(type<1.5)v=n*.5+fine*.6;
 else if(type<2.5)v=exp(-r*r/(radius*radius*.3))*.65;
 else if(type<3.5){float rays=pow(max(0.,cos(a*41.+sin(a*7.)*2.+t)),18.);v=rays*exp(-pow((r-radius)/.22,2.));}
 else if(type<4.5){float h=(p.y+1.)*.5;float width=max(.015,(1.-h)*radius*.7);float x=p.x+(n-.5)*warp*.8;v=(1.-smoothstep(width*.15,width,abs(x)))*(1.-smoothstep(.6,1.,h))*smoothstep(0.,.08,h)*(.15+pow(max(0.,1.-abs(n-.48)*2.),5.)*.6+fine*.35);}
 else if(type<5.5){float x=sin(p.y*7.+t)*.12+(n-.5)*.25;v=exp(-pow((p.x-x)*80.,2.))*(1.-smoothstep(.65,1.,abs(p.y)));}
 else if(type<6.5)v=pow(.5+.5*sin(p.x*40.+n*warp*12.+t),5.);
 else if(type<7.5){float spiral=sin(a*5.+r*22.-t);v=pow(max(0.,spiral),10.)*exp(-r*r*2.);}
 else if(type<8.5)v=pow(max(0.,n*.7+fine*.4-.2),1.2)*exp(-r*r/(radius*radius))*1.2;
 else if(type<9.5){float thick=.025+.07*max(0.,sin(a));float arc=smoothstep(-.4,.1,a)*(1.-smoothstep(2.6,3.1,a));v=exp(-pow((rr-radius)/thick,2.))*arc;}
 else if(type<10.5){float ray=max(exp(-abs(p.x)*50.)*exp(-p.y*p.y*4.),exp(-abs(p.y)*50.)*exp(-p.x*p.x*4.));v=ray+exp(-r*r*80.)*.6;}
 else if(type<11.5){float rings=sin(rr*40.-t*2.);v=pow(max(0.,rings),8.)*exp(-r*r/(radius*radius));}
 ${EmberModel.materials.slice(12).map(([name],i)=>`else if(type<${(i+12.5).toFixed(1)})v=${EmberCatalog.fields[name]};`).join('\n')}
 v=clamp(v,0.,1.);return m.w>.5?1.-v:v;
}
void main(){float total=0.;for(int i=7;i>=0;i--){vec4 l=layers[i];if(l.z>.5&&abs(float(i)-activeLayer)<.1){vec4 param=params[i],tr=transforms[i];vec2 p=(uv-.5)*2.-tr.xy*2.;p/=max(tr.zw,vec2(.05));float c=cos(param.w),s=sin(param.w);p=mat2(c,-s,s,c)*p;total=field(l.x,param.x,p,param.y,param.z,seeds[i],motion[i]);}}
 gl_FragColor=vec4(vec3(clamp(total,0.,1.)),1.);
}`;
const post = globalThis.EmberPostShader;
const composite = `precision highp float;varying vec2 uv;
uniform sampler2D image0,image1,image2,image3,image4,image5,image6,image7;
uniform vec4 layers[8];uniform float polar[8],resolution;
float sampleImage(sampler2D image,float polarEnabled){vec2 p=uv;float mask=1.;if(polarEnabled>.5){vec2 q=(uv-.5)*2.;float r=length(q);if(r>=1.)return 0.;p=vec2(fract(atan(q.y,q.x)/6.28318530718+.5),r);mask=1.-smoothstep(1.-2./resolution,1.,r);}return texture2D(image,p).r*mask;}
float blend(float total,float value,vec4 l){float o=l.y;if(l.w<.5)return mix(total,value,o);if(l.w<1.5)return total+value*o;if(l.w<2.5)return total*mix(1.,value,o);if(l.w<3.5)return 1.-(1.-total)*(1.-value*o);return total*mix(1.,value,o);}
void main(){float v=0.;
if(layers[7].z>.5)v=blend(v,sampleImage(image7,polar[7]),layers[7]);
if(layers[6].z>.5)v=blend(v,sampleImage(image6,polar[6]),layers[6]);
if(layers[5].z>.5)v=blend(v,sampleImage(image5,polar[5]),layers[5]);
if(layers[4].z>.5)v=blend(v,sampleImage(image4,polar[4]),layers[4]);
if(layers[3].z>.5)v=blend(v,sampleImage(image3,polar[3]),layers[3]);
if(layers[2].z>.5)v=blend(v,sampleImage(image2,polar[2]),layers[2]);
if(layers[1].z>.5)v=blend(v,sampleImage(image1,polar[1]),layers[1]);
if(layers[0].z>.5)v=blend(v,sampleImage(image0,polar[0]),layers[0]);
gl_FragColor=vec4(vec3(clamp(v,0.,1.)),1.);}`;
const blends={normal:0,add:1,multiply:2,screen:3,mask:4};
class Renderer {
 constructor(){
  this.canvas=document.createElement('canvas');this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});
  if(!this.gl)throw Error('WebGL을 사용할 수 없습니다. 하드웨어 가속을 지원하는 브라우저로 열어주세요.');
  const gl=this.gl;this.maxSize=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const make=fragment=>{const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const locations={};return{p,loc:k=>locations[k]??(locations[k]=gl.getUniformLocation(p,k))};};
  this.source=make(source);this.composite=make(composite);this.post=make(post);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);this.texture=this.makeTexture();this.zero=this.makeTexture();gl.bindTexture(gl.TEXTURE_2D,this.zero);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));this.layerTextures=[];this.layerSizes=[];this.fbo=gl.createFramebuffer();this.size=0;
 }
 makeTexture(){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);for(const [k,v]of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);return t;}
 use(prog){const gl=this.gl;gl.useProgram(prog.p);const a=gl.getAttribLocation(prog.p,'a');gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);}
 render(target,state,options={}){
  const gl=this.gl,size=options.size||Math.min(state.resolution,512),time=options.time??state.time,channel=options.channel??'rgba';gl.activeTexture(gl.TEXTURE0);
  if(!Number.isInteger(size)||size<16||size>this.maxSize)throw Error('지원하지 않는 출력 크기입니다.');
  if(gl.isContextLost())throw Error('그래픽 연결이 중단되었습니다. 새로고침 후 프리셋을 다시 열어주세요.');
  if(size!==this.size){this.canvas.width=size;this.canvas.height=size;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('출력 버퍼를 만들지 못했습니다. 해상도를 낮춰주세요.');this.size=size;}
  gl.viewport(0,0,size,size);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);this.use(this.source);
  const layers=options.material===undefined?state.layers:[{...state.layers[0],type:options.material,opacity:1,visible:true,blend:'add',radius:.62,seed:42,rotation:0,offsetX:0,offsetY:0,scaleX:1,scaleY:1,polar:false,invert:false}];
  const a=[],p=[],tr=[],m=[],seeds=[];for(let i=0;i<8;i++){const l=layers[i];a.push(...(l?[l.type,l.opacity,l.visible?1:0,blends[l.blend]]:[0,0,0,0]));p.push(...(l?[l.radius,l.noise,l.distort,l.rotation*Math.PI/180]:[.6,4,.3,0]));tr.push(...(l?[l.offsetX,l.offsetY,l.scaleX,l.scaleY]:[0,0,1,1]));m.push(...(l?[l.scrollX,l.scrollY,l.polar?1:0,l.invert?1:0]:[0,0,0,0]));seeds.push(l?.seed??42);}
  for(const [key,value]of [['layers',a],['params',p],['transforms',tr],['motion',m]])gl.uniform4fv(this.source.loc(key+'[0]'),new Float32Array(value));gl.uniform1fv(this.source.loc('seeds[0]'),new Float32Array(seeds));gl.uniform1f(this.source.loc('time'),time);gl.uniform1f(this.source.loc('loop'),state.loop?1:0);
  for(let i=0;i<layers.length;i++){if(!layers[i].visible)continue;if(!this.layerTextures[i])this.layerTextures[i]=this.makeTexture();gl.bindTexture(gl.TEXTURE_2D,this.layerTextures[i]);if(this.layerSizes[i]!==size){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);this.layerSizes[i]=size;}gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.layerTextures[i],0);gl.uniform1f(this.source.loc('activeLayer'),i);gl.drawArrays(gl.TRIANGLES,0,6);}
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);this.use(this.composite);gl.uniform4fv(this.composite.loc('layers[0]'),new Float32Array(a));gl.uniform1fv(this.composite.loc('polar[0]'),new Float32Array(Array.from({length:8},(_,i)=>layers[i]?.polar?1:0)));gl.uniform1f(this.composite.loc('resolution'),size);for(let i=0;i<8;i++){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,layers[i]?.visible?this.layerTextures[i]:this.zero);gl.uniform1i(this.composite.loc('image'+i),i);}gl.drawArrays(gl.TRIANGLES,0,6);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.use(this.post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.post.loc('src'),0);
  const stops=[];for(let i=0;i<8;i++){const s=state.stops[Math.min(i,state.stops.length-1)];stops.push(...[1,3,5].map(j=>parseInt(s.color.slice(j,j+2),16)/255),s.position);}gl.uniform4fv(this.post.loc('stops[0]'),new Float32Array(stops));gl.uniform1f(this.post.loc('stopCount'),state.stops.length);
  const ev=k=>state.effects[k]?.enabled?state.effects[k].value:0;gl.uniform4f(this.post.loc('fx1'),ev('pixel'),ev('rgb'),ev('vignette'),0);gl.uniform4f(this.post.loc('fx2'),ev('scan'),ev('kaleido'),ev('mirror'),0);gl.uniform4f(this.post.loc('fx3'),ev('swirl'),ev('edge'),ev('toon'),0);gl.uniform2f(this.post.loc('directional'),ev('directional'),(state.directionalAngle||0)*Math.PI/180);
  for(const [key,value]of Object.entries({resolution:size,blur:ev('blur'),bloom:ev('bloom'),sharp:ev('sharp'),mask:ev('mask'),gradient:state.gradient?1:0,channel:channel==='alpha'?1:channel==='rgb'?2:0,bypass:options.bypass||options.material!==undefined?1:0,opaque:options.opaque?1:0,seamless:state.tiling&&options.material===undefined?1:0,blendWidth:state.tileBlend??.2}))gl.uniform1f(this.post.loc(key),value);
  gl.drawArrays(gl.TRIANGLES,0,6);if(target.width!==size||target.height!==size){target.width=size;target.height=size;}const ctx=target.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('이미지 캔버스를 만들지 못했습니다.');ctx.clearRect(0,0,size,size);ctx.drawImage(this.canvas,0,0);
 }
}
globalThis.EmberRenderer=Renderer;
})();
