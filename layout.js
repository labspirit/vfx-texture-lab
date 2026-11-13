/* Workspace preferences are independent of texture presets and exported pixels. */
(() => {
'use strict';
const defaults={scale:1,left:174,right:226},key='ember-ui-layout-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function dimensions(width,prefs){const rail=66*prefs.scale,available=Math.max(310,width-rail-12-220);let left=prefs.left*prefs.scale,right=prefs.right*prefs.scale;if(left+right>available){left=clamp(left/(left+right)*available,140,available-170);right=available-left;}return{rail,left,right};}
class Layout {
 constructor(root){this.root=root;this.prefs={...defaults};try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&[saved.scale,saved.left,saved.right].every(Number.isFinite)){this.prefs={scale:clamp(saved.scale,.8,1.4),left:clamp(saved.left,140,440),right:clamp(saved.right,170,460)};}}catch{}
  this.scale=document.getElementById('ui-scale');this.scale.oninput=()=>{this.prefs.scale=Number(this.scale.value)/100;this.apply();this.save();};document.getElementById('reset-ui').onclick=()=>{this.prefs={...defaults};this.apply();this.save();};
  for(const side of ['left','right']){const separator=document.getElementById(side+'-splitter');separator.setAttribute('aria-valuemin','0');separator.setAttribute('aria-valuemax','1000');let drag;
   separator.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,width:this.sizes[side]};separator.setPointerCapture(e.pointerId);document.body.classList.add('resizing-panels');});
   separator.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const delta=(e.clientX-drag.x)*(side==='left'?1:-1);this.prefs[side]=clamp((drag.width+delta)/this.prefs.scale,side==='left'?140:170,side==='left'?440:460);this.apply();});
   const finish=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;if(separator.hasPointerCapture(e.pointerId))separator.releasePointerCapture(e.pointerId);document.body.classList.remove('resizing-panels');this.save();};for(const event of ['pointerup','pointercancel','lostpointercapture'])separator.addEventListener(event,finish);
   separator.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')this.prefs[side]=defaults[side];else{const delta=(e.key==='ArrowRight'?1:-1)*(side==='left'?1:-1)*(e.shiftKey?32:8);this.prefs[side]=clamp((this.sizes[side]+delta)/this.prefs.scale,side==='left'?140:170,side==='left'?440:460);}this.apply();this.save();});
   separator.addEventListener('dblclick',()=>{this.prefs[side]=defaults[side];this.apply();this.save();});
  }
  this.observer=new ResizeObserver(()=>this.apply());this.observer.observe(root);this.apply();
 }
 apply(){this.sizes=dimensions(this.root.getBoundingClientRect().width,this.prefs);this.root.style.setProperty('--ui-scale',this.prefs.scale);this.root.style.setProperty('--left-panel',this.sizes.left.toFixed(1)+'px');this.root.style.setProperty('--right-panel',this.sizes.right.toFixed(1)+'px');this.scale.value=Math.round(this.prefs.scale*100);document.getElementById('ui-scale-value').textContent=Math.round(this.prefs.scale*100)+'%';for(const side of ['left','right'])document.getElementById(side+'-splitter').setAttribute('aria-valuenow',String(Math.round(this.sizes[side])));}
 save(){try{localStorage.setItem(key,JSON.stringify(this.prefs));}catch{}}
}
Layout.dimensions=dimensions;globalThis.EmberLayout=Layout;
})();
