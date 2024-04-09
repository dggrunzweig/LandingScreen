var Q=Object.defineProperty;var X=(n,e,t)=>e in n?Q(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var a=(n,e,t)=>(X(n,typeof e!="symbol"?e+"":e,t),t);import*as _ from"https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();function d(n){return Math.pow(10,n/20)}function Y(n){let e=100,t=-100;for(let s=0;s<n.length;++s)e=Math.min(e,n[s]),t=Math.max(t,n[s]);return Math.max(t,Math.abs(e))}function $(n){let e=0;for(let s=0;s<n.length;++s)e+=n[s]*n[s];let t=e/n.length;return Math.sqrt(t)}function B(n,e,t){return new AudioBuffer({numberOfChannels:n,length:e,sampleRate:t})}function T(n,e,t,s,o){const r=n.createBiquadFilter();return r.type=e,r.frequency.value=t,r.Q.value=s,(e==="lowshelf"||e==="highshelf")&&(r.gain.value=o),r}function m(n,e=1){const t=n.createGain();return t.gain.value=e,t}function z(n,e,t,s){const o=n.createOscillator();return o.type=e,o.frequency.value=t,o.detune.value=s,o}function P(n,e){const t=n.createStereoPanner();return t.pan.value=e,t}function J(n,e,t,s){const o=n.createBufferSource();return o.buffer=e,o.playbackRate.value=t,o.loop=s,o}function Z(n,e=0,t=2){const s=n.sampleRate*t,o=B(1,s,n.sampleRate),r=o.getChannelData(0);for(let i=0;i<s;i++)r[i]=Math.random()*2-1,r[i]*=d(e);return J(n,o,1,!0)}function ee(n,e,t,s,o,r){const i=n.createDynamicsCompressor();return i.threshold.value=e,i.knee.value=t,i.ratio.value=s,i.attack.value=o,i.release.value=r,i}function W(n,e,t="4x"){const s=n.createWaveShaper();return s.curve=e,s.oversample=t,s}async function te(n,e,t=14e3,s=!1){let o=n.createConvolver();const r=oe(re(t,1,n.sampleRate)),i=n.sampleRate,h=Math.floor(e*i),l=B(2,h,i),u=.03*e,c=.97*e/(6.9/4),v=d(-4),b=Math.log(.001)/(.2*h),f=2*i,p=new Array(f).fill(0).map(g=>2*Math.random()-1);let M=Math.floor(.003*i);for(let g=0;g<2;++g){const q=l.getChannelData(g);r.x_z=[0,0],r.y_z=[0,0];for(let w=0;w<h;++w){const D=w/i,R=v*p[w*(10*g+1)%f]*se(D,u,c);let L=0;w%M==0&&(L=(-1)**w*Math.exp(b*w),M=Math.floor(.002+.004*Math.random()*i)),q[w]=ie(r,R)+L}}return s&&(l.getChannelData(0)[0]=1,l.getChannelData(1)[0]=1),o.buffer=l,o}function ne(){const n=new window.AudioContext;return n.suspend(),n}function y(n,e,t,s){n.setTargetAtTime(t,e,s)}function C(n,e,t){e=S(e,0,8),e=Math.floor(e);const o=(t??16.35)*Math.pow(2,e);switch(n){case"C":return o;case"C#":return o*Math.pow(2,1/12);case"D":return o*Math.pow(2,2/12);case"D#":return o*Math.pow(2,3/12);case"E":return o*Math.pow(2,4/12);case"F":return o*Math.pow(2,5/12);case"F#":return o*Math.pow(2,6/12);case"G":return o*Math.pow(2,7/12);case"G#":return o*Math.pow(2,8/12);case"A":return o*Math.pow(2,9/12);case"A#":return o*Math.pow(2,10/12);case"B":return o*Math.pow(2,11/12);default:return console.log("NoteToPitch: Unknown Note Provided"),o}}function S(n,e,t){return Math.min(Math.max(n,e),t)}function se(n,e,t){return n<=e?Math.min(Math.exp(.7*n/e)-1,1):Math.exp(-4*(n-e)/t)}function V(n,e){const t=1/e;return 60/(n*t/4)}function oe(n){return n==null?{coeffs:{b0:0,b1:0,b2:0,a0:0,a1:0,a2:0},x_z:[0,0],y_z:[0,0]}:{coeffs:n,x_z:[0,0],y_z:[0,0]}}function re(n,e,t){const s=2*Math.PI*n/t,o=Math.cos(s),i=Math.sin(s)/(2*e);return{b0:(1-o)/2,b1:1-o,b2:(1-o)/2,a0:1+i,a1:-2*o,a2:1-i}}function ie(n,e){const t=(e*n.coeffs.b0+n.x_z[0]*n.coeffs.b1+n.x_z[1]*n.coeffs.b2-n.y_z[0]*n.coeffs.a1-n.y_z[1]*n.coeffs.a2)/n.coeffs.a0;return n.y_z[1]=n.y_z[0],n.y_z[0]=t,n.x_z[1]=n.x_z[0],n.x_z[0]=e,t}class ae{constructor(e,t,s){a(this,"i",new Array);a(this,"sa_l",new Array);a(this,"sb_l",new Array);a(this,"p",new Array);a(this,"a",new Array);a(this,"o");a(this,"sa");a(this,"sb");this.o=e,this.sa=t,this.sb=s}AddTrack(e,t,s,o,r){const i=m(e,d(t)),h=P(e,r),l=m(e,d(s)),u=m(e,d(o)),c=e.createAnalyser();return i.connect(c),i.connect(h).connect(this.o),i.connect(l).connect(this.sa),i.connect(u).connect(this.sb),this.i.push(i),this.sa_l.push(l),this.sb_l.push(u),this.p.push(h),this.a.push(c),i}GetMixerLevels(e=!0){const t=new Array;return this.a.forEach(s=>{const o=new Float32Array(s.fftSize);s.getFloatTimeDomainData(o);const r=e?$(o):Y(o);t.push(r)}),t}UpdateMixerComponent(e,t,s,o,r=.01){if(e<this.i.length)switch(t){case 1:y(this.i[e].gain,o,d(s),r);break;case 2:y(this.sa_l[e].gain,o,d(s),r);break;case 3:y(this.sb_l[e].gain,o,d(s),r);break;case 4:y(this.p[e].pan,o,s,r);break}else console.log("Channel index,",e,"exceeds number of channels. Number of Channels:",this.i.length)}Input(e){if(this.ValidIndex(e))return this.i[e]}SendA(e){if(this.ValidIndex(e))return this.sa_l[e]}SendB(e){if(this.ValidIndex(e))return this.sb_l[e]}Pan(e){if(this.ValidIndex(e))return this.p[e]}ChannelCount(){return this.i.length}ValidIndex(e){return e<this.i.length}}class ce{constructor(e,t,s,o){a(this,"c");a(this,"r");a(this,"os");a(this,"o");a(this,"l");this.c=e,this.l=e.createOscillator(),this.r=e.createGain(),this.os=e.createConstantSource(),this.os.offset.value=0,this.o=m(e,0),this.setRate(t),this.setRange(s,o),this.setShape("sine"),this.l.connect(this.r).connect(this.o),this.os.connect(this.o)}setShape(e){this.l.type=e}setRate(e,t=.01){y(this.l.frequency,0,e,t)}setRange(e,t){let s=t-e,o=s/2+e;this.r.gain.setValueAtTime(s/2,this.c.currentTime),this.os.offset.setValueAtTime(o,this.c.currentTime)}start(){this.os.start(),this.l.start(),y(this.o.gain,0,1,.01)}stop(){y(this.o.gain,0,0,.01),this.os.stop(),this.l.stop()}connect(e){e.setValueAtTime(0,this.c.currentTime),this.o.connect(e)}}function le(n){let e=new Array(n.length);for(let t=0;t<e.length;++t){let s=new Array(n.length),o=0;for(let r=0;r<s.length;++r)s[r]=Math.random(),o+=s[r];for(let r=0;r<s.length;++r)s[r]/=o;for(let r=1;r<s.length;++r)s[r]=s[r]+s[r-1];e[t]=s}return e}function he(n,e){n=S(n,0,e.length);const t=e[n],s=Math.random();if(s<t[0])return 0;for(let o=1;o<t.length;++o)if(s<=t[o]&&s>t[o-1])return o;return 0}function N(n=0,e=3,t=512){const s=new Float32Array(t),o=d(n),r=d(e);for(let i=0;i<t;i++){const h=i*2/(t-1)-1;s[i]=o*Math.tanh(r*h)}return s}class ue{constructor(e,t,s,o=.3,r=.2,i=.1,h=-1,l=-2){a(this,"ctx");a(this,"input");a(this,"o");a(this,"dt");a(this,"delay");a(this,"fb");a(this,"p_l");a(this,"p_r");a(this,"wr");a(this,"wd");a(this,"r");this.ctx=e,this.input=e.createGain(),this.o=e.createGain(),this.dt=s,this.delay=e.createDelay(s+.1),this.fb=m(e,o);const u=T(e,"lowshelf",500,1,h),c=T(e,"highshelf",2e3,1,l),v=W(e,N(0,1.5)),b=T(e,"allpass",500,1,0);this.input.connect(u).connect(c).connect(v).connect(b).connect(this.delay),this.delay.connect(this.fb).connect(u),this.delay.connect(this.o),this.p_l=P(e,-1),this.p_r=P(e,1);const f=T(e,"allpass",1e3,1,0),p=T(e,"allpass",2e3,1,0);this.o.connect(f).connect(this.p_l),this.o.connect(p).connect(this.p_r),this.wr=10*r,this.wd=i*.04,this.r=t}setFeedback(e){y(this.fb.gain,0,d(e),.01)}setOutputGain(e){y(this.o.gain,0,d(e),.01)}connect(e){this.p_l.connect(e),this.p_r.connect(e)}dlm(e,t){const s=1/this.wr,o=this.ctx.currentTime;let r=e.time,i=e.delay;for(;r<o+t;){const h=this.dt+this.r()*this.wd;this.delay.delayTime.setValueCurveAtTime([i,h],r,s),r+=s,i=h}return{time:r,delay:i}}start(){let e={time:this.ctx.currentTime,delay:this.dt};const t=2;e=this.dlm(e,t),setInterval(()=>{e=this.dlm(e,t)},t*500)}}const O=(n,e,t,s,o,r,i,h=0)=>{const l=t.adsr,u=s.adsr,c=z(n,t.type,t.freq,0),v=z(n,s.type,s.freq,0),b=m(n,o),f=m(n,0),p=m(n,0),M=P(n,h),g=m(n,r);c.connect(p).connect(M).connect(g).connect(e),v.connect(b).connect(f).connect(c.frequency),c.start(),v.start(),p.gain.setTargetAtTime(1,i,l.a/2.5),p.gain.setTargetAtTime(l.sl,i+l.a,l.d/2.5),p.gain.setTargetAtTime(0,i+l.a+l.d+l.s,l.r/2.5),f.gain.setTargetAtTime(1,i,u.a/2.5),f.gain.setTargetAtTime(u.sl,i+u.a,u.d/2.5),f.gain.setTargetAtTime(0,i+u.a+u.d+u.s,u.r/2.5),setTimeout(()=>{c.stop(),v.stop(),c.disconnect(),v.disconnect(),b.disconnect(),p.disconnect(),M.disconnect()},(i+l.a+l.d+l.s+l.r)*1e3)};class de{constructor(){a(this,"bpm",60);a(this,"time_per_step");a(this,"ctx");a(this,"num_sequences",3);a(this,"loaded",!1);a(this,"started",!1);a(this,"playing",!1);a(this,"states");a(this,"transition_matrix");a(this,"output_gain");a(this,"mixer");a(this,"levels");a(this,"sequence_inputs",new Array);a(this,"delay");a(this,"chord_lfo");a(this,"seq_timers");a(this,"ci");a(this,"ct");a(this,"chord_osc",new Array);a(this,"noise_osc");a(this,"last_note",0);this.ctx=ne(),this.time_per_step=V(this.bpm,1/16),console.log(this.time_per_step),this.states=[{n:"C",o:1,d:8},{n:"C",o:2,d:2},{n:"C",o:2,d:5},{n:"C",o:2,d:9},{n:"D",o:2,d:4},{n:"E",o:2,d:4},{n:"E",o:2,d:6},{n:"E",o:2,d:7},{n:"F#",o:2,d:2},{n:"F#",o:2,d:3},{n:"G",o:2,d:4},{n:"G",o:2,d:8},{n:"G",o:3,d:1},{n:"A",o:2,d:2},{n:"B",o:2,d:3},{n:"B",o:2,d:5},{n:"C",o:3,d:4},{n:"C",o:3,d:5}],this.transition_matrix=le(this.states),this.delay=new ue(this.ctx,Math.random,V(this.bpm,2/8),.4),this.output_gain=m(this.ctx,0);const e=ee(this.ctx,-6,3,20,.001,1),t=W(this.ctx,N(0,0),"4x"),s=m(this.ctx,1);this.mixer=new ae(e,this.delay.input,s),this.delay.connect(this.output_gain),this.noise_osc=Z(this.ctx);const o=T(this.ctx,"lowpass",4e3,1,0);this.noise_osc.connect(o).connect(this.mixer.AddTrack(this.ctx,-40,-40,-40,0));const r=z(this.ctx,"sine",C("C",3),0),i=z(this.ctx,"sine",C("G",3),0),h=z(this.ctx,"sine",C("D",4),0);this.chord_osc.push(r,i,h);const l=m(this.ctx,0);r.connect(l),i.connect(l),h.connect(l),this.chord_lfo=new ce(this.ctx,.1,d(-35),d(-15)),this.chord_lfo.connect(l.gain),l.connect(this.mixer.AddTrack(this.ctx,0,-12,-24,0));for(let u=0;u<this.num_sequences+1;++u)this.sequence_inputs.push(this.mixer.AddTrack(this.ctx,-9,-6,-6,0));e.connect(t).connect(this.output_gain).connect(this.ctx.destination),this.levels=new Array(this.mixer.ChannelCount()).fill(0),this.seq_timers=new Array(2).fill(0),this.ci=new Array(2).fill(0),this.ct=new Array(2).fill(0),te(this.ctx,4.1,5e3,!1).then(u=>{s.connect(u).connect(this.output_gain),this.loaded=!0})}ScheduleNotes(e,t,s,o,r,i,h,l,u,c=.1,v=1){const b=this.ctx.currentTime;for(;s<b+o;){const f=this.states[t],p=C(f.n,f.o)*r,M=2*Math.random()-1,g=f.d*this.time_per_step*h,q={a:c,d:.5*g,s:.2,sl:d(-9),r:g},w={...q,d:.4,sl:d(-40)};if(Math.random()<i){const D={type:"sine",freq:p,adsr:q},R={type:"sine",freq:u*p,adsr:w};O(this.ctx,e,D,R,l,v,s,M)}t=he(t,this.transition_matrix),s+=q.r}return[t,s]}GetMixerLevels(e=!0,t=.98){if(this.loaded&&this.started){let s=this.mixer.GetMixerLevels(!e);return this.levels&&(s=this.levels.map((o,r)=>t*o+(1-t)*s[r])),this.levels=s,s}return new Array(this.num_sequences+2).fill(0)}UpdateMouse(e,t){const s=[{n:"A",o:1,d:2},{n:"D",o:2,d:2},{n:"F#",o:2,d:2},{n:"G",o:2,d:2},{n:"B",o:2,d:2},{n:"D",o:3,d:2},{n:"F#",o:3,d:2},{n:"G",o:3,d:2}],o=1/s.length,r=this.sequence_inputs[this.num_sequences],i=S(Math.floor(e/o),0,s.length-1),h=C(s[i].n,2+s[i].o);if(h!=this.last_note){const l={type:"sine",freq:h,adsr:{a:.01,d:.4,s:0,sl:0,r:0}},u={type:"sine",freq:t*10*h,adsr:{a:.01,d:.3,s:0,sl:0,r:0}};O(this.ctx,r,l,u,200,d(-9),this.ctx.currentTime,2*e-1),this.last_note=h}}start(){if(this.ctx.state=="suspended"&&(this.ctx.resume(),console.log("context resumed")),this.loaded){if(this.started||(this.chord_osc.forEach(e=>{e.start()}),this.noise_osc.start(),this.delay.start(),this.chord_lfo.start(),this.started=!0),this.playing){console.log("Pause");const e=2;this.output_gain.gain.setTargetAtTime(0,0,e/2.5),setTimeout(()=>{this.seq_timers.forEach(t=>{clearTimeout(t)})},e*1e3)}else{console.log("Play"),this.ct=new Array(this.num_sequences).fill(this.ctx.currentTime),this.ci=new Array(this.num_sequences).fill(0).map(()=>Math.floor(Math.random()*this.states.length));const e=2,t=[d(-9),d(-3),d(-30)],s=[1,4,20],o=[.7,.2,.4],r=[4,2,8],i=[40,200,200],h=[1.502,3.03,.05],l=[.9,.01,4];this.seq_timers=new Array(this.num_sequences).fill(0).map((u,c)=>([this.ci[c],this.ct[c]]=this.ScheduleNotes(this.sequence_inputs[c],this.ci[c],this.ct[c],e,s[c],o[c],r[c],i[c],h[c],l[c],t[c]),setInterval(()=>{[this.ci[c],this.ct[c]]=this.ScheduleNotes(this.sequence_inputs[c],this.ci[c],this.ct[c],e,s[c],o[c],r[c],i[c],h[c],l[c],t[c])},e*1e3))),this.output_gain.gain.setTargetAtTime(1,this.ctx.currentTime,4)}this.playing=!this.playing}}}const fe=`

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mixer_levels[5];
uniform vec2 u_mouse_xy;
// Constants
#define PI 3.141592654
 
float map(float value, float min1, float max1, float min2, float max2) {
  return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}

float rand(float x){
	return fract(sin(dot(x, 12.9898)) * 43758.5453);
}

float rand2d(vec2 p){
  return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float perlin1d(float x) {
  float i = floor(x);
  float f = x - i;
  return mix(rand(i), rand(i + 1.0), smoothstep(0.,1.,f));
}


/* 2D noise */
float perlin2d(vec2 p) {
  // create 4 integer points around
  vec2 p0 = floor(p);
  vec2 p1 = p0 + vec2(1.0, 0.0);
  vec2 p2 = p0 + vec2(0.0, 1.0);
  vec2 p3 = p0 + vec2(1.0, 1.0);
  
  // generate noise at each point
  float r0 = rand2d(p0);
  float r1 = rand2d(p1);
  float r2 = rand2d(p2);
  float r3 = rand2d(p3);
    
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = smoothstep(0., 1., f);

  return mix(r0, r1, u.x) +
            (r2 - r0) * u.y * (1.0 - u.x) +
            (r3 - r1) * u.x * u.y;

}


vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

float circle(vec2 st, vec2 center, float radius, float smoothing) {
  float dist = sqrt(pow(st.x - center.x, 2.0) + pow(st.y - center.y, 2.0));
  return 1.0 - smoothstep(radius*smoothing, radius, dist);
}


float ring(vec2 st, vec2 center, float radius, float width) {
  return circle(st, center, radius, 0.9) - circle(st, center, radius - width, 0.9);
}

float radial_dist(vec2 st, vec2 center) {
  return sqrt(pow(st.x - center.x, 2.0) + pow(st.y - center.y, 2.0));
}

float radial_angle(vec2 st, vec2 center) {
  float x = (st.x - center.x);
  float y = (st.y - center.y);
  // if (abs(x) < 0.00001) {
  //   if (y < 0.) {
  //     return 1.5 * PI;
  //   }
  //   else {
  //     return 0.5 * PI;
  //   }
  // } else 
    return sign(x) * atan(abs(y) / abs(x));
}

float rect(vec2 st, vec2 lr_corner, vec2 dim) {
  vec2 step_vec = (1.0 - step(dim + lr_corner, st)) * step(lr_corner, st);
  return step_vec.x * step_vec.y;
}

float quantize(float x, float step_size) {
  return floor(x / step_size) * step_size;
}

vec2 quantize_2d(vec2 st, vec2 step_size) {
  return floor(st / step_size) * step_size;
}

float stepped_random(float x, float step_width) {
  return rand(quantize(x, step_width));
}

float stepped_random_2d(vec2 st, vec2 step_width) {
  return rand2d(quantize_2d(st, step_width));
}

float hannWindow(float x, float center, float width) {
  x = x - center + width / 2.;
  if (x > width || x < 0.) return 0.;
  return .5 * (1. - cos(2. * PI * x / width));
}

vec3 hexToFloatColor(int hex_color) {
  float r = float(hex_color / 256 / 256);
  float g = float(hex_color / 256 - int(r * 256.0));
  float b = float(hex_color - int(r * 256.0 * 256.0) - int(g * 256.0));
  return vec3(r / 255.0, g / 255.0, b / 255.0);
}

float fbn(vec2 st_1, vec2 st_2, vec2 st_3, float gain_1, float gain_2, float gain_3) {
  return gain_1 * perlin2d(st_1) + gain_2 * perlin2d(2. * st_2) + gain_3 * perlin2d(3. * st_3);
}

float squares(vec2 st, float t, float noise_depth) {
  float line_width = 0.01;
  vec2 squares = step(vec2(line_width/1.2), mod(st,vec2(line_width)));
  return squares.x * squares.y;
}

vec3 base_color(bool dark) {
  if (dark)
    return vec3(0.004,0.012,0.027);
  else
    return vec3(0.992,0.957,0.906);
}

vec3 color_field(vec2 st, float t, float level) {
  vec3 color = vec3(0.675,0.231,0.145); // red
  // vec3 color = vec3(0.051,0.141,0.271); // blue
  vec3 base = base_color(true);
  float stripes = (0.95 + 0.05 * stepped_random_2d(st, vec2(1., 0.001)));
  float noise = rand2d(st) * 0.2;
  float accent_map = fbn(st + 0.1 * sin(-t / 2.), st + 0.1 * cos(t / 2.), st + 0.1 * sin(t / 2.), 0.4 + 0.2 * abs(sin(t)), 0.5, 0.6);
  // accent_map *= (0.3 + 0.7 * hannWindow(st.x + perlin1d(0.1 * t) * perlin1d(10. * st.y), 0.8 + perlin1d(0.1 * t), 0.5));
  accent_map *= stripes;
  accent_map += noise;
  color = mix(color, hexToFloatColor(0xFDE9CD), 2. * level * squares(st, t, 0.));
  color = mix(color, hexToFloatColor(0xFDE9CD), 0.4 * hannWindow(st.x, u_mouse_xy.x, 0.4) * hannWindow(st.y, u_mouse_xy.y, 0.7));
  vec3 c = mix(base, color, accent_map);
  return c;
}

float grain(vec2 st, float t, float noise_depth) {
  float grain_d = 0.1;
  float circles = 0.0;
  vec2 grid_pos = st + vec2(0.4 * sin(0.5 + 0.5 * stepped_random(st.y, grain_d)), 0.);
  grid_pos.x += 0.2 * u_mixer_levels[4] * sin(40. * quantize(st.y + 6.0 * t, grain_d));

  float scale = 0.7 + 0.3 * sin(2. * stepped_random_2d(grid_pos, vec2(grain_d)) * t); // subtle flashing
  vec2 xy = mod(grid_pos, vec2(grain_d)); // grid
  vec2 center = vec2(grain_d * stepped_random_2d(2.0 * grid_pos, vec2(grain_d)));
  for (float i = 0.; i < 3.; ++i) {
    center += 0.2 * grain_d * vec2(10. * u_mixer_levels[int(i) + 1] * sin(i * t), 10. * u_mixer_levels[int(i) + 1] * cos(i * t));
    circles = mix(circles, 1.0, 0.5 * scale * circle(xy, center, 0.4 * grain_d, 0.6));
  }
  return circles;
}

void main()
{
  float a_r = u_resolution.y / u_resolution.x;
  vec2 st = vec2(vUv.x / a_r, vUv.y);
  float f_rate = 10.;
  float quant_time = quantize(u_time, 1. / f_rate);
  float grains = grain(st, quant_time, 0.1);
  vec3 colors = color_field(vUv, quant_time, u_mixer_levels[3]);  
  // gl_FragColor = vec4(color_field(vUv, quant_time, 0.0), 1.0);
  gl_FragColor = vec4(mix(base_color(true), colors, grains), 1.0);

  // gl_FragColor = vec4(vec3(circle(vUv, u_mouse_xy, 0.1)), 1.0);
}
`,pe=`
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0); }
`,E=new de,G={u_mixer_levels:{value:[0,0,0,0,0]},u_mouse_xy:{value:new _.Vector2(0,0)},u_time:{value:0},u_resolution:{value:new _.Vector2(window.innerWidth,window.innerHeight)}},F=new _.Clock,U=new _.Scene,H=new _.OrthographicCamera(-1,1,1,-1,0,2),x=new _.WebGLRenderer;let A=document.getElementById("start-svg"),k=0,I=!1;const me=()=>{const n=new _.PlaneGeometry(2,2),e=new _.ShaderMaterial({uniforms:G,vertexShader:pe,fragmentShader:fe}),t=new _.Mesh(n,e);U.add(t),x.setPixelRatio(window.devicePixelRatio),x.setSize(window.innerWidth,window.innerHeight),document.body.appendChild(x.domElement),F.start(),console.log("Loaded")},j=()=>{requestAnimationFrame(j),G.u_time.value=F.getElapsedTime();const n=E.GetMixerLevels();if(G.u_mixer_levels.value=n,x.render(U,H),E.playing||I){let e=S(1-(F.getElapsedTime()-k)/2,0,1);I&&(e=S((F.getElapsedTime()-k)/2,0,1)),_e(e)}};window.addEventListener("resize",()=>{console.log("Window Resizing"),H.updateProjectionMatrix(),x.setSize(window.innerWidth,window.innerHeight),G.u_resolution.value=new _.Vector2(window.innerWidth,window.innerHeight)});const _e=n=>{if(A){if(n<.01){A.style.display="none";return}else A.style.display="initial";const e=`rgba(255, 255, 255, ${n})`;A.style.fill=e}};x.domElement.onmousemove=n=>{const e=Math.min(Math.max(0,n.offsetX/x.domElement.clientWidth),1),t=1-Math.min(Math.max(0,n.offsetY/x.domElement.clientHeight),1);G.u_mouse_xy.value=new _.Vector2(e,t),E.UpdateMouse(e,t)};const K=()=>{E.start(),E.playing||(I=!0),k=F.getElapsedTime()};x.domElement.onmouseup=()=>{K()};A&&(A.onmouseup=()=>{K()});me();j();
