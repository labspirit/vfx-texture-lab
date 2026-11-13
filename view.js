/* Display-only artboard navigation. Export paths never include borders or repeats. */
(() => {
'use strict';
const zoomAt=(view,next,point)=>{const zoom=Math.min(16,Math.max(.02,next)),ratio=zoom/view.zoom;return{zoom,x:point.x-(point.x-view.x)*ratio,y:point.y-(point.y-view.y)*ratio};};
class Viewport {
 constructor(stage,source,onChange){
  this.stage=stage;this.source=source;this.onChange=onChange;this.resolution=512;this.repeat=false;this.checker=true;this.boundary=true;this.view={zoom:1,x:0,y:0};this.fitMode=true;this.width=1;this.height=1;this.drag=null;
  this.canvas=document.createElement('canvas');this.canvas.id='view-canvas';this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','텍스처 작업 영역. 휠로 확대·축소하고 왼쪽 또는 가운데 버튼으로 드래그해 이동합니다.');stage.prepend(this.canvas);this.ctx=this.canvas.getContext('2d');
  const pattern=document.createElement('canvas');pattern.width=pattern.height=24;const p=pattern.getContext('2d');p.fillStyle='#292d36';p.fillRect(0,0,24,24);p.fillStyle='#383d49';p.fillRect(0,0,12,12);p.fillRect(12,12,12,12);this.pattern=this.ctx.createPattern(pattern,'repeat');
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect(),factor=e.deltaMode===1?16:e.deltaMode===2?this.height:1;this.view=zoomAt(this.view,this.view.zoom*Math.exp(-e.deltaY*factor*.0015),{x:e.clientX-r.left-this.width/2,y:e.clientY-r.top-this.height/2});this.fitMode=false;this.paint();},{passive:false});
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1)return;e.preventDefault();this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,panX:this.view.x,panY:this.view.y};this.canvas.setPointerCapture(e.pointerId);this.canvas.classList.add('panning');});
  this.canvas.addEventListener('pointermove',e=>{if(!this.drag||this.drag.id!==e.pointerId)return;this.view.x=this.drag.panX+e.clientX-this.drag.x;this.view.y=this.drag.panY+e.clientY-this.drag.y;this.fitMode=false;this.paint();});
  const end=e=>{if(!this.drag||e.pointerId!==this.drag.id)return;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.drag=null;this.canvas.classList.remove('panning');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(type,end);
  this.canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});this.canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});this.canvas.addEventListener('dblclick',()=>this.fit());
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(stage);this.resize();
 }
 resize(){const rect=this.stage.getBoundingClientRect();this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);this.dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.max(1,Math.round(this.width*this.dpr));this.canvas.height=Math.max(1,Math.round(this.height*this.dpr));if(this.fitMode)this.fit(false);this.paint();}
 fit(paint=true){const count=this.repeat?3:1;this.view={zoom:Math.max(.02,Math.min(16,Math.min(this.width-72,this.height-72)/(this.resolution*count))),x:0,y:0};this.fitMode=true;if(paint)this.paint();}
 actual(){this.view={zoom:1,x:0,y:0};this.fitMode=false;this.paint();}
 setRepeat(value){this.repeat=!!value;this.fitMode=false;this.paint();}
 update(resolution){if(this.resolution!==resolution){this.resolution=resolution;this.fit();}else this.paint();}
 paint(){
  const ctx=this.ctx,w=this.width,h=this.height;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#17191f';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#20232a';ctx.lineWidth=1;ctx.beginPath();for(let x=w/2%32;x<w;x+=32){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,h);}for(let y=h/2%32;y<h;y+=32){ctx.moveTo(0,y+.5);ctx.lineTo(w,y+.5);}ctx.stroke();
  const size=this.resolution*this.view.zoom,cx=w/2+this.view.x,cy=h/2+this.view.y,left=cx-size/2,top=cy-size/2;const count=this.repeat?1:0;ctx.imageSmoothingEnabled=this.view.zoom<2;
  for(let y=-count;y<=count;y++)for(let x=-count;x<=count;x++){const px=left+x*size,py=top+y*size;if(px>w||py>h||px+size<0||py+size<0)continue;ctx.save();ctx.translate(px,py);ctx.fillStyle=this.checker?this.pattern:'#07090d';ctx.fillRect(0,0,size,size);if(this.source.width&&this.source.height)ctx.drawImage(this.source,0,0,size,size);if(this.boundary){ctx.strokeStyle=x===0&&y===0?'#b7aaff':'#626777';ctx.lineWidth=x===0&&y===0?1.6:1;ctx.strokeRect(.5,.5,Math.max(0,size-1),Math.max(0,size-1));}ctx.restore();}
  if(this.boundary&&size>55&&left+size>0&&left<w&&top>-h&&top<h){ctx.fillStyle='#cfc7ff';ctx.font='11px Segoe UI, sans-serif';ctx.fillText(this.resolution+' × '+this.resolution,left,top-8);}
  this.onChange?.({...this.view,repeat:this.repeat});
 }
}
Viewport.zoomAt=zoomAt;globalThis.EmberViewport=Viewport;
})();
