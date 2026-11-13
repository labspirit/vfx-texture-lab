/* GIF89a encoder with a fixed RGB332 palette and bounded 9-bit LZW blocks.
   Frequent clear codes keep encoding deterministic, memory bounded and offline. */
(() => {
'use strict';
class GifEncoder {
 constructor(width,height,transparent=true,loop=true){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>512||height>512)throw Error('GIF 크기는 1~512px입니다.');
  this.width=width;this.height=height;this.transparent=transparent;this.parts=[];const out=[];const word=v=>out.push(v&255,(v>>8)&255);out.push(...Array.from('GIF89a',c=>c.charCodeAt(0)));word(width);word(height);out.push(0xf7,0,0);
  for(let i=0;i<256;i++)out.push(Math.round(((i>>5)&7)*255/7),Math.round(((i>>2)&7)*255/7),Math.round((i&3)*255/3));
  if(loop)out.push(0x21,0xff,11,...Array.from('NETSCAPE2.0',c=>c.charCodeAt(0)),3,1,0,0,0);
  this.parts.push(Uint8Array.from(out));
 }
 addFrame(rgba,delayCentiseconds){
  const n=this.width*this.height;if(rgba.length!==n*4)throw Error('GIF 프레임 크기가 일치하지 않습니다.');
  const header=Uint8Array.from([0x21,0xf9,4,this.transparent?9:8,delayCentiseconds&255,(delayCentiseconds>>8)&255,0,0,0x2c,0,0,0,0,this.width&255,this.width>>8,this.height&255,this.height>>8,0,8]);this.parts.push(header);
  const maxCodes=n+Math.ceil(n/200)+2,bytes=new Uint8Array(Math.ceil(maxCodes*9/8));let acc=0,bits=0,cursor=0,count=0;
  const code=v=>{acc|=v<<bits;bits+=9;while(bits>=8){bytes[cursor++]=acc&255;acc>>>=8;bits-=8;}};
  code(256);
  for(let i=0;i<n;i++){if(count===200){code(256);count=0;}const at=i*4,alpha=rgba[at+3]/255;let index;if(this.transparent&&alpha<.1)index=0;else{const factor=this.transparent?1:alpha;const r=Math.min(7,Math.round(rgba[at]*factor*7/255)),g=Math.min(7,Math.round(rgba[at+1]*factor*7/255)),b=Math.min(3,Math.round(rgba[at+2]*factor*3/255));index=(r<<5)|(g<<2)|b;if(this.transparent&&index===0)index=1;}code(index);count++;}
  code(257);if(bits>0)bytes[cursor++]=acc&255;
  const blocks=new Uint8Array(cursor+Math.ceil(cursor/255)+1);let offset=0;for(let pos=0;pos<cursor;pos+=255){const len=Math.min(255,cursor-pos);blocks[offset++]=len;blocks.set(bytes.subarray(pos,pos+len),offset);offset+=len;}blocks[offset]=0;this.parts.push(blocks);
 }
 finish(){return new Blob([...this.parts,Uint8Array.of(0x3b)],{type:'image/gif'});}
}
globalThis.EmberGifEncoder=GifEncoder;
})();
