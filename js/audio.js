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
const foldCache={};
function foldCurve(){ if(foldCache.c) return foldCache.c; const n=8192, c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.sin(x*FOLD_MAX*Math.PI/2); } return foldCache.c=c; }
const FOLD_MAX=16;
/* Hard sync needs per-sample phase resets, which no built-in node does, so it runs in a small AudioWorklet.
   The worklet is loaded from a Blob or data: URL (no extra file, works from file:// too). Until it's ready, SYNC OSC falls back to a plain saw. */
const WORKLET_SRC=`
class SyncOsc extends AudioWorkletProcessor{
  static get parameterDescriptors(){ return [{name:'freq',defaultValue:220,automationRate:'a-rate'},{name:'ratio',defaultValue:2,automationRate:'a-rate'}]; }
  constructor(o){ super(); const op=o.processorOptions||{}; this.sq=op.wave==='square'; this.pm=0; this.ps=0; this.t0=op.t0||0; this.t1=Infinity; this.port.onmessage=e=>{ this.t1=(e.data&&e.data.stopAt!=null)?e.data.stopAt:-1; }; }
  process(ins,outs,P){
    if(currentTime>=this.t1) return false; const out=outs[0][0]; if(!out||currentTime+128/sampleRate<this.t0) return true; const F=P.freq, R=P.ratio, OS=4;
    for(let i=0;i<out.length;i++){
      const f=F.length>1?F[i]:F[0]; let r=R.length>1?R[i]:R[0]; if(r<1) r=1; const dm=f/sampleRate/OS; let acc=0;
      for(let k=0;k<OS;k++){ this.pm+=dm; this.ps+=dm*r; if(this.pm>=1){ this.pm-=1; this.ps=this.pm*r; } this.ps-=Math.floor(this.ps);
        acc+= this.sq ? (this.ps<0.5?1:-1) : 2*this.ps-1; }
      out[i]=acc/OS;
    }
    return true;
  }
}
registerProcessor('sync-osc',SyncOsc);
/* Studio engine: band-limited oscillator (PolyBLEP) with slow analog drift. */
function rng(seed){ let a=seed>>>0||1; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function blep(t,dt){ if(t<dt){ t/=dt; return t+t-t*t-1; } if(t>1-dt){ t=(t-1)/dt; return t*t+t+t+1; } return 0; }
class VaOsc extends AudioWorkletProcessor{
  static get parameterDescriptors(){ return [{name:'freq',defaultValue:220,automationRate:'a-rate'},{name:'detune',defaultValue:0,automationRate:'a-rate'}]; }
  constructor(o){ super(); const op=o.processorOptions||{}; this.w=op.wave||'sawtooth'; this.r=rng(op.seed||1); this.ph=this.r(); this.ds=op.drift==null?1:op.drift; this.drift=(this.r()*2-1)*2*this.ds; this.dt=this.drift; this.n=0; this.t0=op.t0||0; this.t1=Infinity; this.port.onmessage=e=>{ this.t1=(e.data&&e.data.stopAt!=null)?e.data.stopAt:-1; }; }
  process(ins,outs,P){
    if(currentTime>=this.t1) return false; const out=outs[0][0]; if(!out||currentTime+128/sampleRate<this.t0) return true; const F=P.freq, D=P.detune, w=this.w;
    for(let i=0;i<out.length;i++){
      if((this.n++&511)===0) this.dt=(this.r()*2-1)*3*this.ds;            // a new drift target every ~10 ms…
      this.drift+=(this.dt-this.drift)*0.0004;                     // …approached very slowly: a few cents of wander
      const f=(F.length>1?F[i]:F[0])*Math.pow(2,((D.length>1?D[i]:D[0])+this.drift)/1200); const dt=Math.min(0.49,Math.abs(f)/sampleRate);
      let p=this.ph, y;
      if(w==='sawtooth') y=2*p-1-blep(p,dt);
      else if(w==='square') y=(p<0.5?1:-1)+blep(p,dt)-blep((p+0.5)%1,dt);
      else if(w==='triangle') y=4*Math.abs(p-0.5)-1;
      else y=Math.sin(2*Math.PI*p);
      out[i]=y; p+=f/sampleRate; this.ph=p-Math.floor(p);
    }
    return true;
  }
}
registerProcessor('va-osc',VaOsc);
/* Studio engine: 4-pole zero-delay-feedback ladder low-pass, 2x oversampled, with tanh saturation in the loop. */
class Ladder extends AudioWorkletProcessor{
  static get parameterDescriptors(){ return [{name:'cutoff',defaultValue:1000,automationRate:'a-rate'},{name:'cents',defaultValue:0,automationRate:'a-rate'},{name:'res',defaultValue:0,automationRate:'k-rate'}]; }
  constructor(o){ super(); const op=(o&&o.processorOptions)||{}; this.s=[0,0,0,0]; this.t0=op.t0||0; this.t1=Infinity; this.port.onmessage=e=>{ this.t1=(e.data&&e.data.stopAt!=null)?e.data.stopAt:-1; }; }
  process(ins,outs,P){
    if(currentTime>=this.t1) return false; const out=outs[0][0]; if(!out||currentTime+128/sampleRate<this.t0) return true; const inp=ins[0]&&ins[0][0], C=P.cutoff, M=P.cents, K=Math.min(3.98,P.res[0]*4.3), s=this.s, sr2=sampleRate*2;
    for(let i=0;i<out.length;i++){
      const x=inp?inp[i]:0; const fc=Math.min(sr2*0.24,Math.max(10,(C.length>1?C[i]:C[0])*Math.pow(2,(M.length>1?M[i]:M[0])/1200)));
      const g=Math.tan(Math.PI*fc/sr2), G=g/(1+g), G2=G*G, G4=G2*G2, b=1-G; let acc=0;
      for(let k=0;k<2;k++){
        const S=G2*G*b*s[0]+G2*b*s[1]+G*b*s[2]+b*s[3];
        const y4=(G4*x*0.8*(1+0.45*K)+S)/(1+K*G4);
        let u=Math.tanh(x*0.8*(1+0.45*K)-K*y4);
        for(let j=0;j<4;j++){ const v=G*(u-s[j]); const y=v+s[j]; s[j]=y+v; u=y; }
        acc+=u;
      }
      out[i]=acc*0.5/0.8*(1+1.25*P.res[0]);   // makeup gain: a ladder loses low end as resonance rises
    }
    return true;
  }
}
registerProcessor('ladder',Ladder);`;
const workletCache=new WeakMap();
function ensureWorklets(ctx){
  if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined') return Promise.resolve(false);
  let p=workletCache.get(ctx);
  if(!p){ // Blob URLs fail on file:// (null origin) and data: URLs can be blocked by some hosts, so try both.
    const blob=()=>ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET_SRC],{type:'application/javascript'})));
    const data=()=>ctx.audioWorklet.addModule('data:application/javascript;charset=utf-8,'+encodeURIComponent(WORKLET_SRC));
    p=(location.protocol==='file:'?data():blob().catch(data)).then(()=>{ ctx.__sync=true; ctx.__studio=true; return true; },()=>false); workletCache.set(ctx,p); }
  return p;
}
/* ENGINE: 'classic' (the browser's stock audio parts) or 'studio' (analog-style oscillators, ladder filter, curved
   envelopes). Both scoring renders and playback use the same engine, so matching stays fair either way. */
let ENGINE='studio';
/* Studio engine parts, switchable one at a time for A/B listening and tuning. */
const STUDIO={ladder:false, drift:1, finish:true};   // ladder: set per gig (studio:'ladder')
const usesWorklet = patch => ENGINE==='studio'||patch.modules.some(m=>m.type==='sync');
/* Studio envelopes: an RC-style attack (curving up to full at A), then decay and release that fall fast and trail off. */
const EXP_K=3.5;   // time constants per D/R: ~97% of the way there by the knob's time
function envAtExp(p,t){ if(t<p.a){ const tau=p.a/Math.log(1.3/0.3); return 1.3*(1-Math.exp(-t/tau)); } return p.s+(1-p.s)*Math.exp(-(t-p.a)*EXP_K/Math.max(p.d,1e-4)); }
function schedEnvExp(prm,p,t0,gate){
  const ta=p.a/Math.log(1.3/0.3);
  prm.setValueAtTime(0,t0); prm.setTargetAtTime(1.3,t0,Math.max(ta,1e-4));
  if(gate!=null&&gate<p.a){ const v=envAtExp(p,gate); prm.setValueAtTime(v,t0+gate); prm.setTargetAtTime(0,t0+gate,Math.max(p.r,1e-3)/EXP_K); return; }
  prm.setValueAtTime(1,t0+p.a); prm.setTargetAtTime(p.s,t0+p.a,Math.max(p.d,1e-3)/EXP_K);
  if(gate!=null){ const v=envAtExp(p,gate); prm.setValueAtTime(v,t0+gate); prm.setTargetAtTime(0,t0+gate,Math.max(p.r,1e-3)/EXP_K); }
}
/* Same oscillator settings get the same drift on every render, so a matching patch matches exactly. */
const oscSeed=(P,note,k)=>{ let h=2166136261; for(const c of `${P.wave}|${P.oct}|${P.semi}|${P.fine}|${note}|${k}`) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0; };
function envPoints(p,gate){
  const {a,d,s,r}=p;
  if(gate<=a) return [[0,0],[gate,gate/a],[gate+r,0]];
  if(gate<=a+d) return [[0,0],[a,1],[gate,1-(1-s)*(gate-a)/d],[gate+r,0]];
  return [[0,0],[a,1],[a+d,s],[gate,s],[gate+r,0]];
}
/* Value of a piecewise-linear point list at time t. */
function ptsAt(pts,t){ for(let i=1;i<pts.length;i++) if(t<=pts[i][0]){ const [t0,v0]=pts[i-1],[t1,v1]=pts[i]; return t1>t0?v0+(v1-v0)*(t-t0)/(t1-t0):v1; } return pts[pts.length-1][1]; }
/* A sequencer's steps for one note: 16th notes at BPM, looping over STEPS, until the gate ends (or 30 s for held notes). */
function seqSteps(P,gate){
  const step=60/P.bpm/4, H=gate!=null?gate:30, out=[]; out.step=step;
  for(let k=0;k*step<H-1e-6&&k<4000;k++){ const g=Math.min(step*P.gate, gate!=null?gate-k*step:Infinity); out.push({t:k*step, v:P['s'+(k%P.len+1)], g:Math.max(0.005,g)}); }
  return out;
}
function envAt(p,t){ if(t<p.a) return t/p.a; if(t<p.a+p.d) return 1-(1-p.s)*(t-p.a)/p.d; return p.s; }

/* Build one note of a patch. gate: seconds, or null for a held note (call release()). */
function buildVoice(ctx, patch, dest, t0, note, gate){
  const N={}, sources=[], envs=[], funcs=[], workers=[], seqs={}, seen={};
  const incoming=(id,port)=>patch.cables.some(c=>c.to.m===id&&c.to.p===port);
  let maxR=0.02;
  for(const m of patch.modules){
    const P=m.params, n={ins:{},outs:{}}; N[m.id]=n;
    switch(m.type){
      case 'osc': {
        let o, freq, det, out;
        if(ENGINE==='studio'&&ctx.__studio){
          const key=`${P.wave}|${P.oct}|${P.semi}|${P.fine}`; seen[key]=(seen[key]||0)+1;
          o=new AudioWorkletNode(ctx,'va-osc',{numberOfInputs:0,outputChannelCount:[1],processorOptions:{wave:P.wave,seed:oscSeed(P,note,seen[key]),t0,drift:STUDIO.drift}});
          freq=o.parameters.get('freq'); det=o.parameters.get('detune'); workers.push(o); out=o;
        } else { o=ctx.createOscillator(); o.type=P.wave; freq=o.frequency; det=o.detune; sources.push(o); out=o; }
        freq.value=mtof(note)*Math.pow(2,P.oct+P.semi/12); det.value=P.fine;
        const mg=ctx.createGain(); mg.gain.value=P.pitchAmt; mg.connect(det);
        const fg=ctx.createGain(); fg.gain.value=P.fmAmt||0; fg.connect(freq);   // linear FM: audio in → ± fmAmt Hz
        const sg=ctx.createGain(); sg.gain.value=1200; sg.connect(det);   // SEQ pitch is in octaves and is followed exactly (MOD AMT doesn't apply)
        n.ins.pitch=mg; n.ins.pitchSeq=sg; n.ins.fm=fg; n.outs.out=out; break; }
      case 'noise': {
        const s=ctx.createBufferSource(); s.buffer=noiseBuffer(ctx); s.loop=true; n.outs.out=s; sources.push(s); break; }
      case 'filter': {
        if(ENGINE==='studio'&&ctx.__studio&&STUDIO.ladder&&P.type==='lowpass'){
          const f=new AudioWorkletNode(ctx,'ladder',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit',processorOptions:{t0}});
          f.parameters.get('cutoff').value=P.cutoff*Math.pow(2,(P.track||0)*(note-60)/12); f.parameters.get('res').value=P.res;
          const mg=ctx.createGain(); mg.gain.value=P.cutAmt; mg.connect(f.parameters.get('cents')); workers.push(f);
          n.ins.in=f; n.ins.cut=mg; n.outs.out=f; break; }
        const f=ctx.createBiquadFilter(); f.type=P.type; f.frequency.value=Math.min(ctx.sampleRate*0.45,P.cutoff*Math.pow(2,(P.track||0)*(note-60)/12));   // KEY TRK: cutoff follows the note (relative to middle C)
        f.Q.value = (P.type==='bandpass'||P.type==='notch') ? 0.6+P.res*14 : -3+P.res*28;
        const mg=ctx.createGain(); mg.gain.value=P.cutAmt; mg.connect(f.detune);
        n.ins.in=f; n.ins.cut=mg; n.outs.out=f; break; }
      case 'vca': {
        const g=ctx.createGain(); const cv=incoming(m.id,'gain'); g.gain.value=cv?0:P.level;
        const mg=ctx.createGain(); mg.gain.value=P.level; mg.connect(g.gain);
        n.ins.in=g; n.ins.gain=mg; n.outs.out=g; break; }
      case 'env': {
        const c=ctx.createConstantSource(); c.offset.value=0; n.outs.out=c; sources.push(c);
        envs.push({param:c.offset,p:P,id:m.id}); maxR=Math.max(maxR,ENGINE==='studio'?P.r*2:P.r); break; }   // Studio releases curve out: silent by ~2× R
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
      case 'seq': {
        const pc=ctx.createConstantSource(), gc=ctx.createConstantSource(); pc.offset.value=0; gc.offset.value=0; sources.push(pc,gc);
        const st=seqSteps(P,gate); seqs[m.id]=st;
        st.forEach(({t,v,g},k)=>{ const at=t0+t;
          if(P.glide>0&&k>0) pc.offset.setTargetAtTime(v/12,at,P.glide/3); else pc.offset.setValueAtTime(v/12,at);
          gc.offset.setValueAtTime(1,at); if(g<st.step-1e-6) gc.offset.setValueAtTime(0,at+g); });
        if(gate!=null) gc.offset.setValueAtTime(0,t0+gate);
        n.outs.pitch=pc; n.outs.gate=gc; break; }
      case 'sync': {
        const f=mtof(note)*Math.pow(2,P.oct), out=ctx.createGain(), sg=ctx.createGain(); sg.gain.value=P.sweepAmt||0;
        if(ctx.__sync){ const w=new AudioWorkletNode(ctx,'sync-osc',{numberOfInputs:0,outputChannelCount:[1],processorOptions:{wave:P.wave,t0}});
          w.parameters.get('freq').value=f; w.parameters.get('ratio').value=P.ratio; sg.connect(w.parameters.get('ratio')); w.connect(out); workers.push(w); }
        else { const o=ctx.createOscillator(); o.type=P.wave; o.frequency.value=f*P.ratio; o.connect(out); sources.push(o); }
        n.ins.sweep=sg; n.outs.out=out; break; }
      case 'ring': {
        const g=ctx.createGain(); g.gain.value=0; const lv=ctx.createGain(); lv.gain.value=P.level; g.connect(lv);
        n.ins.a=g; n.ins.b=g.gain; n.outs.out=lv; break; }
      case 'func': {
        const c=ctx.createConstantSource(); c.offset.value=0; n.outs.out=c; sources.push(c); funcs.push({param:c.offset,p:P}); break; }
      case 'modvca': {
        const g=ctx.createGain(); g.gain.value=incoming(m.id,'cv')?0:P.amt; const cg=ctx.createGain(); cg.gain.value=P.amt; cg.connect(g.gain);
        n.ins.in=g; n.ins.cv=cg; n.outs.out=g; break; }
      case 'fold': {
        const pre=ctx.createGain(); pre.gain.value=P.fold/FOLD_MAX; const cg=ctx.createGain(); cg.gain.value=(P.foldAmt||0)/FOLD_MAX; cg.connect(pre.gain);
        const ws=ctx.createWaveShaper(); ws.curve=foldCurve(); ws.oversample='4x'; const lv=ctx.createGain(); lv.gain.value=P.level; pre.connect(ws); ws.connect(lv);
        n.ins.in=pre; n.ins.cv=cg; n.outs.out=lv; break; }
      case 'lpg': {
        // One control voltage opens volume AND brightness together: quieter is darker, like an acoustic sound dying away.
        const f=ctx.createBiquadFilter(); f.type='lowpass'; f.Q.value=0; f.frequency.value=60*Math.pow(2,8*P.open);
        const g=ctx.createGain(); g.gain.value=P.open; f.connect(g);
        const cv=ctx.createGain(); cv.gain.value=1; const cents=ctx.createGain(); cents.gain.value=9600; cv.connect(g.gain); cv.connect(cents); cents.connect(f.detune);
        n.ins.in=f; n.ins.cv=cv; n.outs.out=g; break; }
      case 'out': n.ins.in=dest; break;
    }
  }
  const typeOf=id=>(patch.modules.find(x=>x.id===id)||{}).type;
  for(const c of patch.cables){
    const a=N[c.from.m], b=N[c.to.m]; if(!a||!b) continue;
    const seqPitch=typeOf(c.from.m)==='seq'&&c.from.p==='pitch';
    const src=a.outs[c.from.p], dst=(seqPitch&&b.ins[c.to.p+'Seq'])||b.ins[c.to.p]; if(src&&dst) src.connect(dst);
  }
  // An ENV with a SEQ GATE in its TRIG jack restarts on every step instead of once per note.
  for(const e of envs){
    const c=patch.cables.find(x=>x.to.m===e.id&&x.to.p==='trig'&&seqs[x.from.m]&&x.from.p==='gate'); if(!c) continue;
    e.trig=true; const st=seqs[c.from.m], prm=e.param; prm.setValueAtTime(0,t0);
    if(ENGINE==='studio'){ const p=e.p, ta=Math.max(p.a/Math.log(1.3/0.3),1e-4);
      st.forEach(({t,g})=>{ const at=t0+t; prm.setTargetAtTime(1.3,at,ta);
        if(g>p.a){ prm.setValueAtTime(1,at+p.a); prm.setTargetAtTime(p.s,at+p.a,Math.max(p.d,1e-3)/EXP_K); }
        prm.setValueAtTime(Math.min(1,envAtExp(p,g)),at+g); prm.setTargetAtTime(0,at+g,Math.max(p.r,1e-3)/EXP_K); });
      continue; }
    st.forEach(({t,g},k)=>{ const pts=envPoints(e.p,g), next=k+1<st.length?st[k+1].t-t:Infinity;
      if(k>0){ const prevPts=envPoints(e.p,st[k-1].g); prm.setValueAtTime(ptsAt(prevPts,st.step),t0+t); }
      for(let i=1;i<pts.length&&pts[i][0]<next;i++) prm.linearRampToValueAtTime(pts[i][1],t0+t+pts[i][0]); });
  }
  for(const e of envs){
    if(e.trig) continue;
    if(ENGINE==='studio'){ schedEnvExp(e.param,e.p,t0,gate); continue; }
    const prm=e.param; prm.setValueAtTime(0,t0);
    const pts = gate!=null ? envPoints(e.p,gate) : [[0,0],[e.p.a,1],[e.p.a+e.p.d,e.p.s]];
    for(let i=1;i<pts.length;i++) prm.linearRampToValueAtTime(pts[i][1],t0+pts[i][0]);
  }
  for(const fn of funcs){
    const prm=fn.param, p=fn.p; prm.setValueAtTime(0,t0);
    if(p.loop==='loop'){ const H=gate!=null?gate+6:30; let t=0, k=0; while(t<H&&k<3000){ t+=p.rise; prm.linearRampToValueAtTime(1,t0+t); t+=p.fall; prm.linearRampToValueAtTime(0,t0+t); k++; } }
    else { prm.linearRampToValueAtTime(1,t0+p.rise); prm.linearRampToValueAtTime(0,t0+p.rise+p.fall); }
  }
  sources.forEach(s=>s.start(t0));
  return {
    maxR,
    release(t){
      for(const e of envs){
        if(e.trig){ const prm=e.param; if(prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t); else prm.cancelScheduledValues(t); prm.linearRampToValueAtTime(0,t+e.p.r); continue; }
        if(ENGINE==='studio'){ const prm=e.param, v=Math.min(1,envAtExp(e.p,t-t0)); prm.cancelScheduledValues(t); prm.setValueAtTime(v,t); prm.setTargetAtTime(0,t,Math.max(e.p.r,1e-3)/EXP_K); continue; }
        const prm=e.param, v=envAt(e.p,t-t0);
        if(prm.cancelAndHoldAtTime){ prm.cancelAndHoldAtTime(t); }
        else { prm.cancelScheduledValues(t0); prm.setValueAtTime(0,t0); const pts=[[0,0],[e.p.a,1],[e.p.a+e.p.d,e.p.s]].filter(q=>q[0]<t-t0); pts.slice(1).forEach(q=>prm.linearRampToValueAtTime(q[1],t0+q[0])); prm.linearRampToValueAtTime(v,t); }
        prm.linearRampToValueAtTime(0,t+e.p.r);
      }
    },
    stop(t){ if(this._stopAt!=null&&t>=this._stopAt) return; this._stopAt=t;   // the earliest stop wins (multi-note gigs stop each note, then the whole render)
      sources.forEach(s=>{try{s.stop(t);}catch(_){}});
      workers.forEach(w=>{ try{ w.port.postMessage({stopAt:t}); }catch(_){} }); }   // each processor sleeps until its note starts and ends itself at t
  };
}
/* A gig's notes: one held note, or L.seq = [[semitones, start, gate], …] for multi-note targets (e.g. key tracking). */
function buildNotes(ctx,patch,dest,t0,L){
  if(!L.seq) return buildVoice(ctx,patch,dest,t0,L.note,L.gate);
  const vs=L.seq.map(([st,at,g])=>{ const v=buildVoice(ctx,patch,dest,t0+at,L.note+st,g); v.stop(t0+at+g+Math.min(v.maxR,1.5)+0.02); return v; });   // each note ends after its own gate + release
  return {maxR:Math.max(...vs.map(v=>v.maxR)), release(t){ vs.forEach(v=>v.release(t)); }, stop(t){ vs.forEach(v=>v.stop(t)); }};
}
/* Output chain: declick gain -> master -> dest. Returns input node + gate controls. */
function outChain(ctx,dest,t0,level=1){
  const dc=ctx.createGain(); dc.gain.setValueAtTime(0,t0); dc.gain.linearRampToValueAtTime(1,t0+0.004);
  const mg=ctx.createGain(); mg.gain.value=MASTER*level; dc.connect(mg); mg.connect(dest);
  return {node:dc, close(t){ dc.gain.setValueAtTime(1,t-0.025); dc.gain.linearRampToValueAtTime(0,t); }};
}

/* ---- Live playback ---- */
let AC=null, liveBus=null;
let studioBus=null, plainBus=null;
try{ localStorage.removeItem('sph.engine'); }catch(_){}   // the old Classic/Studio toggle is gone
/* A short stereo room for the studio finish (seeded noise, different per channel for width). */
function roomIR(ctx){ const len=Math.floor(ctx.sampleRate*0.9), b=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch), r=seeded(77+ch*13); for(let i=0;i<len;i++){ const t=i/ctx.sampleRate; d[i]=r()*Math.exp(-t*6.5)*(t<0.008?t/0.008:1)*0.5; } } return b; }
function setEngine(e){ ENGINE=e; if(AC) liveBus=(e==='studio'&&studioBus)?studioBus:(plainBus||liveBus); }
function ac(){
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(_){}
  if(!AC){
    AC=new (window.AudioContext||window.webkitAudioContext)();
    const comp=AC.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=8; comp.connect(AC.destination); liveBus=comp; ensureWorklets(AC);
    // Studio finish (what you hear only, never scoring): gentle saturation, glue compression, a small stereo room.
    const sat=AC.createWaveShaper(); sat.curve=(()=>{ const c=new Float32Array(2048); for(let i=0;i<2048;i++){ const x=i/1023.5-1; c[i]=Math.tanh(1.6*x)/Math.tanh(1.6); } return c; })(); sat.oversample='2x';
    const glue=AC.createDynamicsCompressor(); glue.threshold.value=-18; glue.ratio.value=2.5; glue.attack.value=0.02; glue.release.value=0.18; glue.knee.value=8;
    const room=AC.createConvolver(); room.buffer=roomIR(AC); const wet=AC.createGain(); wet.gain.value=0.16; const mk=AC.createGain(); mk.gain.value=1.35;
    sat.connect(glue); glue.connect(mk); mk.connect(AC.destination); glue.connect(room); room.connect(wet); wet.connect(AC.destination);
    studioBus=sat; plainBus=comp;
    if(ENGINE==='studio') liveBus=studioBus;
  }
  if(AC.state==='suspended') AC.resume();
  return AC;
}
let oneShots=[];
function playFixed(patch,L,which){
  const ctx=ac(); stopOneShots();
  const t0=ctx.currentTime+0.03, oc=outChain(ctx,liveBus,t0);
  const v=buildNotes(ctx,patch,oc.node,t0,L);
  oc.close(t0+L.dur); v.stop(t0+L.dur+0.05);
  oneShots.push({v,oc,end:t0+L.dur});
  flashPlay(which,L.dur);
}
function stopOneShots(){ const ctx=AC; if(!ctx) return; if(typeof stopSong==='function') stopSong(); const t=ctx.currentTime+0.03; oneShots.forEach(o=>{ if(o.end>t){ o.oc.close(t); o.v.stop(t+0.05);} }); oneShots=[]; }
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
/* The end-of-gig jingle is the gig's demo song played on the player's patch (the same one ♫ Song previews while building). */
let jingleNow=null;
function playJingle(patch, L){
  const ctx=ac(); stopJingle(); stopOneShots();
  jingleNow=scheduleSong(ctx, liveBus, patch, L, ctx.currentTime+0.08);
  return jingleNow;
}
function stopJingle(){ if(jingleNow&&AC){ jingleNow.stop(AC.currentTime); } jingleNow=null; }
/* ---- Demo songs: a few bars of club music built around each gig's sound ----
   All phrases are original. notes: [semitones from the gig's note, start (beats), length (beats), velocity].
   groove: a drum pattern from GROOVES; skip: drum lanes to leave out (when the gig's own sound is that drum);
   swing: pushes every second 16th late (0–0.3). Patterns are 16 steps per bar: x accent, o normal, . ghost, - rest. */
const st16=list=>list.map(([step,n,len=1.6,v=.85])=>[n,step/4,len/4,v]);          // [16th step, semis, length in 16ths, vel]
const chordsAt=(list,len,vel=.5)=>list.flatMap(([beat,ch])=>ch.map(n=>[n,beat,len,vel]));
const rep=(list,beats,times=2)=>Array.from({length:times},(_,k)=>list.map(([n,at,len,v])=>[n,at+k*beats,len,v])).flat();
const GROOVES={
  house:  {kick:'x---x---x---x---', clap:'----x-------x---', ohat:'--o---o---o---o-', chat:'-.-.-.-.-.-.-.-.', shaker:'.o..'.repeat(4)},
  deep:   {kick:'o---o---o---o---', clap:'----.-------.---', ohat:'--.---.---.---.-', shaker:'.o.o.o.o.o.o.o.o', rim:'---.------.----.'},
  techno: {kick:'x---x---x---x---', ohat:'--x---x---x---x-', chat:'o.-.o.-.o.-.o.-.', rim:'---.------.--.--', clap:'----.-------o---'},
  acid:   {kick:'x---x---x---x---', clap:'----x-------x---', ohat:'--o---o---o---o-', chat:'.o.-.o.-.o.-.o.-'},
  dubtech:{kick:'x---x---x---x---', rim:'---o--.---o----.', chat:'--.---.---.---.-', shaker:'.-.-.-.-.-.-.-.-'},
  dnb:    {kick:'x---------x-----x-x-------x-----', snare:'----x-------x-------x--.----x-.-', chat:'o-o-o-o-o-o-o-o-', ohat:'--------------o-'},
  jungle: {kick:'x-x-------xx------x---x---x-----', snare:'----x--.-.--x--.-.--x--.--x.x-xx', chat:'o.o.o.o.o.o.o.o.', ohat:'------o---------'},
  halftime:{kick:'x-------------x-x-----x---------', snare:'--------x---------------x-------', chat:'o-.-o-.-o-.-o-.-', rim:'-----.-----.----', ohat:'------------o---'},
  boom:   {kick:'x------x--x-----x-----x---x---.-', snare:'----x-------x-------x-------x--.', chat:'o-o-o-o-o-o-o-o-'},
};
const SONGS = {
  // acid: 303-style 16ths, rests and accents, octave jumps
  acid:   { bpm:128, groove:'acid', notes:st16([[0,0,1.6,1],[2,0],[3,12,1.2],[5,0],[6,3,2.4],[8,0,1.6,1],[10,10],[12,0,1.6,1],[13,12,1.2],[15,7],
            [16,0,1.6,1],[18,0],[19,12,1.2],[21,0],[22,3],[23,5,2.4],[25,0],[26,15,1.2,1],[27,12],[29,10],[30,7],[31,3,1.2]]) },
  // house: offbeat bass with octave pops
  bass:   { bpm:124, groove:'house', swing:.1, notes:st16([[2,0,1.8,1],[6,0,1.8],[7,12,.9,.7],[10,0,1.8,1],[13,10,1],[14,0,1.8],
            [18,0,1.8,1],[22,0,1.8],[23,12,.9,.7],[26,3,1.8,1],[29,5,1],[30,7,1.8]]) },
  // techno bass: syncopated offbeat stabs with room to breathe, a pickup and a turnaround
  techbass:{ bpm:128, groove:'techno', notes:st16([[2,0,2.6,1],[6,0,2.6,.9],[9,0,1,.65],[10,0,2.6,1],[14,-2,2,.85],
            [18,0,2.6,1],[22,0,2.6,.9],[25,3,1,.65],[26,0,2.6,1],[30,-5,2,.85]]) },
  // drum & bass: long subs, half-time feel at 172
  dnb:    { bpm:172, groove:'dnb', notes:[[0,0,1.5,1],[0,2.5,.5,.8],[-2,3,1,.9],[-5,4,2.4,1],[-2,6.5,.5,.8],[0,7,1,.9],[0,8,1.5,1],[3,10.5,.5,.8],[2,11,1,.9],[0,12,2.4,1],[-2,14.5,.5,.8],[-5,15,1,.9]] },
  // jungle: sub stabs under a chopped break
  jungle: { bpm:165, groove:'jungle', notes:[[0,0,.75,1],[0,1.5,.5,.8],[0,2.5,1.4,.95],[-2,4,.75,1],[-2,5.5,.5,.8],[-5,6.5,1.4,.95],[0,8,.75,1],[0,9.5,.5,.8],[3,10.5,1,.95],[2,12,.75,1],[0,13.5,2.2,1]] },
  // half-time bass music at 180: the wobble gigs' LFOs (3 and 6 Hz) land on quarter and eighth notes here, so the wobble locks to the beat
  wobble: { bpm:180, groove:'halftime', notes:[[0,0,3.9,1],[0,4,1.9,.9],[-2,6,1.9,.9],[0,8,3.9,1],[3,12,.9,.85],[2,13,.9,.85],[-5,14,1.9,1]] },
  // techno lead riff, minor, syncopated
  lead:   { bpm:130, groove:'techno', notes:st16([[0,0,1.6,1],[3,0],[6,12],[8,10],[10,7],[12,3,2.6],[14,5],[16,0,1.6,1],[19,0],[22,12],[24,15,1.6,1],[26,12],[28,10,3],[31,7,1]]) },
  // melodic techno arpeggio over i – VI
  pluck:  { bpm:124, groove:'deep', notes:st16([...[0,7,12,3,7,12,15,12, 0,7,12,3,7,12,10,7].map((n,i)=>[i,n,1.4,i%4?.7:.95]),
            ...[-4,3,8,0,3,8,12,8, -2,5,10,2,5,10,14,10].map((n,i)=>[16+i,n,1.4,i%4?.7:.95])]) },
  // deep house: minor-9 chord stabs, syncopated
  keys:   { bpm:122, groove:'deep', swing:.12, notes:chordsAt([[.5,[0,3,7,10,14]],[1.75,[0,3,7,10,14]],[2.5,[0,3,7,10,14]],[3.75,[-2,3,7,10]],
            [4.5,[-4,0,3,7,10]],[5.75,[-4,0,3,7,10]],[6.5,[-4,0,3,7,10]],[7.25,[-5,-2,2,5,10]]],.35,.42) },
  // lo-fi: lazy minor-7 chords on a swung boom-bap beat
  lofi:   { bpm:84, groove:'boom', swing:.22, notes:chordsAt([[0,[0,3,7,10,14]],[2.75,[0,3,7,10]],[4,[-4,0,3,7,11]],[6.5,[-5,-2,2,5,9]]],1.2,.42) },
  // dub techno: chord stabs on the offbeats, spaced out
  dub:    { bpm:118, groove:'dubtech', notes:chordsAt([[.5,[0,3,7,10]],[1.75,[0,3,7,10]],[3.5,[0,3,7,10]],[4.5,[0,3,7,10]],[5.75,[-2,2,5,9]],[7.5,[0,3,7,10]]],.3,.45) },
  // bells and FM: a sparse minor-pentatonic riff over dub techno
  bell:   { bpm:120, groove:'dubtech', notes:[[0,0,.5,.95],[7,.75,.5,.8],[10,1.5,.5,.85],[12,2.5,1,.95],[7,3.5,.5,.8],[3,4,.5,.85],[5,4.75,.5,.8],[7,5.5,1,.9],[0,7,.75,.85]] },
  // ambient pads: slow minor-9 chords, no drums
  pads:   { bpm:84, notes:chordsAt([[0,[0,3,7,10,14]],[2,[-4,0,3,7,10]],[4,[-7,-4,0,3,7]],[6,[-5,-2,2,5]]],1.9) },
  // sounds that move by themselves: held notes, alone or over a groove
  hold:   { bpm:120, notes:[[0,0,3.7,.9],[5,4,3.7,.9]] },
  techhold:{ bpm:130, groove:'techno', notes:[[0,0,3.8,.9],[-2,4,3.8,.9]] },
  household:{ bpm:124, groove:'house', notes:[[0,0,3.9,.9],[-2,4,3.9,.9]] },
  fx:     { bpm:128, groove:'techno', notes:[[0,0,1,.9],[0,3.5,.5,.8],[7,4,1,.95],[-5,7,1,.9]] },
  // percussion gigs: the gig's own drum takes its place in a groove
  kick:   { bpm:92, groove:'boom', swing:.2, skip:['kick'], notes:st16([[0,0,1,1],[7,0,1,.8],[10,0,1,.9],[16,0,1,1],[22,0,1,.9],[26,0,1,.9]]) },
  tom:    { bpm:92, groove:'boom', swing:.2, notes:st16([[3,0,1,.8],[11,-5,1,.8],[24,5,1,.9],[26,0,1,.9],[28,-5,1,.95],[30,-7,1,1]]) },
  snare:  { bpm:124, groove:'house', skip:['clap','snare'], notes:st16([[4,0,1,1],[12,0,1,1],[15,0,1,.5],[20,0,1,1],[28,0,1,1],[30,0,1,.55],[31,0,1,.65]]) },
  hat:    { bpm:128, groove:'techno', skip:['chat','ohat','shaker'], notes:st16(Array.from({length:32},(_,i)=>[i,0,1,i%4===2?1:i%2?.55:.75])) },
  cowbell:{ bpm:124, groove:'house', notes:st16([[0,0,1,1],[3,0,1,.8],[6,7,1,.9],[10,0,1,.85],[12,7,1,.9],[16,0,1,1],[19,0,1,.8],[22,7,1,.9],[26,0,1,.85],[28,12,1,1],[30,7,1,.9]]) },
  // sequencer gigs: the patch's own SEQ plays, so just hold notes at its tempo over a groove
  seqhold:{ bpm:120, followSeq:true, groove:'techno', notes:[[0,0,3.95,.95],[5,4,3.95,.95],[0,8,3.95,.95]] },
  seqacid:{ bpm:120, followSeq:true, groove:'acid', notes:[[0,0,3.95,.95],[5,4,3.95,.95],[0,8,3.95,.95]] },
  seqdeep:{ bpm:120, followSeq:true, groove:'deep', notes:[[0,0,3.95,.95],[5,4,3.95,.95],[0,8,3.95,.95]] },
};
const SONG_BY_CH={basics:'lead',filters:'lead',bass:'bass',pads:'pads',leads:'lead',perc:'cowbell',fx:'fx',mix:'bass',harm:'keys',fm:'bell',fxrack:'pluck',
  strings:'pluck',random:'hold',seqlab:'seqhold',repair:'bass',sync:'techbass',modlab:'hold',west:'pluck',bonus:'bass'};
const SONG_BY_GIG={
  shape:'lead','pixel-knight':'pluck','thin-walls':'lofi',gate:'keys',pluck:'pluck',vibrato:'bell',
  squelch:'acid',acid:'acid',payphone:'keys',air:'techhold',vowel:'household',notch:'dub',swell:'pads',
  sub:'jungle','wow-bass':'bass','pluck-bass':'bass',wobble:'wobble',reese:'dnb',
  brass:'keys',supersaw:'lead',flute:'bell',stadium:'lead',
  kick:'kick',tom:'tom',snare:'snare',hat:'hat',cowbell:'cowbell',
  laser:'fx',siren:'hold',wind:'hold',ufo:'hold',
  'sub-layer':'dnb',breath:'bell','layer-cake':'lead','octave-up':'lead','build-square':'lead','build-saw':'lead',drawbar:'keys',
  'metal-ring':'fx','fm-bell':'bell',epiano:'keys',gong:'hold',
  slapback:'bass',canyon:'bell','big-room':'bell',chorus:'pads',fuzz:'techbass','dub-stab':'dub',
  bleeps:'techhold','rand-filter':'techhold',robot:'hold',
  slide:'seqdeep',warehouse:'seqacid',
  'no-signal':'bass',muffled:'bass','wrong-jack':'pluck',seasick:'lead','total-wreck':'acid',
  'torn-edge':'techbass','sync-sweep':'techhold','robot-voice':'fx',screamer:'lead',
  'strike-once':'bell',pump:'household','late-vibrato':'bell',tidal:'wobble',
  fold:'techbass',bloom:'lead','even-keel':'bass'};
function songFor(L){ return SONGS[(L&&(L.song||SONG_BY_GIG[L.id]||SONG_BY_CH[L.ch]))||'lead']; }
/* A small drum kit for the backing, built from the game's own modules. */
const DRUM_KIT=(()=>{ const P=(t,p={})=>Object.fromEntries(MT[t].params.map(d=>[d.id,p[d.id]!==undefined?p[d.id]:d.def]));
  const C=s=>{ const [a,b]=s.split('>'),[am,ap]=a.split('.'),[bm,bp]=b.split('.'); return {from:{m:am,p:ap},to:{m:bm,p:bp}}; };
  const K=(mods,cables)=>({modules:[...mods.map(([id,type,p])=>({id,type,params:type==='noise'?{}:P(type,p)})),{id:'out',type:'out',params:{}}],cables:cables.map(C)});
  const noiseHit=(type,cutoff,res,d,a=.001)=>K([['n','noise'],['f','filter',{type,cutoff,res}],['v','vca',{level:1}],['e','env',{a,d,s:0,r:.02}]],['n.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']);
  return {
    // kick: a sine dropping two and a half octaves, a little drive, and a short click on top
    kick:{note:33, ...K([['o','osc',{wave:'sine',pitchAmt:3000}],['d','drive',{drive:2.2,level:.9}],['v','vca',{level:1}],['e','env',{a:.001,d:.34,s:0,r:.05}],['p','env',{a:.001,d:.045,s:0,r:.02}],
        ['n','noise'],['h','filter',{type:'highpass',cutoff:3200,res:.1}],['c','vca',{level:.22}],['ce','env',{a:.001,d:.006,s:0,r:.01}]],
        ['o.out>d.in','d.out>v.in','v.out>out.in','e.out>v.gain','p.out>o.pitch','n.out>h.in','h.out>c.in','c.out>out.in','ce.out>c.gain'])},
    clap:{note:60, flam:true, ...noiseHit('bandpass',1150,.35,.17)},
    snare:{note:55, ...K([['o','osc',{wave:'triangle'}],['n','noise'],['f','filter',{type:'bandpass',cutoff:2600,res:.1}],['v','vca',{level:1}],['e','env',{a:.001,d:.15,s:0,r:.04}]],
        ['o.out>v.in','n.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain'])},
    chat:{note:60, ...noiseHit('highpass',8200,.1,.035)},
    ohat:{note:60, ...noiseHit('highpass',7600,.1,.24)},
    shaker:{note:60, ...noiseHit('bandpass',6500,.2,.05,.006)},
    rim:{note:86, ...K([['o','osc',{wave:'square'}],['f','filter',{type:'bandpass',cutoff:1750,res:.5}],['v','vca',{level:1}],['e','env',{a:.001,d:.025,s:0,r:.01}]],
        ['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain'])},
  }; })();
const DRUM_LVL={kick:.62,clap:.4,snare:.42,chat:.16,ohat:.13,shaker:.1,rim:.2};
const songBars=S_=>{ const g=S_.groove&&GROOVES[S_.groove], noteEnd=Math.max(...S_.notes.map(n=>n[1]+n[2]));
  return Math.max(g?Math.max(...Object.values(g).map(p=>p.length/16)):0, Math.ceil(noteEnd/4-1e-6)); };
function songBpm(S_,patch){ const q=S_.followSeq&&patch.modules.find(m=>m.type==='seq'); return q?q.params.bpm:S_.bpm; }
function songLength(L,patch){ const S_=songFor(L), beat=60/songBpm(S_,patch); return Math.max(songBars(S_)*4, Math.max(...S_.notes.map(n=>n[1]+n[2])))*beat; }
/* Schedule a demo song on ctx. Returns {end, events, beat, stop(t)}. */
function scheduleSong(ctx, dest, patch, L, t0){
  const S_=songFor(L), beat=60/songBpm(S_,patch), voices=[], events=[], sw=(S_.swing||0)*beat/4; let end=0;
  const when=at=>t0+at*beat+(Math.round(at*4)%2?sw:0);
  const play=(p,note,t,dur,vel,lvl=1)=>{ const oc=outChain(ctx,dest,t,vel*lvl), v=buildVoice(ctx,p,oc.node,t,note,dur), stopAt=t+dur+Math.min(v.maxR,2.5)+0.06;
    oc.close(stopAt); v.stop(stopAt+0.02); voices.push({oc,v,stopAt}); end=Math.max(end,stopAt); };
  S_.notes.forEach(([rel,at,len,vel])=>{ play(patch,L.note+rel,when(at),len*beat,vel); events.push({t:when(at)-t0,dur:len*beat,note:L.note+rel,beat:Math.floor(at+1e-6)}); });
  const g=S_.groove&&GROOVES[S_.groove];
  if(g){ const bars=songBars(S_), skip=new Set(S_.skip||[]);
    Object.entries(g).forEach(([lane,pat])=>{ if(skip.has(lane)) return; const kit=DRUM_KIT[lane];
      for(let i=0;i<bars*16;i++){ const c=pat[i%pat.length]; if(c==='-') continue; const v=c==='x'?1:c==='o'?.75:.42, t=when(i/4);
        if(kit.flam){ play(kit,kit.note,t,.01,v*.5,DRUM_LVL[lane]); play(kit,kit.note,t+.011,.01,v*.6,DRUM_LVL[lane]); play(kit,kit.note,t+.022,.02,v,DRUM_LVL[lane]); }
        else play(kit,kit.note,t,lane==='ohat'?.12:.02,v,DRUM_LVL[lane]); } }); }
  return { end, events, beat, stop(t){ voices.forEach(x=>{ if(x.stopAt>t){ x.oc.close(t+0.03); x.v.stop(t+0.06); } }); } };
}
let songNow=null;
function playSong(patch, L){
  const ctx=ac(); stopOneShots(); stopJingle();
  const t0=ctx.currentTime+0.06; songNow=scheduleSong(ctx, liveBus, patch, L, t0); songNow.endAt=songNow.end;
  return songNow.end-ctx.currentTime;
}
function stopSong(){ if(songNow&&AC) songNow.stop(AC.currentTime); songNow=null; }
async function renderSong(patch, L){
  const len=Math.ceil((songLength(L,patch)+3)*SR), ctx=new OfflineAudioContext(1,len,SR);
  if(usesWorklet(patch)) await ensureWorklets(ctx);
  scheduleSong(ctx, ctx.destination, patch, L, 0.02);
  return (await ctx.startRendering()).getChannelData(0);
}
/* Offline render of the jingle (used by tests to check every gig's jingle is audible). */
function renderJingle(patch, L){ return renderSong(patch, L); }
