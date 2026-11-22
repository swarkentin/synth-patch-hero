/* Synth Patch Hero · Playing notes: on-screen keyboard, computer keys, USB/MIDI, and the play-the-note prompt. */
'use strict';
/* ---------- playing: one path for MIDI, on-screen keys and computer keys ---------- */
function keyDown(id,note,vel){
  if(!S.L||note<0||note>127) return;
  if(held[id]) noteOff(id);
  S.sustained.delete(id); S.idNote[id]=note;
  noteOn(id,note,vel); paintLit(); checkPrompt(note); if(id.startsWith('p')) Haptics.key();
  if(!id.startsWith('p')) ensureVisible(note);
}
function keyUp(id){
  if(!(id in S.idNote)) return; delete S.idNote[id];
  if(S.sustain&&!id.startsWith('p')) S.sustained.add(id); else noteOff(id);
  paintLit();
}
function setSustain(on){
  S.sustain=on; if(!on){ S.sustained.forEach(id=>{ if(!(id in S.idNote)) noteOff(id); }); S.sustained.clear(); }
}
const ORD=['','first','second','third','fourth','fifth','sixth','seventh','eighth'];
function describeKey(n){
  if(n===60) return 'middle C, the C near the centre of most keyboards';
  const name=NOTE_NAMES[n%12]; let c=0;
  if(n<60){ for(let m=59;m>=n;m--) if(m%12===n%12) c++; return c===1?`the ${name} just below middle C`:`the ${ORD[c]||c+'th'} ${name} below middle C`; }
  for(let m=61;m<=n;m++) if(m%12===n%12) c++; return c===1?`the ${name} just above middle C`:`the ${ORD[c]||c+'th'} ${name} above middle C`;
}
function checkPrompt(note){
  if(S.sandbox||!S.L||S.promptDone) return;
  const t=S.L.note;
  if(note===t){
    S.promptDone=true; progress.played=progress.played||{}; progress.played[S.L.id]=true; saveProgress();
    S.kbFb=null; renderPrompt(); flashKey(t);
    toast(`That's ${noteName(t)}, the note the client recorded on. Every key now plays your patch.`); return;
  }
  const d=t-note, pl=x=>Math.abs(x)===1?'':'s';
  if(d%12===0){ const o=d/12; S.kbFb=`That's ${noteName(note)}. Right note, wrong octave: go ${Math.abs(o)} octave${pl(o)} ${o>0?'up':'down'}.`; }
  else S.kbFb=`That's ${noteName(note)}. ${noteName(t)} is ${Math.abs(d)} semitone${pl(d)} ${d>0?'higher (to the right)':'lower (to the left)'}, counting black keys.`;
  renderPrompt();
}
function renderPrompt(){
  const el_=$('#kbPrompt'); if(!el_||!S.L) return;
  if(S.sandbox){ el_.innerHTML=`<span class="lbl">FREE PLAY</span><span class="desc">Every key plays your patch. Computer keys A–K work too.</span>`; return; }
  const t=S.L.note;
  if(S.promptDone){ el_.innerHTML=`<span class="okk">✓ ${noteName(t)}</span><span class="desc">is the client's note (outlined). Every key plays your patch, so try a melody.</span>`; return; }
  el_.innerHTML=`<span class="lbl">PLAY THE CLIENT'S NOTE</span><span class="nn">${noteName(t)}</span><span class="desc">${describeKey(t)}</span>${S.kbFb?`<span class="fb bad">${S.kbFb}</span>`:''}`;
}
const isBlack=n=>[1,3,6,8,10].includes(n%12);
function kbRangeFor(t,oct){ return Math.max(0,12*Math.floor(t/12)-(oct>=3?12:0)); }
function renderKeys(){
  const wrap=$('#kbWrap'); if(!wrap||!S.L||!wrap.clientWidth) return;
  const W=wrap.clientWidth, H=wrap.clientHeight||92;
  const oct=W>=760?4:W>=470?3:2;
  if(S.kbLo==null||oct!==S.kbOct){ S.kbOct=oct; S.kbLo=kbRangeFor(S.L.note,oct); }
  S.kbLo=Math.max(0,Math.min(120-12*oct,S.kbLo));
  const lo=S.kbLo, hi=lo+12*oct, whites=[]; for(let n=lo;n<=hi;n++) if(!isBlack(n)) whites.push(n);
  const ww=W/whites.length, bw=ww*0.62, bh=H*0.62, t=S.L.note, tgtCls=S.sandbox?'':(' tgt'+(S.promptDone?'':' pulse'));
  let h=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
  whites.forEach((n,i)=>{ const x=i*ww;
    h+=`<rect class="wk${n===t?tgtCls:''}" data-n="${n}" x="${x+0.5}" y="0.5" width="${ww-1}" height="${H-1}" rx="3"/>`;
    if(n%12===0) h+=`<text class="klab" x="${x+ww/2}" y="${H-6}" text-anchor="middle">C${n/12-1}</text>`;
    if(n===60) h+=`<circle class="kmid" cx="${x+ww/2}" cy="${H-20}" r="3"/>`;
    if(n===t&&!S.sandbox) h+=`<rect class="tpill" x="${x+ww/2-15}" y="${bh+6}" width="30" height="16" rx="8"/><text class="ttxt" x="${x+ww/2}" y="${bh+18}" text-anchor="middle">${noteName(n)}</text>`;
  });
  whites.forEach((n,i)=>{ const b=n+1; if(b<=hi&&isBlack(b)){ const x=(i+1)*ww-bw/2;
    h+=`<rect class="bk${b===t?tgtCls:''}" data-n="${b}" x="${x}" y="0" width="${bw}" height="${bh}" rx="2"/>`;
    if(b===t&&!S.sandbox) h+=`<rect class="tpill" x="${x+bw/2-15}" y="${bh-22}" width="30" height="16" rx="8"/><text class="ttxt" x="${x+bw/2}" y="${bh-10}" text-anchor="middle">${noteName(b)}</text>`; } });
  h+='</svg>'; wrap.innerHTML=h; Haptics.addSwitch(wrap);
  $('#kbRange').textContent=`C${lo/12-1}–C${hi/12-1}`;
  paintLit();
}
function paintLit(){ const on=new Set(Object.values(S.idNote)); document.querySelectorAll('#kbWrap [data-n]').forEach(k=>k.classList.toggle('on',on.has(+k.dataset.n))); }
function flashKey(n){ const k=document.querySelector(`#kbWrap [data-n="${n}"]`); renderKeys(); const k2=document.querySelector(`#kbWrap [data-n="${n}"]`); if(k2){ k2.classList.add('okf'); setTimeout(()=>k2.classList.remove('okf'),900); } }
function ensureVisible(n){ if(n<S.kbLo||n>S.kbLo+12*S.kbOct){ S.kbLo=kbRangeFor(n,S.kbOct); renderKeys(); } }
(function wireKeyboard(){
  const wrap=document.getElementById('kbWrap'); const ptr={};
  const noteAt=e=>{ const t=document.elementFromPoint(e.clientX,e.clientY); const k=t&&t.closest&&t.closest('#kbWrap [data-n]'); return k?+k.dataset.n:null; };
  wrap.addEventListener('pointerdown',e=>{ const n=noteAt(e); if(n==null) return; e.preventDefault(); try{wrap.setPointerCapture(e.pointerId);}catch(_){}
    const id='p'+e.pointerId; ptr[id]=n; keyDown(id,n,0.9); });
  wrap.addEventListener('pointermove',e=>{ const id='p'+e.pointerId; if(!(id in ptr)) return; const n=noteAt(e); if(n!=null&&n!==ptr[id]){ keyUp(id); ptr[id]=n; keyDown(id,n,0.9); } });
  const end=e=>{ const id='p'+e.pointerId; if(id in ptr){ keyUp(id); delete ptr[id]; } };
  wrap.addEventListener('pointerup',end); wrap.addEventListener('pointercancel',end); wrap.addEventListener('lostpointercapture',end);
  wrap.addEventListener('contextmenu',e=>e.preventDefault());
})();

/* ---------- USB / MIDI keyboards (Web MIDI) ---------- */
const MIDI={state:'idle',names:[],err:''};
function onMIDI(e){
  const [st,d1,d2]=e.data, cmd=st&0xf0;
  if(cmd===0x90&&d2>0) keyDown('midi'+d1,d1,0.35+0.65*d2/127);
  else if(cmd===0x80||(cmd===0x90&&d2===0)) keyUp('midi'+d1);
  else if(cmd===0xB0&&d1===64) setSustain(d2>=64);
  else if(cmd===0xB0&&(d1===120||d1===123)) allNotesOff();
}
async function connectMIDI(auto){
  if(!navigator.requestMIDIAccess){ MIDI.state='unsupported'; renderMidiChip(); if(!auto) toast(/iPhone|iPad|iPod/.test(navigator.userAgent)?'iPhone and iPad Safari can\'t use MIDI keyboards. Use the on-screen keys.':'This browser can\'t use MIDI keyboards. Try Chrome or Edge.'); return; }
  if(!auto) ac();
  try{
    const acc=await navigator.requestMIDIAccess({sysex:false}); MIDI.acc=acc;
    const bind=()=>{ MIDI.names=[]; acc.inputs.forEach(inp=>{ inp.onmidimessage=onMIDI; MIDI.names.push(inp.name||'MIDI keyboard'); });
      const was=MIDI.state; MIDI.state=MIDI.names.length?'on':'none'; renderMidiChip();
      if(MIDI.state==='on'&&was!=='on') toast('Connected: '+MIDI.names.join(', ')); };
    acc.onstatechange=bind; bind(); store.set('midiAuto',true);
    if(!auto&&MIDI.state==='none') toast('MIDI is on, but no keyboard is plugged in yet.');
  }catch(err){
    MIDI.state='blocked'; MIDI.err=(err&&err.name)||String(err); renderMidiChip();
    if(!auto) toast('MIDI is blocked on this page. Open the game file directly in Chrome or Edge to use a USB keyboard.');
  }
}
function renderMidiChip(){
  const c=$('#midiChip'); if(!c) return; c.className='midiChip'; c.hidden=!navigator.requestMIDIAccess; // e.g. iPhone: no MIDI at all, so don't offer it
  const T={idle:['Connect USB keyboard','Use a USB/MIDI keyboard to play your patch'],
    unsupported:['No MIDI in this browser','This browser has no Web MIDI. Chrome, Edge, Opera, Firefox (desktop) and Chrome on Android do.'],
    blocked:['MIDI blocked · retry','The page or browser blocked MIDI ('+MIDI.err+'). Opening the game file directly in Chrome or Edge usually works.'],
    none:['No keyboard found','MIDI is on. Plug in a keyboard and it will connect automatically.'],
    on:['● '+(MIDI.names[0]||'')+(MIDI.names.length>1?' +'+(MIDI.names.length-1):''),'Connected: '+MIDI.names.join(', ')]}[MIDI.state];
  c.textContent=T[0]; c.title=T[1];
  if(MIDI.state==='on') c.classList.add('on'); if(MIDI.state==='blocked'||MIDI.state==='unsupported') c.classList.add('warn');
}
