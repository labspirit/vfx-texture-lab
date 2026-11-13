/* Filters operate in premultiplied color; output is converted to straight alpha. */
globalThis.EmberPostShader = `precision highp float;
varying vec2 uv;uniform sampler2D src;
uniform vec4 stops[8];uniform float stopCount,resolution;
uniform vec4 fx1,fx2,fx3;
uniform vec2 directional;
uniform float blur,bloom,sharp,mask,gradient,channel,bypass,opaque,seamless,blendWidth;
float val(vec2 p){return texture2D(src,clamp(p,.0001,.9999)).r;}
vec3 color(float v){if(gradient<.5)return vec3(1.);vec3 result=stops[0].rgb;for(int i=1;i<8;i++){if(float(i)<stopCount){float t=clamp((v-stops[i-1].w)/max(.0001,stops[i].w-stops[i-1].w),0.,1.);result=mix(result,stops[i].rgb,t);}}return result;}
float gaussian(vec2 p,float radius){vec2 d=vec2(radius/resolution,0.);return (val(p)*4.+2.*(val(p+d)+val(p-d)+val(p+d.yx)+val(p-d.yx))+val(p+d+d.yx)+val(p+d-d.yx)+val(p-d+d.yx)+val(p-d-d.yx))/16.;}
float sobel(vec2 p){vec2 d=vec2(1./resolution,0.);float a=val(p-d-d.yx),b=val(p-d.yx),c=val(p+d-d.yx),e=val(p-d),f=val(p+d),g=val(p-d+d.yx),h=val(p+d.yx),i=val(p+d+d.yx);return length(vec2(-a-2.*e-g+c+2.*f+i,-a-2.*b-c+g+2.*h+i));}
vec2 mapped(vec2 p){if(bypass>.5)return p;if(fx2.z>.5)p=abs(p-.5)*2.;vec2 z=p-.5;float r=length(z),a=atan(z.y,z.x);if(abs(fx3.x)>.001)a+=fx3.x*(1.-smoothstep(0.,.75,r))*3.;if(fx2.y>1.){float sector=6.2831853/fx2.y;a=abs(mod(a,sector)-sector*.5);}p=vec2(cos(a),sin(a))*r+.5;if(fx1.x>1.)p=(floor(p*(resolution/fx1.x))+.5)/(resolution/fx1.x);return p;}
float softened(vec2 p){return blur>.001?gaussian(p,blur):val(p);}
float directionalBlur(vec2 p){vec2 d=vec2(cos(directional.y),sin(directional.y))*directional.x/resolution;float v=0.;for(int i=0;i<13;i++)v+=softened(p+d*(float(i)/12.-.5));return v/13.;}
float filtered(vec2 p){float v=val(p);if(bypass>.5)return v;v=directional.x>.001?directionalBlur(p):softened(p);if(sharp>.001)v=clamp(v+(v-gaussian(p,1.5))*sharp*3.,0.,1.);if(bloom>.001)v=clamp(v+gaussian(p,3.+bloom*4.)*bloom*.9,0.,1.);if(fx3.y>.001)v=clamp(sobel(p)*fx3.y,0.,1.);if(fx3.z>1.){float levels=max(1.,floor(fx3.z)-1.);v=floor(clamp(v,0.,1.)*levels+.5)/levels;}return clamp(v,0.,1.);}
vec4 samplePost(vec2 q){vec2 p=mapped(q);float v=filtered(p);float vr=v,vb=v;if(bypass<.5&&fx1.y>.001){vec2 d=vec2(fx1.y/resolution,0.);vr=filtered(p+d);vb=filtered(p-d);}float a=max(v,max(vr,vb));vec3 premul=vec3(color(vr).r*vr,color(v).g*v,color(vb).b*vb);if(bypass<.5){float attenuation=1.-fx1.z*smoothstep(.15,.7,length(q-.5));if(fx2.x>.001)attenuation*=1.-fx2.x*(1.-step(1.,mod(floor(q.y*min(resolution,512.)),3.)));if(mask>.5)attenuation*=1.-smoothstep(.32,.68,length(q-.5));premul*=attenuation;a*=attenuation;}return vec4(premul,a);}
void main(){vec4 result;if(seamless>.5){vec2 p=clamp((uv*resolution-.5)/max(1.,resolution-1.),0.,1.);vec2 weight=.5*(1.-smoothstep(vec2(0.),vec2(blendWidth),min(p,1.-p)));vec2 shift=vec2(p.x<.5?1.:-1.,p.y<.5?1.:-1.);result=mix(mix(samplePost(p),samplePost(p+vec2(shift.x,0.)),weight.x),mix(samplePost(p+vec2(0.,shift.y)),samplePost(p+shift),weight.x),weight.y);}else result=samplePost(uv);
 float alpha=clamp(result.a,0.,1.);vec3 rgb=alpha>.00001?clamp(result.rgb/alpha,0.,1.):vec3(0.);if(channel>.5&&channel<1.5){rgb=vec3(alpha);alpha=1.;}else if(channel>1.5||opaque>.5){rgb=result.rgb;alpha=1.;}gl_FragColor=vec4(rgb,alpha);
}`;
