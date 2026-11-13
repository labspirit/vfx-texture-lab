import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
await import('./catalog.js');await import('./model.js');await import('./gif.js');await import('./view.js');await import('./layout.js');
const M=globalThis.EmberModel;
assert.equal(EmberCatalog.groups.flatMap(g=>g[2].split(' ')).length,117);
assert.equal(M.materials.length,119);assert.equal(new Set(M.materialOrder).size,119);
for(const [name]of M.materials.slice(12))assert.equal(typeof EmberCatalog.fields[name],'string',name+' needs a procedural field');
const sample=M.defaults();
assert.deepEqual(M.parse({format:'ember-texture-studio',version:2,state:sample}),sample);
const old=M.clone(sample);delete old.tiling;delete old.tileBlend;assert.equal(M.validate(old).tiling,false);
delete old.directionalAngle;delete old.effects.directional;assert.equal(M.validate(old).effects.directional.enabled,false);
const view={zoom:.75,x:23,y:-41},point={x:101,y:53};const next=EmberViewport.zoomAt(view,2.5,point);
assert(Math.abs((point.x-view.x)/view.zoom-(point.x-next.x)/next.zoom)<1e-9);
assert(Math.abs((point.y-view.y)/view.zoom-(point.y-next.y)/next.zoom)<1e-9);
assert.equal(EmberViewport.zoomAt(view,100,point).zoom,16);
const camera={view:{zoom:1.25,x:55,y:-19},repeat:false,fitMode:true,paint(){}};const beforeCamera={...camera.view};EmberViewport.prototype.setRepeat.call(camera,true);assert.deepEqual(camera.view,beforeCamera);EmberViewport.prototype.setRepeat.call(camera,false);assert.deepEqual(camera.view,beforeCamera);
for(const width of [721,900,1280,1920])for(const scale of [.8,1,1.4]){const d=EmberLayout.dimensions(width,{scale,left:440,right:460});assert(d.left>=140&&d.right>=170);assert(d.left+d.right+d.rail+12+219<=width);}
for(const mutate of [s=>s.layers[0].opacity=NaN,s=>s.layers[0].type=999,s=>s.stops[0].color='<script>',s=>s.effects.bloom.value=99,s=>s.layers[0].blend='unknown']){const bad=M.clone(sample);mutate(bad);assert.throws(()=>M.validate(bad));}
const flat={width:3,height:3,data:new Uint8ClampedArray(36)};
for(let i=0;i<36;i+=4)flat.data[i+3]=128;
const normal=M.normalMap(flat);assert.deepEqual([...normal.data.slice(0,4)],[128,128,255,255]);
const packed=M.pack(flat,normal,['a','nx','nz','one']);assert.deepEqual([...packed.data.slice(0,4)],[128,128,255,255]);
const qa=path.join(root,'.qa');fs.mkdirSync(qa,{recursive:true});
const gif=new EmberGifEncoder(32,32,true,true);
for(let f=0;f<3;f++){const frame=new Uint8ClampedArray(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;frame[i]=f===0?255:x*8;frame[i+1]=f===1?255:y*8;frame[i+2]=f===2?255:0;frame[i+3]=(x<8&&y<8)?0:255;}gif.addFrame(frame,10);}
fs.writeFileSync(path.join(qa,'encoder.gif'),new Uint8Array(await gif.finish().arrayBuffer()));
const bundle=fs.readFileSync(path.join(root,'Ember.html'),'utf8');assert(!/<script[^>]+src=|<link[^>]+href=/.test(bundle),'Standalone bundle must have no external files');
console.log('Passed: preset roundtrip, invalid inputs, normal map, channel pack, standalone bundle. Wrote GIF decoder fixture.');
