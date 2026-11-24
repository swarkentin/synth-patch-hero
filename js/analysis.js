/* Synth Patch Hero · Offline rendering, FFT analysis and the match score. */
'use strict';
/* =====================================================================
   ANALYSIS: offline render + spectral comparison
   ===================================================================== */
const SR=22050, FN=2048, HOP=512, EB=256, BPO=36, FMIN=40, FMAX=10000;
const NB=Math.floor(BPO*Math.log2(FMAX/FMIN))+1;
const BANDS=(()=>{ const df=SR/FN, out=[]; for(let b=0;b<NB;b++){ const fc=FMIN*Math.pow(2,b/BPO), lo=fc*Math.pow(2,-0.5/BPO), hi=fc*Math.pow(2,0.5/BPO); out.push({fc,kLo:Math.ceil(lo/df),kHi:Math.floor(hi/df),kc:fc/df}); } return out; })();
const HANN=(()=>{ const w=new Float32Array(FN); for(let i=0;i<FN;i++) w[i]=0.5-0.5*Math.cos(2*Math.PI*i/(FN-1)); return w; })();
function fft(re,im){
  const n=re.length;
  for(let i=1,j=0;i<n;i++){ let bit=n>>1; for(;j&bit;bit>>=1) j^=bit; j^=bit; if(i<j){ let t=re[i];re[i]=re[j];re[j]=t; t=im[i];im[i]=im[j];im[j]=t; } }
  for(let len=2;len<=n;len<<=1){ const ang=-2*Math.PI/len, wr=Math.cos(ang), wi=Math.sin(ang), h=len>>1;
    for(let i=0;i<n;i+=len){ let cr=1,ci=0; for(let j=0;j<h;j++){ const a=i+j,b=a+h; const tr=re[b]*cr-im[b]*ci, ti=re[b]*ci+im[b]*cr; re[b]=re[a]-tr; im[b]=im[a]-ti; re[a]+=tr; im[a]+=ti; const t=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=t; } } }
}
async function renderPatch(patch,L){
  const len=Math.ceil(L.dur*SR);
  const ctx=new OfflineAudioContext(1,len,SR);
  const oc=outChain(ctx,ctx.destination,0);
  if(usesWorklet(patch)) await ensureWorklets(ctx);
  const v=buildNotes(ctx,patch,oc.node,0,L); oc.close(L.dur); v.stop(L.dur);
  const buf=await ctx.startRendering(); return buf.getChannelData(0);
}
/* Render several patches of one gig in a single offline context, one patch per channel (up to 32 per context).
   Chrome never frees an OfflineAudioContext that has loaded AudioWorklet code (see docs/ideas.md), so Help's knob trials, which render
   the patch once per knob, share contexts instead of making one each. Everything is built before rendering starts, so each channel is
   exactly what renderPatch would give. */
async function renderPatches(patches,L){
  const out=[], len=Math.ceil(L.dur*SR);
  for(let i=0;i<patches.length;i+=32){
    const group=patches.slice(i,i+32), ctx=new OfflineAudioContext(group.length,len,SR);
    if(group.some(usesWorklet)) await ensureWorklets(ctx);
    const mg=ctx.createChannelMerger(group.length); mg.connect(ctx.destination);
    group.forEach((p,k)=>{ const ch=ctx.createGain(); ch.channelCount=1; ch.channelCountMode='explicit'; ch.connect(mg,0,k);
      const oc=outChain(ctx,ch,0), v=buildNotes(ctx,p,oc.node,0,L); oc.close(L.dur); v.stop(L.dur); });
    const buf=await ctx.startRendering(); for(let k=0;k<group.length;k++) out.push(buf.getChannelData(k));
  }
  return out;
}
/* The player's patch, rendered and analysed, remembered for the last few versions: undo, or turning a knob back, needs no new render. */
const MINE_CACHE=new Map();
function patchKey(patch,L){ return L.id+'|'+JSON.stringify([patch.modules.map(m=>[m.id,m.type,m.params]),patch.cables.map(c=>[c.from.m,c.from.p,c.to.m,c.to.p])]); }
async function renderMine(patch,L){
  const k=patchKey(patch,L), hit=MINE_CACHE.get(k); if(hit){ MINE_CACHE.delete(k); MINE_CACHE.set(k,hit); return hit; }
  const x=await renderPatch(patch,L), r={x,a:analyze(x)}; MINE_CACHE.set(k,r);
  while(MINE_CACHE.size>24) MINE_CACHE.delete(MINE_CACHE.keys().next().value);
  return r;
}
const dB = p => 10*Math.log10(p+1e-14);
function analyze(x){
  const nF=Math.max(1,Math.floor((x.length-FN)/HOP)+1);
  const spec=new Float32Array(nF*NB), avgP=new Float64Array(NB);
  const re=new Float32Array(FN), im=new Float32Array(FN), pw=new Float32Array(FN/2+1);
  for(let f=0;f<nF;f++){
    const o=f*HOP; for(let i=0;i<FN;i++){ re[i]=(x[o+i]||0)*HANN[i]; im[i]=0; }
    fft(re,im); for(let k=0;k<=FN/2;k++) pw[k]=(re[k]*re[k]+im[k]*im[k])/(FN*FN);
    for(let b=0;b<NB;b++){ const B=BANDS[b]; let p;
      if(B.kLo<=B.kHi){ p=0; for(let k=B.kLo;k<=B.kHi;k++) if(pw[k]>p) p=pw[k]; }
      else { const k0=Math.floor(B.kc), fr=B.kc-k0; p=pw[k0]*(1-fr)+pw[Math.min(k0+1,FN/2)]*fr; }
      spec[f*NB+b]=dB(p); avgP[b]+=p/nF; }
  }
  // loudness: RMS over a 1024-sample window (longer than one cycle of a low bass note), hop EB
  const nE=Math.floor(x.length/EB), env=new Float32Array(nE), EW=1024;
  for(let e=0;e<nE;e++){ const c=e*EB+EB/2, a=Math.max(0,c-EW/2), b=Math.min(x.length,c+EW/2); let s=0; for(let i=a;i<b;i++) s+=x[i]*x[i]; env[e]=dB(s/(b-a)); }
  const avg=new Float32Array(NB); for(let b=0;b<NB;b++) avg[b]=dB(avgP[b]);
  // pitch (normalized square difference) on the loudest steady block
  let pk=0; for(let e=1;e<nE;e++) if(env[e]>env[pk]) pk=e;
  const start=Math.min(Math.max(0,pk*EB+Math.floor(0.04*SR)), Math.max(0,x.length-2048));
  const pitch=estimatePitch(x,start,2048);
  // spectral centroid in octaves
  let num=0,den=0; for(let b=0;b<NB;b++){ num+=avgP[b]*b; den+=avgP[b]; }
  const centroid = den>0 ? num/den/BPO : 0;
  return {spec,nF,avg,env,nE,pitch,centroid,peak:Math.max(...env),silent:Math.max(...env)<-100};
}
function estimatePitch(x,start,W){
  const minLag=Math.floor(SR/2000), maxLag=Math.floor(SR/30);
  if(start+W+maxLag>x.length) W=x.length-start-maxLag; if(W<256) return null;
  let e0=0; for(let i=0;i<W;i++) e0+=x[start+i]*x[start+i]; if(e0<1e-8) return null;
  const nsdf=new Float32Array(maxLag+1);
  for(let t=minLag;t<=maxLag;t++){ let ac=0,m=0; for(let i=0;i<W;i++){ const a=x[start+i], b=x[start+i+t]; ac+=a*b; m+=a*a+b*b; } nsdf[t]=m>0?2*ac/m:0; }
  let t=minLag; while(t<maxLag&&nsdf[t]>0) t++;
  const peaks=[]; let best=-1;
  for(;t<maxLag;t++){ if(nsdf[t]>nsdf[t-1]&&nsdf[t]>=nsdf[t+1]&&nsdf[t]>0){ peaks.push(t); if(nsdf[t]>best) best=nsdf[t]; } }
  if(best<0.6) return null;
  const tp=peaks.find(p=>nsdf[p]>=0.9*best);
  const a=nsdf[tp-1], b=nsdf[tp], c=nsdf[tp+1], d=(a-2*b+c); const sh=d!==0?0.5*(a-c)/d:0;
  return SR/(tp+sh);
}
const K_SPEC=8, K_TONE=6, K_SHAPE=26, PASS=90;
/* tol widens tolerance for movement (spectrogram + shape); tolShape, if given, sets the loudness-shape tolerance separately. */
const levelCompare=(L,T,Y)=>compare(T,Y,L.tol||1,L.tolShape||L.tol||1);
function compare(T,Y,tol=1,tolShape=tol){
  // spectrogram: timbre over time. Each frame is normalized to its own peak (loudness is
  // judged separately by Shape) and weighted by how loud that frame is.
  let ref=-1e9; for(const A of [T,Y]) for(let i=0;i<A.spec.length;i++) if(A.spec[i]>ref) ref=A.spec[i];
  let s=0,n=0; const nF=Math.min(T.nF,Y.nF);
  for(let f=0;f<nF;f++){
    let mT=-1e9,mY=-1e9; for(let b=0;b<NB;b++){ mT=Math.max(mT,T.spec[f*NB+b]); mY=Math.max(mY,Y.spec[f*NB+b]); }
    const loud=Math.pow(10,(Math.max(mT,mY)-ref)/40); if(loud<0.1) continue;
    const silentT=mT<ref-70, silentY=mY<ref-70;
    for(let b=0;b<NB;b++){
      const a=silentT?-60:Math.max(T.spec[f*NB+b]-mT,-60), c=silentY?-60:Math.max(Y.spec[f*NB+b]-mY,-60);
      const w=(Math.max(a,c)+60)/60; if(w<0.01) continue; const ww=w*w*loud;
      s+=Math.min(Math.abs(a-c)+(silentT!==silentY?40:0),50)*ww; n+=ww; }
  }
  const dSpec=n?s/n:0;
  // tone: average spectrum shapes normalized to own peak
  const mT=Math.max(...T.avg), mY=Math.max(...Y.avg); s=0;n=0;
  for(let b=0;b<NB;b++){ const a=Math.max(T.avg[b]-mT,-60), c=Math.max(Y.avg[b]-mY,-60); if(a>-59.5||c>-59.5){ s+=Math.abs(a-c); n++; } }
  const dTone=Y.silent?60:(n?s/n:0);
  // shape: loudness over time
  // shape: loudness over time on a perceptual (amplitude^0.5) scale, 0..100
  const rE=Math.max(T.peak,Y.peak); s=0;n=0; const LE=Math.min(T.nE,Y.nE);
  for(let e=0;e<LE;e++){ const a=Math.pow(10,(T.env[e]-rE)/40), c=Math.pow(10,(Y.env[e]-rE)/40); if(a>0.05||c>0.05){ s+=Math.abs(a-c)*100; n++; } }
  const dShape=n?s/n:0;
  const sSpec=Math.exp(-dSpec/(K_SPEC*tol)), sTone=Math.exp(-dTone/K_TONE), sShape=Math.exp(-dShape/(K_SHAPE*tolShape));
  const overall=Math.pow(sSpec,0.5)*Math.pow(sTone,0.2)*Math.pow(sShape,0.3);
  return {overall:overall*100,sSpec:sSpec*100,sTone:sTone*100,sShape:sShape*100,dSpec,dTone,dShape,hints:makeHints(T,Y)};
}
function envFeatures(A){
  const pk=A.peak; let att=0; while(att<A.nE&&A.env[att]<pk-3) att++;
  let last=A.nE-1; while(last>0&&A.env[last]<pk-30) last--;
  return {attack:att*EB/SR, length:last*EB/SR};
}
function makeHints(T,Y){
  const h=[];
  if(Y.silent){ h.push({t:'Silence. Patch an audio cable all the way to the OUTPUT.'}); return h; }
  if(T.pitch&&Y.pitch){
    const st=12*Math.log2(Y.pitch/T.pitch), r=Math.round(st);
    if(Math.abs(st)<0.35) h.push({ok:1,t:'Pitch is on the note.'});
    else if(Math.abs(r)>=1) h.push({t:`Pitch: yours is ${Math.abs(r)} semitone${Math.abs(r)>1?'s':''} ${r>0?'higher':'lower'}${Math.abs(r)%12===0?' ('+Math.abs(r)/12+' oct)':''}.`});
    else h.push({t:`Pitch: yours is a little ${st>0?'sharp':'flat'}.`});
  }
  const dc=Y.centroid-T.centroid;
  if(Math.abs(dc)>0.25) h.push({t:`Tone: yours is ${dc>0?'brighter':'darker'} than the target.`}); else h.push({ok:1,t:'Brightness is close.'});
  const fT=envFeatures(T), fY=envFeatures(Y);
  const da=fY.attack-fT.attack;
  if(Math.abs(da)>0.03&&Math.abs(da)>0.35*Math.max(fT.attack,0.02)) h.push({t:`Attack: yours ${da>0?'fades in slower':'starts faster'}.`});
  const dl=fY.length-fT.length;
  if(Math.abs(dl)>0.08&&Math.abs(dl)>0.12*fT.length) h.push({t:`Length: yours ${dl>0?'rings longer':'dies away sooner'}.`});
  return h;
}

/* ---- Loudness of a demo song, as heard (used to even out playback levels; see SONG_GAIN in data.js) ----
   k: overall loudness with a K-style weighting (rumble below 60 Hz ignored, highs count a bit more), gated like LUFS.
   phone: loudness through a phone-speaker curve (no bass below ~350 Hz, the piercing 2–5 kHz range counted extra). */
const LOUD_TARGET={k:-22, phone:-23, minDb:-15, maxDb:6};
async function songLoudness(x){
  const weigh=async chain=>{ const c=new OfflineAudioContext(1,x.length,SR), b=c.createBuffer(1,x.length,SR); b.copyToChannel(x,0); const s=c.createBufferSource(); s.buffer=b;
    let n=s; for(const [type,f,g,q] of chain){ const bq=c.createBiquadFilter(); bq.type=type; bq.frequency.value=f; if(g!=null) bq.gain.value=g; if(q!=null) bq.Q.value=q; n.connect(bq); n=bq; }
    n.connect(c.destination); s.start(); return (await c.startRendering()).getChannelData(0); };
  const gated=y=>{ const w=Math.floor(SR*0.4), hop=Math.floor(w/4), ms=[]; for(let i=0;i+w<=y.length;i+=hop){ let a=0; for(let j=i;j<i+w;j++) a+=y[j]*y[j]; ms.push(a/w); }
    const L=m=>-0.691+10*Math.log10(m+1e-12), mean=a=>a.reduce((p,q)=>p+q,0)/Math.max(1,a.length);
    let g=ms.filter(m=>L(m)>-70); if(!g.length) return -99; const rel=L(mean(g))-10; g=g.filter(m=>L(m)>rel); return L(mean(g)); };
  return { k:gated(await weigh([['highpass',60,null,0.5],['highshelf',1500,4]])), phone:gated(await weigh([['highpass',350,null,0.7],['peaking',3200,6,0.8]])) };
}
/* The playback level (dB) that brings a song to the common loudness and keeps it from being piercing on a phone. */
function loudnessGainDb(m){ const T=LOUD_TARGET; return Math.max(T.minDb,Math.min(T.maxDb, T.k-m.k, T.phone-m.phone)); }
