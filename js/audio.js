/* Synth Patch Hero · Web Audio engine: turns a patch into a voice, plus live playback. */
'use strict';
/* =====================================================================
   AUDIO ENGINE
   ===================================================================== */
const MASTER = 0.22;
const noiseCache = new WeakMap();
function noiseBuffer(ctx){
  let b=noiseCache.get(ctx); if(b) return b;
  b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*2),ctx.sampleRate);
  const d=b.getChannelData(0); let s=1234567;
  for(let i=0;i<d.length;i++){ s^=s<<13; s^=s>>>17; s^=s<<5; d[i]=((s>>>0)/4294967296)*2-1; }
  noiseCache.set(ctx,b); return b;
}
/* Deterministic helpers so the target and the player's patch render identically. */
function seeded(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)/4294967296)*2-1; }; }
const irCache=new WeakMap();
function reverbIR(ctx,size){
  const key=size.toFixed(2); let m=irCache.get(ctx); if(!m){ m=new Map(); irCache.set(ctx,m); }
  if(m.has(key)) return m.get(key);
  const len=Math.max(64,Math.floor(ctx.sampleRate*size)), b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0), r=seeded(7919);
  for(let i=0;i<len;i++){ const t=i/ctx.sampleRate; d[i]=r()*Math.exp(-6.9*t/size)*(i<ctx.sampleRate*0.004?i/(ctx.sampleRate*0.004):1); }
  m.set(key,b); return b;
}
const curveCache=new Map();
function driveCurve(k){
  const key=k.toFixed(2); if(curveCache.has(key)) return curveCache.get(key);
  const n=2048, c=new Float32Array(n), norm=Math.tanh(k); for(let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/norm; }
  curveCache.set(key,c); return c;
}
const shCache=new WeakMap();
function shBuffer(ctx,rate){
  const key=rate.toFixed(3); let m=shCache.get(ctx); if(!m){ m=new Map(); shCache.set(ctx,m); }
  if(m.has(key)) return m.get(key);
  const steps=32, per=Math.max(1,Math.round(ctx.sampleRate/rate)), b=ctx.createBuffer(1,steps*per,ctx.sampleRate), d=b.getChannelData(0), r=seeded(4242);
  for(let k=0;k<steps;k++){ const v=r(); d.fill(v,k*per,(k+1)*per); }
  m.set(key,b); return b;
}
function envPoints(p,gate){
  const {a,d,s,r}=p;
  if(gate<=a) return [[0,0],[gate,gate/a],[gate+r,0]];
  if(gate<=a+d) return [[0,0],[a,1],[gate,1-(1-s)*(gate-a)/d],[gate+r,0]];
  return [[0,0],[a,1],[a+d,s],[gate,s],[gate+r,0]];
}
function envAt(p,t){ if(t<p.a) return t/p.a; if(t<p.a+p.d) return 1-(1-p.s)*(t-p.a)/p.d; return p.s; }

/* Build one note of a patch. gate: seconds, or null for a held note (call release()). */
function buildVoice(ctx, patch, dest, t0, note, gate){
  const N={}, sources=[], envs=[];
  const incoming=(id,port)=>patch.cables.some(c=>c.to.m===id&&c.to.p===port);
  let maxR=0.02;
  for(const m of patch.modules){
    const P=m.params, n={ins:{},outs:{}}; N[m.id]=n;
    switch(m.type){
      case 'osc': {
        const o=ctx.createOscillator(); o.type=P.wave;
        o.frequency.value=mtof(note)*Math.pow(2,P.oct+P.semi/12); o.detune.value=P.fine;
        const mg=ctx.createGain(); mg.gain.value=P.pitchAmt; mg.connect(o.detune);
        const fg=ctx.createGain(); fg.gain.value=P.fmAmt||0; fg.connect(o.frequency);   // linear FM: audio in → ± fmAmt Hz
        n.ins.pitch=mg; n.ins.fm=fg; n.outs.out=o; sources.push(o); break; }
      case 'noise': {
        const s=ctx.createBufferSource(); s.buffer=noiseBuffer(ctx); s.loop=true; n.outs.out=s; sources.push(s); break; }
      case 'filter': {
        const f=ctx.createBiquadFilter(); f.type=P.type; f.frequency.value=P.cutoff;
        f.Q.value = (P.type==='bandpass'||P.type==='notch') ? 0.6+P.res*14 : -3+P.res*28;
        const mg=ctx.createGain(); mg.gain.value=P.cutAmt; mg.connect(f.detune);
        n.ins.in=f; n.ins.cut=mg; n.outs.out=f; break; }
      case 'vca': {
        const g=ctx.createGain(); const cv=incoming(m.id,'gain'); g.gain.value=cv?0:P.level;
        const mg=ctx.createGain(); mg.gain.value=P.level; mg.connect(g.gain);
        n.ins.in=g; n.ins.gain=mg; n.outs.out=g; break; }
      case 'env': {
        const c=ctx.createConstantSource(); c.offset.value=0; n.outs.out=c; sources.push(c);
        envs.push({param:c.offset,p:P}); maxR=Math.max(maxR,P.r); break; }
      case 'lfo': {
        const o=ctx.createOscillator(); o.type=P.wave; o.frequency.value=P.rate; n.outs.out=o; sources.push(o); break; }
      case 'mixer': {
        const sum=ctx.createGain(); n.outs.out=sum;
        [1,2,3].forEach(k=>{ const g=ctx.createGain(); g.gain.value=P['l'+k]; g.connect(sum); n.ins['in'+k]=g; }); break; }
      case 'harm': {
        const o=ctx.createOscillator(), real=new Float32Array(7), imag=new Float32Array(7);
        for(let k=1;k<=6;k++) imag[k]=P['h'+k]; if(imag.every(v=>v===0)) imag[1]=1e-6;
        o.setPeriodicWave(ctx.createPeriodicWave(real,imag,{disableNormalization:true}));
        o.frequency.value=mtof(note); const g=ctx.createGain(); g.gain.value=0.5; o.connect(g);
        n.outs.out=g; sources.push(o); break; }
      case 'delay': {
        // in → dry ─────────────┐
        // in → delay ⇄ (tone → feedback) → wet → out.   NOTE mode tunes the delay to the played note (plucked strings).
        const inp=ctx.createGain(), out=ctx.createGain(), dry=ctx.createGain(), wet=ctx.createGain(), fb=ctx.createGain();
        const d=ctx.createDelay(2), tone=ctx.createBiquadFilter(); tone.type='lowpass'; tone.frequency.value=P.tone; tone.Q.value=-6;   // Q is in dB for lowpass: keep it peak-free so loop gain stays < 1
        const t=P.sync==='note'?1/mtof(note):P.time; d.delayTime.value=t;
        dry.gain.value=1-P.mix; wet.gain.value=P.mix; fb.gain.value=P.fb;
        inp.connect(dry); dry.connect(out); inp.connect(d); d.connect(tone); tone.connect(fb); fb.connect(d); tone.connect(wet); wet.connect(out);
        const mg=ctx.createGain(); mg.gain.value=P.modAmt; mg.connect(d.delayTime);
        n.ins.in=inp; n.ins.mod=mg; n.outs.out=out;
        if(P.fb>0.001) maxR=Math.max(maxR,Math.min(4,t*Math.log(0.001)/Math.log(P.fb))); else maxR=Math.max(maxR,t);
        break; }
      case 'reverb': {
        const inp=ctx.createGain(), out=ctx.createGain(), dry=ctx.createGain(), wet=ctx.createGain(), cv=ctx.createConvolver();
        cv.buffer=reverbIR(ctx,P.size); dry.gain.value=1-P.mix; wet.gain.value=P.mix;
        inp.connect(dry); dry.connect(out); inp.connect(cv); cv.connect(wet); wet.connect(out);
        n.ins.in=inp; n.outs.out=out; maxR=Math.max(maxR,Math.min(4,P.size)); break; }
      case 'drive': {
        const ws=ctx.createWaveShaper(), g=ctx.createGain(); ws.curve=driveCurve(P.drive); ws.oversample='2x'; g.gain.value=P.level; ws.connect(g);
        n.ins.in=ws; n.outs.out=g; break; }
      case 'sh': {
        const s=ctx.createBufferSource(); s.buffer=shBuffer(ctx,P.rate); s.loop=true; n.outs.out=s; sources.push(s); break; }
      case 'out': n.ins.in=dest; break;
    }
  }
  for(const c of patch.cables){
    const a=N[c.from.m], b=N[c.to.m]; if(!a||!b) continue;
    const src=a.outs[c.from.p], dst=b.ins[c.to.p]; if(src&&dst) src.connect(dst);
  }
  for(const e of envs){
    const prm=e.param; prm.setValueAtTime(0,t0);
    const pts = gate!=null ? envPoints(e.p,gate) : [[0,0],[e.p.a,1],[e.p.a+e.p.d,e.p.s]];
    for(let i=1;i<pts.length;i++) prm.linearRampToValueAtTime(pts[i][1],t0+pts[i][0]);
  }
  sources.forEach(s=>s.start(t0));
  return {
    maxR,
    release(t){
      for(const e of envs){
        const prm=e.param, v=envAt(e.p,t-t0);
        if(prm.cancelAndHoldAtTime){ prm.cancelAndHoldAtTime(t); }
        else { prm.cancelScheduledValues(t0); prm.setValueAtTime(0,t0); const pts=[[0,0],[e.p.a,1],[e.p.a+e.p.d,e.p.s]].filter(q=>q[0]<t-t0); pts.slice(1).forEach(q=>prm.linearRampToValueAtTime(q[1],t0+q[0])); prm.linearRampToValueAtTime(v,t); }
        prm.linearRampToValueAtTime(0,t+e.p.r);
      }
    },
    stop(t){ sources.forEach(s=>{try{s.stop(t);}catch(_){}}); }
  };
}
/* Output chain: declick gain -> master -> dest. Returns input node + gate controls. */
function outChain(ctx,dest,t0,level=1){
  const dc=ctx.createGain(); dc.gain.setValueAtTime(0,t0); dc.gain.linearRampToValueAtTime(1,t0+0.004);
  const mg=ctx.createGain(); mg.gain.value=MASTER*level; dc.connect(mg); mg.connect(dest);
  return {node:dc, close(t){ dc.gain.setValueAtTime(1,t-0.025); dc.gain.linearRampToValueAtTime(0,t); }};
}

/* ---- Live playback ---- */
let AC=null, liveBus=null;
function ac(){
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(_){}
  if(!AC){
    AC=new (window.AudioContext||window.webkitAudioContext)();
    const comp=AC.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=8; comp.connect(AC.destination); liveBus=comp;
  }
  if(AC.state==='suspended') AC.resume();
  return AC;
}
let oneShots=[];
function playFixed(patch,L,which){
  const ctx=ac(); stopOneShots();
  const t0=ctx.currentTime+0.03, oc=outChain(ctx,liveBus,t0);
  const v=buildVoice(ctx,patch,oc.node,t0,L.note,L.gate);
  oc.close(t0+L.dur); v.stop(t0+L.dur+0.05);
  oneShots.push({v,oc,end:t0+L.dur});
  flashPlay(which,L.dur);
}
function stopOneShots(){ const ctx=AC; if(!ctx) return; const t=ctx.currentTime+0.03; oneShots.forEach(o=>{ if(o.end>t){ o.oc.close(t); o.v.stop(t+0.05);} }); oneShots=[]; }
const held={};
function noteOn(key,note,vel=1){
  if(held[key]||!S.patch) return;
  const ctx=ac(); if(ctx.state!=='running'){ toast('Tap or click the page once to switch the sound on.'); }
  const t0=ctx.currentTime+0.01; const oc=outChain(ctx,liveBus,t0,vel);
  const v=buildVoice(ctx,S.patch,oc.node,t0,note,null); held[key]={v,oc};
}
function noteOff(key){
  const h=held[key]; if(!h) return; delete held[key];
  const t=AC.currentTime+0.005; h.v.release(t); const end=t+h.v.maxR+0.06; h.oc.close(end); h.v.stop(end+0.05);
}
function allNotesOff(){ Object.keys(held).forEach(noteOff); if(S.idNote){ S.idNote={}; S.sustained.clear(); paintLit(); } }

/* ---- End-of-gig jingle: a short phrase played on the player's own patch, shaped to suit the chapter ---- */
// Each event: [semitones from the gig's note, start (beats), length (beats), velocity]. Chords share a start.
const JINGLES = {
  melodic: { beat:0.15, notes:[[0,0,.8,.9],[4,1,.8,.85],[7,2,.8,.9],[4,3,.8,.8],[12,4,3.5,1]] },
  bass:    { beat:0.17, notes:[[0,0,.7,1],[0,1,.6,.8],[12,1.5,.45,.9],[0,2,.7,.9],[10,3,.6,.85],[7,3.5,.6,.85],[0,4.5,2.5,1]] },
  pads:    { beat:1.0,  notes:[[5,0,1.15,.55],[9,0,1.15,.5],[12,0,1.15,.5],[0,1.25,1.7,.55],[4,1.25,1.7,.5],[7,1.25,1.7,.5],[12,1.25,1.7,.45]] },
  perc:    { beat:0.14, notes:[[0,0,.6,1],[0,2,.6,.7],[0,3,.6,.8],[0,4,.6,1],[0,5.5,.5,.6],[0,6,.6,.8],[0,7,.6,.9],[0,8,1,1]] },
  fx:      { beat:0.5,  notes:[[0,0,.9,.9],[-5,1.1,.9,.9],[7,2.2,1.4,1]] },
  pluck:   { beat:0.16, notes:[[0,0,.5,.9],[-5,1,.5,.8],[-8,2,.5,.85],[-12,3,.5,.8],[-5,4,.5,.8],[0,5,3,1]] },
};
function jingleFor(L){ return JINGLES[{bass:'bass',pads:'pads',perc:'perc',fx:'fx',strings:'pluck',fxrack:'pluck'}[L.ch]||'melodic']; }
/* Schedule the jingle on ctx. Returns {events:[{t,dur,note}], end, stop(t)}. */
function scheduleJingle(ctx, dest, patch, L, t0){
  const J=jingleFor(L), voices=[]; let end=0;
  const events=J.notes.map(([rel,at,len,vel])=>{
    const t=t0+at*J.beat, dur=len*J.beat, oc=outChain(ctx,dest,t,vel);
    const v=buildVoice(ctx,patch,oc.node,t,L.note+rel,dur), stopAt=t+dur+v.maxR+0.06;
    oc.close(stopAt); v.stop(stopAt+0.02); voices.push({oc,v,stopAt}); end=Math.max(end,stopAt);
    return {t:at*J.beat,dur,note:L.note+rel};
  });
  return { events, end, stop(t){ voices.forEach(x=>{ if(x.stopAt>t){ x.oc.close(t+0.03); x.v.stop(t+0.06); } }); } };
}
let jingleNow=null;
function playJingle(patch, L){
  const ctx=ac(); stopJingle(); stopOneShots();
  jingleNow=scheduleJingle(ctx, liveBus, patch, L, ctx.currentTime+0.08);
  return jingleNow;
}
function stopJingle(){ if(jingleNow&&AC){ jingleNow.stop(AC.currentTime); } jingleNow=null; }
/* Offline render of the jingle (used by tests to check every gig's jingle is audible). */
async function renderJingle(patch, L){
  const J=jingleFor(L), last=Math.max(...J.notes.map(n=>(n[1]+n[2])*J.beat));
  const len=Math.ceil((last+2.5)*SR), ctx=new OfflineAudioContext(1,len,SR);
  scheduleJingle(ctx, ctx.destination, patch, L, 0.02);
  return (await ctx.startRendering()).getChannelData(0);
}
