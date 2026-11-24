/* Synth Patch Hero · Help ladder: explain what's wrong, then (if asked) patch it or lock the knob that matters most. */
'use strict';

const PARAM_HELP = {
  'osc.wave': 'The waveform is the shape of the vibration. It sets the tone colour: sine is pure, triangle soft, square hollow, saw bright and buzzy.',
  'osc.oct': 'OCT jumps the pitch by whole octaves. Each step doubles or halves the frequency.',
  'osc.semi': 'SEMI moves the pitch in semitones, one piano key per step.',
  'osc.fine': 'FINE detunes in cents (1/100 of a semitone). Small differences between two oscillators make them shimmer and beat.',
  'osc.pitchAmt': 'MOD AMT sets how far a signal patched into PITCH can bend the pitch.',
  'filter.type': 'The filter type decides which part of the sound is kept: lows (LP), highs (HP) or a band in the middle (BP).',
  'filter.cutoff': 'CUTOFF is where the filter starts cutting. On a low-pass, lower means darker and more muffled.',
  'filter.res': 'RES boosts the frequencies right at the cutoff. High settings whistle and squelch.',
  'filter.cutAmt': 'MOD AMT sets how far a signal patched into CUT can open the filter, in octaves above CUTOFF.',
  'vca.level': 'LEVEL is the loudness. With something patched into CV it is the most the VCA can open to.',
  'env.a': 'ATTACK is how long the envelope takes to rise to full when the key goes down.',
  'env.d': 'DECAY is how long it takes to fall from full down to the sustain level.',
  'env.s': 'SUSTAIN is the level held for as long as the key stays down. It is a level, not a time.',
  'env.r': 'RELEASE is how long it takes to fade to zero after the key is let go.',
  'lfo.wave': 'The LFO shape decides how it moves: smoothly (sine, triangle), jumping between two values (square), or in ramps (saw).',
  'lfo.rate': 'RATE is the LFO speed in cycles per second.',
  'osc.fmAmt': 'FM AMT sets how hard audio patched into FM bends this oscillator\'s frequency, in Hz. More FM = more (and more clangy) harmonics.',
  'mixer.l1': 'LEVEL 1 is how loud input 1 is in the mix.', 'mixer.l2': 'LEVEL 2 is how loud input 2 is in the mix.', 'mixer.l3': 'LEVEL 3 is how loud input 3 is in the mix.',
  'harm.h1': 'H1 is the fundamental: the note itself.', 'harm.h2': 'H2 is the 2nd harmonic: one octave up.', 'harm.h3': 'H3 is the 3rd harmonic: an octave and a fifth up.',
  'harm.h4': 'H4 is the 4th harmonic: two octaves up.', 'harm.h5': 'H5 is the 5th harmonic: two octaves and a major third up.', 'harm.h6': 'H6 is the 6th harmonic: two octaves and a fifth up.',
  'delay.sync': 'MS sets the delay time yourself. NOTE tunes the delay to the played note, which turns a feedback delay into a plucked string.',
  'delay.time': 'TIME is how long before the echo comes back.',
  'delay.fb': 'FDBK (feedback) sends the echo back into the delay, so it repeats. More feedback = more repeats (or a longer-ringing string).',
  'delay.mix': 'MIX balances the original (dry) sound against the echoes (wet).',
  'delay.tone': 'TONE darkens each repeat. Low settings make echoes fade into warmth, and make plucked strings mellow.',
  'delay.modAmt': 'MOD sets how far a signal in the TIME jack wobbles the delay time. Small wobbles make chorus and flanger sounds.',
  'reverb.size': 'SIZE is how long the room rings: small room to cathedral.',
  'reverb.mix': 'MIX balances the dry sound against the room.',
  'drive.drive': 'DRIVE pushes the signal into soft clipping, adding harmonics. Higher = grittier.',
  'drive.level': 'LEVEL is the output volume after the drive.',
  'sh.rate': 'RATE is how many random steps per second.',
  'filter.track': 'KEY TRK moves the cutoff with the note you play, so high notes stay as bright as low ones. At 100% the cutoff follows the pitch exactly.',
  'sync.ratio': 'RATIO is how fast the synced wave runs compared with the note. It restarts every cycle of the note, so higher ratios add a stronger, brighter "tear" while the pitch stays put.',
  'sync.sweepAmt': 'SWEEP sets how far a signal in the SWEEP jack pushes the ratio up. An envelope here gives the classic screaming sync sweep.',
  'sync.oct': 'OCT moves the note (and the whole synced sound) up or down by octaves.',
  'ring.level': 'LEVEL is the output volume of the ring modulator.',
  'func.loop': 'ONCE runs the rise and fall one time per note, whatever the hold. LOOP repeats them forever, which turns the function generator into an LFO with any shape you like.',
  'func.rise': 'RISE is how long the shape takes to climb from 0 to full.',
  'func.fall': 'FALL is how long the shape takes to fall back to 0.',
  'modvca.amt': 'AMOUNT scales the control signal passing through. Left of centre inverts it. With something in CV, that signal sets how much gets through.',
  'fold.fold': 'FOLD is how hard the wave is pushed into the folder. Each time it passes the edge it folds back, adding bright, rubbery harmonics.',
  'fold.foldAmt': 'MOD AMT sets how far a signal in the CV jack pushes the fold. An envelope here makes the tone bloom and settle.',
  'fold.level': 'LEVEL is the output volume of the folder.',
  'comb.sync': 'HZ tunes the comb to FREQ. NOTE tunes it to whatever note is played, so the resonance follows the keyboard.',
  'comb.freq': 'FREQ is the pitch the comb rings at. It boosts that frequency and every multiple of it, so noise going in comes out pitched.',
  'comb.fb': 'FDBK is how long and strongly the comb rings. Positive gives a bright, metallic ring on every harmonic. Negative keeps only the odd ones: hollow, and an octave lower.',
  'comb.tone': 'TONE darkens each trip around the comb, so the high ringing dies first, like a softer material.',
  'comb.mix': 'MIX blends the dry input back in. Around 50% the peaks and dips sit side by side, which is the swooshing sound of a flanger when the tuning moves.',
  'comb.modAmt': 'MOD AMT sets how far a signal in the FREQ jack sweeps the tuning, in octaves.',
  'lpg.open': 'OPEN is how open the gate rests with no signal in its CV. Usually 0, so the envelope does all the work.',
};
const MODULE_WHY = {
  osc: 'An oscillator is the sound source.',
  noise: 'Noise is hiss: every frequency at once. Drums, breath and wind are made from it.',
  filter: 'A filter removes part of the tone to make it darker, thinner or more focused.',
  vca: 'A VCA lets another module control the loudness.',
  env: 'An envelope is a shape that plays once per note. It makes something change over the course of the note.',
  lfo: 'An LFO is a slow, repeating movement.',
  mixer: 'A mixer combines several sounds with a level for each, so layers can be balanced.',
  harm: 'A harmonic oscillator builds a tone from individual sine harmonics, like the drawbars on an organ.',
  delay: 'A delay repeats the sound after a short time: echoes, or (with feedback tuned to the note) a plucked string.',
  reverb: 'A reverb adds the sound of a room around the sound.',
  drive: 'Drive clips the signal softly, adding harmonics and grit.',
  sh: 'Sample & hold jumps to a new random value at a steady rate: classic computer bleeps.',
  sync: 'A sync oscillator restarts its wave every cycle of the note, giving a hard, tearing tone that changes as you move the ratio.',
  ring: 'A ring modulator multiplies two sounds, creating new tones at their sum and difference: metallic, bell-like, robotic.',
  func: 'A function generator draws a rise-and-fall shape, once per note or looping forever.',
  modvca: 'A MOD VCA lets one control signal set how much of another gets through. Modulation controlling modulation.',
  fold: 'A wavefolder folds loud peaks back on themselves, adding harmonics without a filter.',
  comb: 'A comb filter is a very short echo fed back on itself. It rings at one pitch and its harmonics: tuned pipes, metal, hollow tubes and jet swooshes.',
  lpg: 'A low-pass gate opens volume and brightness together with one signal, so notes fade darker as they get quieter.',
};
const PORT_WHY = {
  'out.in': 'That is what sends it to the speakers.',
  'vca.gain': 'A signal in the VCA\'s CV jack controls the loudness over time.',
  'filter.cut': 'A signal in the filter\'s CUT jack moves the cutoff.',
  'osc.pitch': 'A signal in the oscillator\'s PITCH jack moves the pitch.',
  'filter.in': 'Audio has to pass through the filter to be shaped by it.',
  'vca.in': 'Audio has to pass through the VCA to be controlled by it.',
  'osc.fm': 'Audio in the FM jack bends this oscillator\'s frequency hundreds of times a second. That\'s FM synthesis.',
  'mixer.in1': 'Each mixer input has its own level knob.', 'mixer.in2': 'Each mixer input has its own level knob.', 'mixer.in3': 'Each mixer input has its own level knob.',
  'delay.in': 'Audio has to pass through the delay to be echoed.', 'delay.mod': 'A signal in the delay\'s TIME jack wobbles the delay time.',
  'sync.sweep': 'A signal in the SWEEP jack moves the sync ratio over time.',
  'ring.a': 'The ring modulator needs a sound in both A and B: it multiplies them together.', 'ring.b': 'The ring modulator needs a sound in both A and B: it multiplies them together.',
  'modvca.in': 'The control signal you want to scale goes into the MOD VCA\'s IN.', 'modvca.cv': 'A signal in the MOD VCA\'s CV decides how much of IN gets through.',
  'comb.in': 'Audio has to pass through the comb to ring at its pitch.', 'comb.cv': 'A signal in the comb\'s FREQ jack sweeps its tuning.', 'fold.in': 'Audio has to pass through the folder to be folded.', 'fold.cv': 'A signal in the folder\'s CV jack moves the fold amount.',
  'lpg.in': 'Audio has to pass through the low-pass gate to be shaped by it.', 'lpg.cv': 'A signal in the LPG\'s CV opens volume and brightness together.',
  'reverb.in': 'Audio has to pass through the reverb to get the room sound.', 'drive.in': 'Audio has to pass through the drive to be distorted.',
};
const H = { card:null, pending:null, busy:false };
const modOf = (p,id) => p.modules.find(m=>m.id===id);
const portLabel = (m,pid,dir) => { const T=MT[m.type]; return ((dir==='in'?T.ins:T.outs).find(x=>x.id===pid)||{label:pid}).label; };
const sameCable = (a,b) => a.from.m===b.from.m&&a.from.p===b.from.p&&a.to.m===b.to.m&&a.to.p===b.to.p;
const paramDef = (type,id) => MT[type].params.find(d=>d.id===id);
const paramName = (m,d) => `${MT[m.type].name} ${d.label||(d.id==='wave'?'WAVE':'TYPE')}`;

/* Pair each module of the reference patch with one of the player's, by type, wiring and knob similarity. */
function matchPatch(T,P,prior){
  const map={out:'out'}, used=new Set(['out']);
  // Keep earlier pairings while they still make sense, so locked knobs stay attached to the same module.
  for(const [tid,pid] of Object.entries(prior||{})){ const t=modOf(T,tid), p=modOf(P,pid);
    if(t&&p&&t.type===p.type&&!used.has(pid)&&tid!=='out'){ map[tid]=pid; used.add(pid); } }
  const sig=(p,id)=>new Set(p.cables.flatMap(c=>{ const r=[];
    if(c.from.m===id){ const t=modOf(p,c.to.m); if(t) r.push('>'+t.type+'.'+c.to.p); }
    if(c.to.m===id){ const f=modOf(p,c.from.m); if(f) r.push('<'+f.type+'.'+c.to.p); } return r; }));
  const pdist=(a,b)=>MT[a.type].params.reduce((s,d)=>s+(d.type==='choice'?(a.params[d.id]===b.params[d.id]?0:1):Math.abs(toN(d,a.params[d.id])-toN(d,b.params[d.id]))),0);
  for(const t of T.modules.filter(m=>m.type!=='out'&&!map[m.id])){
    const ts=sig(T,t.id); let best=null, bs=-Infinity;
    for(const p of P.modules){ if(p.type!==t.type||used.has(p.id)) continue;
      const ps=sig(P,p.id); let ov=0; ts.forEach(x=>{ if(ps.has(x)) ov++; });
      const sc=ov*10-pdist(t,p); if(sc>bs){ bs=sc; best=p; } }
    if(best){ map[t.id]=best.id; used.add(best.id); }
  }
  return map;
}
function structureIssues(){
  const T=targetPatch(S.L), P=S.patch, map=matchPatch(T,P,S.helpMap); S.helpMap=map;
  const missingMods=T.modules.filter(t=>t.type!=='out'&&!map[t.id]);
  const required=T.cables.filter(c=>map[c.from.m]&&map[c.to.m]).map(c=>({from:{m:map[c.from.m],p:c.from.p},to:{m:map[c.to.m],p:c.to.p},t:c}));
  const missingCables=required.filter(r=>!P.cables.some(c=>sameCable(c,r)));
  const extraCables=P.cables.filter(c=>!required.some(r=>sameCable(c,r)));
  return {T,P,map,missingMods,missingCables,extraCables,ok:!missingMods.length&&!missingCables.length&&!extraCables.length&&T.cables.every(c=>map[c.from.m]&&map[c.to.m])};
}
function describeCable(p,c){ const f=modOf(p,c.from.m), t=modOf(p,c.to.m); return `${MT[f.type].name} ${portLabel(f,c.from.p,'out')} → ${MT[t.type].name} ${portLabel(t,c.to.p,'in')}`; }

/* Rebuild the player's wiring to match the reference: add missing modules, add missing cables, unplug extra ones. Knob settings are kept. */
function applyStructure(si){
  const notes=[], P=S.patch;
  for(const t of si.missingMods){
    let place=emptySlots().length?{slot:emptySlots()[0]}:null;
    if(!place){ const spare=P.modules.find(m=>!m.locked&&m.type!=='out'&&!Object.values(si.map).includes(m.id));
      if(spare){ place=spare.slot!=null?{slot:spare.slot}:{slot:null,x:spare.x,y:spare.y}; P.modules=P.modules.filter(m=>m!==spare); P.cables=P.cables.filter(c=>c.from.m!==spare.id&&c.to.m!==spare.id); notes.push(`Removed an unused ${MT[spare.type].name} to make room.`); } }
    if(!place){ // every box is taken or covered by floating modules: float the new one below the board
      const bottom=Math.max(S.grid.baseH+S.grid.off[1],...P.modules.map(m=>modXY(m)[1]+SH)); place={slot:null,x:PAD,y:bottom+GAP-S.grid.off[1]}; }
    const id='m'+(idc++); P.modules.push(Object.assign({id,type:t.type,params:defaultParams(t.type)},place)); si.map[t.id]=id;
    notes.push(`Added a <b>${MT[t.type].name}</b>. ${MODULE_WHY[t.type]}`);
  }
  const required=si.T.cables.filter(c=>si.map[c.from.m]&&si.map[c.to.m]).map(c=>({from:{m:si.map[c.from.m],p:c.from.p},to:{m:si.map[c.to.m],p:c.to.p}}));
  const extra=P.cables.filter(c=>!required.some(r=>sameCable(c,r)));
  if(extra.length){ notes.push(`Unplugged ${extra.map(c=>describeCable(P,c)).join(', ')} (not part of the client's patch).`); P.cables=P.cables.filter(c=>!extra.includes(c)); }
  for(const r of required) if(!P.cables.some(c=>sameCable(c,r))){ P.cables.push({from:r.from,to:r.to});
    const t=modOf(P,r.to.m); notes.push(`Patched <b>${describeCable(P,r)}</b>. ${PORT_WHY[t.type+'.'+r.to.p]||''}`); }
  S.helpMap=si.map;
  return notes;
}

/* Try each knob at the client's value; return the one that helps the score most. */
async function findKeyParam(){
  const si=structureIssues(), L=S.L, cands=[];
  for(const t of si.T.modules){ if(t.type==='out') continue; const m=modOf(S.patch,si.map[t.id]); if(!m) continue;
    for(const d of MT[t.type].params){ if(d.req&&!S.feats.has(d.req)) continue; if(m.locks&&m.locks[d.id]) continue;
      const tv=t.params[d.id], mv=m.params[d.id];
      const off=d.type==='choice'?(tv!==mv):d.step?Math.abs(tv-mv)>=d.step/2:Math.abs(toN(d,tv)-toN(d,mv))>0.002;
      if(off) cands.push({m,d,tv,mv}); } }
  if(!cands.length) return null;
  if(!L._tA) L._tA=analyze(await renderPatch(targetPatch(L),L));
  const base=levelCompare(L,L._tA,analyze(await renderPatch(S.patch,L))).overall;
  for(const c of cands){ const old=c.m.params[c.d.id]; c.m.params[c.d.id]=c.tv;
    c.gain=levelCompare(L,L._tA,analyze(await renderPatch(S.patch,L))).overall-base; c.m.params[c.d.id]=old; }
  cands.sort((a,b)=>b.gain-a.gain);
  return cands[0];
}
function direction(c){
  const {d,tv,mv,m}=c;
  if(d.type==='choice') return `Yours is set to ${mv}, which isn't the client's choice.`;
  const higher=toN(d,mv)>toN(d,tv);
  const word={'env.a':['starts too slowly','starts too quickly'],'env.d':['falls too slowly','falls too quickly'],'env.r':['fades out too slowly','fades out too quickly'],
    'env.s':['holds too loud','holds too quiet'],'filter.cutoff':m.params.type==='highpass'?['cuts too much','cuts too little']:['is too open','is too closed'],
    'lfo.rate':['moves too fast','moves too slowly'],'comb.freq':['rings too high','rings too low'],'comb.fb':['rings too long or too bright','rings too briefly or too hollow'],'osc.oct':['is too high','is too low'],'osc.semi':['is too high','is too low']}[m.type+'.'+d.id]||['is set too high','is set too low'];
  return `Yours ${higher?word[0]:word[1]}.`;
}
function lockParam(c){
  const {m,d,tv,mv}=c; m.params[d.id]=tv; m.locks=m.locks||{};
  m.locks[d.id]={why:`Locked by Help at the client's value (${d.type==='choice'?tv:d.fmt(tv)}). Yours was ${d.type==='choice'?mv:d.fmt(mv)}. ${direction(c)} With this one set, the rest of the patch is easier to hear and match.`};
}

/* ---------- UI ---------- */
function helpCard(html,actions){
  let c=$('#helpCard'); if(!c){ c=el('div',{id:'helpCard'}); $('#viewport').appendChild(c); c.addEventListener('pointerdown',e=>e.stopPropagation()); }
  c.innerHTML=`<div class="hcHead"><b>HELP</b><span>${progressHelpCount()}</span><button class="hcX" title="Close">×</button></div><div class="hcBody">${html}</div><div class="hcBtns"></div>`;
  Haptics.upgrade(c.querySelector('.hcX')); c.querySelector('.hcX').onclick=closeHelp;
  const bw=c.querySelector('.hcBtns'); (actions||[]).forEach(a=>{ const b=Haptics.upgrade(el('button',{class:'btn'+(a.primary?' primary':'')},a.label)); b.onclick=()=>Haptics.later(a.run); bw.appendChild(b); });
  c.hidden=false;
}
function closeHelp(){ const c=$('#helpCard'); if(c) c.hidden=true; H.pending=null; }
function progressHelpCount(){ const n=(progress.helped||{})[S.L&&S.L.id]||0; return n?`used ${n}×`:''; }
function markHelped(){ progress.helped=progress.helped||{}; progress.helped[S.L.id]=(progress.helped[S.L.id]||0)+1; saveProgress(); S.stuck.shown=true; const b=$('#btnHelp'); if(b) b.classList.remove('pulse'); }
function afterChange(){ renderPalette(); renderRack(); scheduleAnalyze(); }

async function requestHelp(){
  if(H.busy||S.sandbox||!S.L) return;
  const b=$('#btnHelp'); if(b) b.classList.remove('pulse');
  if(S.cmp&&S.cmp.overall>=PASS){ helpCard(`<p>You're at <b>${Math.floor(S.cmp.overall)}%</b>, which is good enough to send. Press <b>Send</b>!</p>`); return; }
  const si=structureIssues();
  if(!si.ok){
    let msg;
    if(si.missingMods.length){ const t=si.missingMods[0], dest=si.T.cables.filter(c=>c.from.m===t.id).map(c=>describeCable(si.T,c));
      msg=`<p>This sound needs ${si.missingMods.length>1?'more modules, starting with':'a'} <b>${MT[t.type].name}</b>${dest.length?` (patched ${dest[0].split('→')[1].trim()})`:''}.</p><p>${MODULE_WHY[t.type]}</p>`; }
    else if(si.missingCables.length){ const r=si.missingCables[0], t=modOf(si.T,r.t.to.m);
      msg=`<p>You have the right modules, but a cable is missing: <b>${describeCable(si.T,r.t)}</b>.</p><p>${PORT_WHY[t.type+'.'+r.t.to.p]||''}</p>`; }
    else { const c=si.extraCables[0]; msg=`<p>Your cable <b>${describeCable(si.P,c)}</b> isn't part of the client's patch, and it's changing the sound.</p>`; }
    helpCard(msg+`<p class="hcSoft">Want me to wire it up? Your knob settings are kept.</p>`,[
      {label:'Patch it for me',primary:true,run:()=>{ const notes=applyStructure(structureIssues()); markHelped(); Haptics.plug(); afterChange();
        helpCard(`<ul>${notes.map(n=>`<li>${n}</li>`).join('')}</ul><p class="hcSoft">Now listen again. If it's still off, press Help for the knob that matters most.</p>`); }},
      {label:'I\'ll try myself',run:closeHelp}]);
    return;
  }
  H.busy=true; helpCard('<p class="hcSoft">Listening to each knob…</p>');
  try{
    const c=await findKeyParam();
    if(!c){ helpCard('<p>Your patch already has every knob at the client\'s settings. Press ▶ Yours to hear it.</p>'); return; }
    const name=paramName(c.m,c.d), info=PARAM_HELP[c.m.type+'.'+c.d.id]||'';
    if(H.pending&&H.pending.m===c.m&&H.pending.d===c.d){ lockNow(c); return; }
    H.pending=c;
    helpCard(`<p>The biggest difference right now is <b>${name}</b>. ${direction(c)}</p><p>${info}</p>`,[
      {label:'Lock it for me',primary:true,run:()=>lockNow(c)},
      {label:'I\'ll try myself',run:closeHelp}]);
    flashKnob(c.m,c.d);
  } finally { H.busy=false; }
}
function lockNow(c){
  lockParam(c); markHelped(); H.pending=null; Haptics.plug(); afterChange();
  helpCard(`<p><b>${paramName(c.m,c.d)}</b> is now locked at the client's value: <b>${c.d.type==='choice'?c.tv:c.d.fmt(c.tv)}</b>.</p><p>${PARAM_HELP[c.m.type+'.'+c.d.id]||''}</p><p class="hcSoft">Tap a locked knob to read why, or to unlock it. Press Help again for the next one.</p>`);
  setTimeout(()=>flashKnob(c.m,c.d),50);
}
function flashKnob(m,d){
  const mod=document.querySelector(`.module[data-id="${m.id}"]`); if(!mod) return;
  const k=[...mod.querySelectorAll('[data-param]')].find(x=>x.dataset.param===d.id); if(!k) return;
  k.classList.add('flash'); setTimeout(()=>k.classList.remove('flash'),2400);
}
function showLockInfo(m,d){
  const sh=$('#sheet'); sh.hidden=false; sh.style.setProperty('--sel',MT[m.type].color);
  const v=m.params[d.id];
  sh.innerHTML=`<div class="sheetCard"><div class="shHead"><span class="shTitle">LOCKED · ${paramName(m,d)}</span><button class="btn primary" id="shDone">OK</button></div>
    <div class="shVal">${d.type==='choice'?v:d.fmt(v)}</div>
    <p class="lockWhy">${(m.locks[d.id]||{}).why||''}</p><p class="lockWhy dim">${PARAM_HELP[m.type+'.'+d.id]||''}</p>
    <div class="shRow"><button id="shUnlock">Unlock</button><button id="shPlay">▶ Yours</button></div></div>`;
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; };
  $('#shDone').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); };
  $('#shPlay').onclick=()=>playFixed(S.patch,S.L,'pY');
  $('#shUnlock').onclick=()=>{ delete m.locks[d.id]; close(); renderRack(); saveDraft(); toast(`${paramName(m,d)} unlocked`); };
}

/* Stuck detection: lots of tweaking, no progress → the Help button pulses and offers itself once. */
S.stuck={start:0,lastImprove:0,best:0,changes:0,shown:false};
function resetStuck(){ S.helpMap=null; const t=Date.now(); S.stuck={start:t,lastImprove:t,best:0,changes:0,shown:false}; closeHelp(); }
function noteScore(score){ if(score>S.stuck.best+2){ S.stuck.best=score; S.stuck.lastImprove=Date.now(); } }
setInterval(()=>{
  if(!S.L||S.sandbox||S.stuck.shown||!S.cmp||S.cmp.overall>=PASS) return;
  const t=Date.now();
  if(t-S.stuck.start>60000&&t-S.stuck.lastImprove>40000&&S.stuck.changes>=10){
    S.stuck.shown=true; const b=$('#btnHelp'); if(b) b.classList.add('pulse');
    toast('Stuck? Help can point at the problem, or lock a knob for you.');
  }
},5000);

/* Used by tests: apply help (wiring first, then the most useful knob) until the gig passes. */
async function autoHelp(){
  const si=structureIssues(); if(!si.ok){ applyStructure(si); renderRack(); return 'wiring'; }
  const c=await findKeyParam(); if(!c) return null; lockParam(c); renderRack(); return paramName(c.m,c.d);
}
