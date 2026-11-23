/* Synth Patch Hero · Gig board, level screen, slot board, knobs, cables, compare panel. */
'use strict';
/* iPhone: these become tap targets with a switch under the finger (see js/haptics.js). Must run before handlers are attached. */
['#briefBtn','#songBtn','#keysBtn','#focusBtn','#btnSettings','#btnHome','#kbClose'].forEach(sel=>Haptics.upgrade(document.querySelector(sel)));
/* =====================================================================
   BOARD
   ===================================================================== */
/* Gig board preview: ▶ on each card plays the client's target sound; tap again (or another ▶) to stop. */
let previewing=null;
function stopPreview(){ if(!previewing) return; clearTimeout(previewing.t); previewing.b.classList.remove('lit'); previewing.b.setAttribute('aria-label','Preview '+previewing.L.title); previewing.b.querySelector('.pvIcon').textContent='▶'; previewing=null; stopOneShots(); }
function previewButton(L){
  let b=el('button',{class:'gigPv',title:'Hear the client\'s sound in a short demo song','aria-label':'Preview '+L.title}); b.innerHTML='<span class="pvIcon">▶</span>';
  b=Haptics.upgrade(b);
  b.addEventListener('click',e=>{ e.stopPropagation(); const mine=previewing&&previewing.b===b; stopPreview(); if(mine) return;
    const dur=playSong(targetPatch(L),L); b.classList.add('lit'); b.querySelector('.pvIcon').textContent='■'; b.setAttribute('aria-label','Stop preview');
    previewing={b,L,t:setTimeout(stopPreview,(dur+0.1)*1000)}; Haptics.select(); });
  return b;
}
function showBoard(){
  pushRoute(null); allNotesOff(); stopOneShots(); S.pick=null; showPatchbar(); $('#sheet').hidden=true;
  S.li=-1; S.L=null; S.patch=null;
  $('#screenLevel').hidden=true; $('#screenBoard').hidden=false; $('#btnHome').hidden=true;
  $('#crumbs').textContent='Gig board'; document.body.classList.remove('inLevel'); if(S.focus) setFocus(false); closeSide(); S.slotMenu=null;
  const solved=Object.keys(progress.solved).length;
  const earn = Object.values(progress.solved).length*85;
  $('#ledger').innerHTML=`<div class="row"><span>Gigs done</span><b>${solved} / ${LEVELS.length}</b></div>
    <div class="row"><span>Earned</span><b>$${earn}</b></div><div class="row"><span>Rent due</span><b>$${Math.max(0,1100-earn)}</b></div>
    <div class="row"><span>Next lesson</span><b>${(LEVELS.find(l=>!progress.solved[l.id])||{concept:'Mastery'}).concept}</b></div>`;
  const g=$('#gigs'); g.innerHTML='';
  CHAPTERS.forEach(c=>{
    const done=c.levels.filter(i=>progress.solved[LEVELS[i].id]).length;
    const sec=el('section',{class:'chapter'}), nxt=nextInChapter(c); sec.dataset.ch=c.id;
    sec.innerHTML=`<div class="chHead"><div><h2>${c.title}${c.level==='advanced'?' <span class="chBadge">ADVANCED</span>':c.bonus?' <span class="chBadge bonus">BONUS</span>':''}</h2><p>${c.blurb}</p></div><span class="chProg">${done===c.levels.length?'✓ complete':done+' / '+c.levels.length}</span></div>`;
    const grid=el('div',{class:'gigs'});
    c.levels.forEach((i,k)=>{
      const L=LEVELS[i], sv=progress.solved[L.id];
      let b=el('button',{class:'gig'+(sv?' solved':'')+(L.challenge?' challenge':'')+(i===nxt?' next':'')});
      b.innerHTML=`<div class="num">${c.short} ${k+1}${L.challenge?' · <span class="chal">CHALLENGE</span>':''}</div><div class="title">${L.title}</div>
        <div class="client">${L.client} · ${L.role}</div>
        <div class="concept"><span class="tag">${L.concept}</span>${sv?`<span class="stamp">PAID · ${sv.cost}¢ · ${Math.round(sv.match)}%${progress.played&&progress.played[L.id]?' · ♪':''}${progress.helped&&progress.helped[L.id]?' · helped':''}</span>`:i===nxt?'<span class="nextTag">NEXT</span>':''}</div>`;
      b=Haptics.upgrade(b); b.addEventListener('click',()=>{ stopPreview(); openLevel(i); });
      const w=el('div',{class:'gigWrap'}); w.dataset.done=sv?'1':''; w.appendChild(b); w.appendChild(previewButton(L)); grid.appendChild(w);
    });
    sec.appendChild(grid); g.appendChild(sec);
  });
  const jam=el('section',{class:'chapter'}); jam.dataset.ch='jam'; jam.innerHTML='<div class="chHead"><div><h2>After hours</h2><p>No clients, no rent. Just you and the rack.</p></div></div>';
  const jg=el('div',{class:'gigs'}); let j=el('button',{class:'gig jam'});
  j.innerHTML=`<div class="num">SANDBOX</div><div class="title">Free Jam</div><div class="client">All modules, no target. Play it like an instrument.</div><div class="concept"><span class="tag">Sandbox</span></div>`;
  j=Haptics.upgrade(j); j.addEventListener('click',()=>openLevel(-1)); jg.appendChild(j); jam.appendChild(jg); g.appendChild(jam);
  g.appendChild(el('p',{class:'boardEmpty',id:'boardEmpty',hidden:''},'Nothing here with this filter. Every gig in this chapter is done!'));
  renderBoardNav(); applyBoardFilter();
}

/* ---------- gig board browsing: chapter chips (a table of contents) + a status filter ---------- */
const BV=Object.assign({ch:null,status:'all'},store.get('boardView',{}));
const CH_GROUPS=[['START',c=>c.id==='basics'],['THEMES',c=>c.id!=='basics'&&!c.level&&!c.bonus],['ADVANCED',c=>c.level==='advanced'],['EXTRAS',c=>c.bonus]];
function renderBoardNav(){
  const nav=$('#boardNav'); nav.innerHTML='';
  const chips=el('div',{class:'bnChips'});
  const chip=(id,label,sub,done)=>{ let b=el('button',{class:'bnChip'+(done?' done':''),'data-ch':id||''}); b.innerHTML=`<span>${label}</span>${sub?`<small>${sub}</small>`:''}`;
    b=Haptics.upgrade(b); b.addEventListener('click',()=>{ BV.ch=id; saveBV(); applyBoardFilter(); Haptics.select(); $('#boardNav').scrollIntoView({block:'start',behavior:'smooth'}); }); return b; };
  chips.appendChild(chip(null,'ALL',`${Object.keys(progress.solved).length}/${LEVELS.length}`));
  CH_GROUPS.forEach(([name,f])=>{ const cs=CHAPTERS.filter(f); if(!cs.length) return; chips.appendChild(el('span',{class:'bnGroup'},name));
    cs.forEach(c=>{ const done=c.levels.filter(i=>progress.solved[LEVELS[i].id]).length; chips.appendChild(chip(c.id,c.short,done===c.levels.length?'✓':`${done}/${c.levels.length}`,done===c.levels.length)); }); });
  chips.appendChild(chip('jam','FREE JAM',''));
  const st=el('div',{class:'bnStatus',role:'group','aria-label':'Show'});
  [['all','All'],['todo','To do'],['done','Done']].forEach(([k,l])=>{ let b=el('button',{class:'bnSt','data-st':k},l); b=Haptics.upgrade(b);
    b.addEventListener('click',()=>{ BV.status=k; saveBV(); applyBoardFilter(); Haptics.select(); }); st.appendChild(b); });
  nav.appendChild(chips); nav.appendChild(st);
}
function saveBV(){ store.set('boardView',{ch:BV.ch,status:BV.status}); }
function applyBoardFilter(){
  if(BV.ch&&BV.ch!=='jam'&&!CHAPTERS.some(c=>c.id===BV.ch)) BV.ch=null;
  document.querySelectorAll('#boardNav .bnChip').forEach(b=>b.classList.toggle('on',(b.dataset.ch||null)===BV.ch));
  document.querySelectorAll('#boardNav .bnSt').forEach(b=>b.classList.toggle('on',b.dataset.st===BV.status));
  let shown=0;
  document.querySelectorAll('#gigs .chapter').forEach(sec=>{
    const chOk=!BV.ch||sec.dataset.ch===BV.ch; let any=sec.dataset.ch==='jam'&&BV.status==='all';
    sec.querySelectorAll('.gigWrap').forEach(w=>{ const ok=BV.status==='all'||(BV.status==='done')===!!w.dataset.done; w.hidden=!ok; if(ok) any=true; });
    sec.hidden=!(chOk&&any); if(!sec.hidden) shown++; });
  $('#boardEmpty').hidden=shown>0;
  $('#boardEmpty').textContent=BV.status==='done'?'Nothing finished here yet. Pick a gig and get paid!':'Nothing left to do here. Every gig is done!';
}


/* =====================================================================
   LEVEL
   ===================================================================== */
const SW=200, SH=208, GAP=14, PAD=14;
function slotCount(L){
  if(L.slots) return L.slots;
  let s=L.target.mods.length+1+2; s+=s%2; return Math.max(4,Math.min(8,s));
}
function layoutBoard(){
  const n=S.slots, cols=S.mobile?2:(n<=4?n:Math.ceil(n/2)), rows=Math.ceil(n/cols);
  const outCell=[cols-1,0], cells=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(!(c===outCell[0]&&r===outCell[1])) cells.push([c,r]);
  S.grid={cols,rows,cells,outCell,W:PAD*2+cols*SW+(cols-1)*GAP,H:PAD*2+rows*SH+(rows-1)*GAP}; S.grid.baseW=S.grid.W; S.grid.baseH=S.grid.H;
  const st=$('#stage'); st.style.width=S.grid.W+'px'; st.style.height=S.grid.H+'px';
}
function slotXY(i){ const [c,r]= i===S.slots-1 ? S.grid.outCell : S.grid.cells[i]; return [PAD+c*(SW+GAP), PAD+r*(SH+GAP)]; }
const occupant=i=>S.patch.modules.find(m=>m.slot===i);
/* Free placement: a module either sits in a box (m.slot) or floats at m.x,m.y (m.slot === null) when Snap is off.
   A floating module doesn't hold a box, but a box it mostly covers stops offering itself. */
const MW=188;
function modXY(m){ if(m.slot!=null){ const [x,y]=slotXY(m.slot); return [x+6,y+6]; } return [m.x,m.y]; }
function coveredSlot(i){ if(!S.grid||!S.patch.modules.some(m=>m.slot==null)) return false; const [x,y]=slotXY(i); return S.patch.modules.some(m=>{ if(m.slot!=null) return false;
  const ox=Math.max(0,Math.min(x+SW,m.x+MW)-Math.max(x,m.x)), oy=Math.max(0,Math.min(y+SH,m.y+SH-12)-Math.max(y,m.y)); return ox*oy>SW*SH*0.3; }); }
function emptySlots(){ const out=[]; for(let i=0;i<S.slots-1;i++) if(!occupant(i)&&!coveredSlot(i)) out.push(i); return out; }
/* Grow the board to hold floating modules (never smaller than the box grid). */
function sizeStage(){ const g=S.grid; let W=g.baseW, H=g.baseH;
  for(const m of S.patch.modules) if(m.slot==null){ W=Math.max(W,m.x+MW+PAD); H=Math.max(H,m.y+SH+PAD); }
  g.W=W; g.H=H; const st=$('#stage'); st.style.width=W+'px'; st.style.height=H+'px'; }
S.snap=store.get('snap',true);
function needs(){ if(S.sandbox) return {}; const n={}; S.L.target.mods.forEach(m=>n[m.type]=(n[m.type]||0)+1); return n; }
const isChallenge=()=>!S.sandbox&&!!S.L.challenge;
const placedCount=()=>S.patch.modules.filter(m=>m.type!=='out').length;
function needsMore(){ return isChallenge()?placedCount()<S.L.target.mods.length:missing().length>0; }
function missing(){ const n=needs(), out=[]; for(const t in n){ const h=countType(t); if(h<n[t]) out.push([t,n[t]-h]); } return out; }
function playerCost(p){ return p.modules.reduce((s,m)=>s+(m.preset?0:MT[m.type].cost),0); }
function parCost(L){ const pre=(L.start||[]).reduce((s,x)=>s+MT[x.type].cost,0); return patchCost(targetPatch(L))-pre; }

function openLevel(i){ S.moving=null; pushRoute(i);
  S.sandbox=i<0; S.li=i; S.L=S.sandbox?SANDBOX:LEVELS[i];
  S.feats=S.sandbox?new Set(ALL_FEATURES):featuresFor(i);
  S.palette=S.L.palette; S.slots=slotCount(S.L); S.mine=null; S.cmp=null; S.slotMenu=null;
  const draft=store.get('draft2.'+S.L.id,null);
  idc=1;
  if(validDraft(draft)) S.patch=draft; else freshPatch();
  idc=1+Math.max(0,...S.patch.modules.map(m=>parseInt(String(m.id).replace(/\D/g,''))||0));
  document.body.classList.add('inLevel');
  $('#screenBoard').hidden=true; $('#screenLevel').hidden=false; $('#btnHome').hidden=false;
  const ch=S.sandbox?null:chapterOf(i);
  $('#crumbs').textContent=S.sandbox?'Free Jam':`${ch.title} ${ch.levels.indexOf(i)+1}/${ch.levels.length} · ${S.L.title} · ${S.L.challenge?'Challenge':S.L.concept}`;
  S.pick=null; S.wasOk=false; showPatchbar(); allNotesOff(); stopJingle();
  S.kbLo=null; S.kbFb=null; S.promptDone=S.sandbox||!!(progress.played&&progress.played[S.L.id]);
  renderBrief(); renderPalette(); layoutBoard(); renderRack(); renderCompare(); renderPrompt(); renderMidiChip(); setKeysOpen(S.mobile?false:store.get('keysOpen',false));
  S.userZoom=false;
  requestAnimationFrame(()=>{ fitView(); drawCables(); });
  if(!draft&&MQ2.matches) openSide(); else closeSide();
  resetStuck();
  scheduleAnalyze();
}
function validDraft(d){
  if(!d||!Array.isArray(d.modules)||!Array.isArray(d.cables)) return false;
  const seen=new Set();
  for(const m of d.modules){ if(!MT[m.type]) return false;
    if(m.slot==null){ if(m.type==='out'||!Number.isFinite(m.x)||!Number.isFinite(m.y)||m.x<0||m.y<0) return false; continue; }
    if(!Number.isInteger(m.slot)||m.slot<0||m.slot>=S.slots||seen.has(m.slot)) return false; seen.add(m.slot); }
  const o=d.modules.find(m=>m.type==='out'); return !!o&&o.slot===S.slots-1;
}
function freshPatch(){
  S.patch={modules:[{id:'out',type:'out',slot:S.slots-1,locked:1,params:{}}],cables:[]};
  (S.L.start||[]).forEach(s=>S.patch.modules.push({id:s.id||('m'+(idc++)),type:s.type,slot:s.slot,locked:s.locked?1:0,preset:1,params:Object.assign(defaultParams(s.type),s.p||{})}));
  (S.L.startCables||[]).forEach(c=>S.patch.cables.push(parseCable(c)));
}
function renderBrief(){
  const L=S.L, n=needs();
  const parts=isChallenge()?`${L.target.mods.length} modules (challenge: work out which)`:Object.keys(n).map(t=>`${n[t]>1?n[t]+'× ':''}${MT[t].name}`).join(', ');
  $('#brief').innerHTML=`<h3>${S.sandbox?'Session':'The client'}</h3><div class="who">${L.client}</div><div class="role">${L.role}</div>
   <blockquote>${L.brief}</blockquote>
   ${L.presetNote?`<div class="preset">${L.presetNote}</div>`:''}
   <div class="specs">${L.seq?`<span>NOTES ${L.seq.map(q=>noteName(L.note+q[0])).join(' → ')}</span>`:`<span>NOTE ${noteName(L.note)}</span><span>HOLD ${L.gate}s</span>`}${S.sandbox?'':`<span>PASS ≥ ${PASS}%</span><span>PARTS: ${parts}</span>`}</div>`;
  $('#manual').innerHTML=`<h3>Manual · ${L.concept}</h3>`+L.manual;
}
function openSide(){ $('#side').classList.add('open'); $('#sideBackdrop').classList.add('open'); }
function closeSide(){ $('#side').classList.remove('open'); $('#sideBackdrop').classList.remove('open'); }
function countType(t){ return S.patch.modules.filter(m=>m.type===t).length; }
function renderPalette(){
  const p=$('#palette'); p.innerHTML='';
  const miss=new Set(isChallenge()?[]:missing().map(x=>x[0])), free=emptySlots().length;
  Object.entries(S.palette).forEach(([t,max])=>{
    const left=max-countType(t);
    let b=el('button',{class:'palBtn'+(miss.has(t)?' need':''),title:`${MT[t].long}${miss.has(t)?' · this sound needs one':''}`},
      `<span class="sw" style="background:${MT[t].color}"></span><b>${MT[t].name}</b><small>${MT[t].cost}¢·${left}</small>`);
    b.disabled=left<=0||free===0; p.appendChild(b); b=Haptics.upgrade(b); b.addEventListener('click',()=>Haptics.later(()=>addModule(t)));
  });
}
function renderParts(){
  const b=$('#partsBar'); if(S.sandbox){ b.innerHTML=''; return; }
  const n=needs();
  b.classList.toggle('allok',!needsMore());
  if(isChallenge()){ const have=placedCount(), need=S.L.target.mods.length;
    b.innerHTML=`<span class="lbl">CHALLENGE</span><span class="part ${have>=need?'ok':'miss'}">${have}/${need} modules</span>`; return; }
  b.innerHTML='<span class="lbl">PARTS</span>'+Object.keys(n).map(t=>{ const h=countType(t), ok=h>=n[t];
    return `<span class="part ${ok?'ok':'miss'}">${MT[t].name} ${ok?'✓':h+'/'+n[t]}</span>`; }).join('');
}
function addModule(t,slot){
  if(countType(t)>=S.palette[t]){ toast(`No ${MT[t].name} modules left for this gig.`); return; }
  let place;
  if(slot!=null) place={slot};
  else { const e=emptySlots(); if(e.length) place={slot:e[0]};
    else if(S.patch.modules.some(m=>m.slot==null)){ // boxes are covered by floating modules: float the new one below everything
      const bottom=Math.max(S.grid.baseH,...S.patch.modules.map(m=>modXY(m)[1]+SH)); place={slot:null,x:PAD,y:bottom+GAP}; }
    else { toast('The rack is full. Remove a module first.'); return; } }
  const id='m'+(idc++);
  S.moving=null; S.patch.modules.push(Object.assign({id,type:t,params:defaultParams(t)},place));
  S.slotMenu=null; Haptics.thunk(); refreshRack(); scheduleAnalyze(); if(place.slot!=null) revealSlot(place.slot);
}
function removeModule(id){
  const m=S.patch.modules.find(x=>x.id===id); if(!m||m.locked) return; S.moving=null;
  if(S.pick&&S.pick.mid===id) clearPick();
  S.patch.modules=S.patch.modules.filter(x=>x.id!==id);
  S.patch.cables=S.patch.cables.filter(c=>c.from.m!==id&&c.to.m!==id);
  Haptics.thunk();
  refreshRack(); scheduleAnalyze();
}
function refreshRack(){ renderPalette(); renderRack(); if(S.cmp) updateCompare(); }

/* ---------- rack render ---------- */
function renderRack(){
  const slotsEl=$('#slots'), box=$('#mods'); slotsEl.innerHTML=''; box.innerHTML='';
  const wanted=needsMore();
  sizeStage();
  for(let i=0;i<S.slots-1;i++){
    const [x,y]=slotXY(i), occ=occupant(i);
    if(!occ&&coveredSlot(i)){ const c=el('div',{class:'slot covered','data-slot':i}); c.style.left=x+'px'; c.style.top=y+'px'; slotsEl.appendChild(c); continue; }
    const s=el(!occ&&S.slotMenu!==i?'label':'div',{class:'slot'+(occ?' filled':' empty'+(wanted?' wanted':'')),'data-slot':i}); s.style.left=x+'px'; s.style.top=y+'px';
    if(!occ&&S.moving){
      s.classList.add('moveTarget'); s.innerHTML='<div class="plus">↘</div><div>MOVE HERE</div>'; Haptics.addSwitch(s);
      s.addEventListener('click',()=>Haptics.later(()=>moveModuleTo(i)));
    } else if(!occ){
      if(S.slotMenu===i){
        const avail=Object.entries(S.palette).filter(([t,max])=>max-countType(t)>0);
        s.innerHTML=`<div class="slotMenu"><div class="t">ADD TO THIS SLOT</div>${avail.map(([t])=>`<button data-t="${t}"><i style="background:${MT[t].color}"></i>${MT[t].name}</button>`).join('')}<button class="x">Cancel</button></div>`;
        s.querySelectorAll('button').forEach(b0=>{ const b=Haptics.upgrade(b0); b.addEventListener('pointerdown',e=>e.stopPropagation());
          b.addEventListener('click',e=>{ e.stopPropagation(); Haptics.later(()=>{ if(b.dataset.t) addModule(b.dataset.t,i); else { S.slotMenu=null; renderRack(); } }); }); });
      } else {
        s.innerHTML=`<div class="plus">+</div><div>${wanted?'NEEDS A MODULE':'ADD MODULE'}</div>`;
        Haptics.addSwitch(s);
        s.addEventListener('click',()=>Haptics.later(()=>{ if(emptySlots().length&&Object.entries(S.palette).some(([t,max])=>max-countType(t)>0)){ S.slotMenu=i; renderRack(); } else toast('No more modules available for this gig.'); }));
      }
    }
    slotsEl.appendChild(s);
  }
  for(const m of S.patch.modules){
    const T=MT[m.type], [x,y]=modXY(m);
    const d=el('div',{class:'module'+(m.locked?' locked':'')+(m.slot==null?' floating':''),'data-id':m.id}); d.style.left=x+'px'; d.style.top=y+'px';
    const head=el('div',{class:'mhead',title:m.locked?'':'Drag to move, or tap to pick up and tap where it should go'},`${m.locked?'':'<span class="grip" aria-hidden="true">⠿</span>'}<span class="stripe" style="background:${T.color}"></span><span class="name">${T.name}</span>${m.preset&&m.type!=='out'?'<span class="lock">PRESET</span>':''}<span class="cost">${T.cost&&!m.preset?T.cost+'¢':''}</span>`);
    if(!m.locked){ const xb=el('button',{class:'del',title:'Remove module'},'×'); xb.addEventListener('pointerdown',e=>e.stopPropagation()); xb.addEventListener('click',()=>removeModule(m.id)); head.appendChild(xb); }
    d.appendChild(head);
    const body=el('div',{class:'mbody'}), ins=el('div',{class:'ins'}), prm=el('div',{class:'params'}), outs=el('div',{class:'outs'});
    T.ins.filter(p=>!p.req||S.feats.has(p.req)).forEach(p=>ins.appendChild(makePort(m,p,'in')));
    T.outs.forEach(p=>outs.appendChild(makePort(m,p,'out')));
    const vis=T.params.filter(p=>!p.req||S.feats.has(p.req)), knobs=vis.filter(p=>!p.type).length;
    if(knobs>4) d.classList.add('dense'); if(m.type==='seq') d.classList.add('seqmod'); else if(vis.some(p=>p.type==='bar')) d.classList.add('bars');
    vis.forEach(p=>prm.appendChild(p.type==='choice'?makeChoice(m,p):makeKnob(m,p)));
    if(m.type==='out') prm.innerHTML='<div class="outBox"><div class="spk"></div>to speakers</div>';
    if(m.type==='noise') prm.innerHTML='<div class="outBox" style="font-family:var(--mono)">∿∿ white ∿∿</div>';
    body.append(ins,prm,outs); d.appendChild(body); box.appendChild(d);
    d.addEventListener('pointerdown',e=>e.stopPropagation());
    if(S.moving===m.id) d.classList.add('moving');
    else if(S.moving&&!m.locked&&m.type!=='out'){ d.classList.add('moveTarget'); d.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); swapWith(m); },true); }
    if(!m.locked) dragModule(head,m,d);
  }
  renderParts();
  if(S.pick) markPicked();
  requestAnimationFrame(()=>drawCables());
}
function makePort(m,p,dir){
  const e=el('label',{class:`port ${p.kind} ${dir}`,'data-mod':m.id,'data-port':p.id,'data-dir':dir,'data-kind':p.kind,
    title:`${MT[m.type].name} ${p.label} (${p.kind==='audio'?'audio':'control'} ${dir==='in'?'input':'output'}). Drag or tap to patch.`},
    `<span class="jack"></span><span class="plabel">${p.label}</span>`);
  Haptics.addSwitch(e);
  e.addEventListener('pointerdown',ev=>startCable(ev,e));
  return e;
}
function stagePoint(ev){ const r=$('#stage').getBoundingClientRect(); return [(ev.clientX-r.left)/S.view.s,(ev.clientY-r.top)/S.view.s]; }
/* Where a dragged module lands: the slot nearest the module's own centre (not the pointer, which sits on the
   name bar at the very top, so lining the module up with a slot used to leave the pointer in the gap above it). */
function dropSlot(m,dx,dy){
  const [x0,y0]=modXY(m), cx=x0-6+SW/2+dx, cy=y0-6+SH/2+dy; let best=null, bd=Infinity;
  for(let i=0;i<S.slots;i++){ const [x,y]=slotXY(i), d=Math.hypot(x+SW/2-cx,(y+SH/2-cy)*SW/SH); if(d<bd){ bd=d; best=i; } }
  return bd<SW*0.75?best:null;
}
function slotAt(p){ for(let i=0;i<S.slots;i++){ const [x,y]=slotXY(i); if(p[0]>=x&&p[0]<=x+SW&&p[1]>=y&&p[1]<=y+SH) return i; } return null; }
/* Tap-to-move: tap a module's name bar to pick it up, then tap a free slot (move) or another module (swap). */
function toggleMove(m){
  S.moving=S.moving===m.id?null:m.id; S.slotMenu=null; renderRack();
  if(S.moving) toast(S.snap?`Tap a free slot to move ${MT[m.type].name} there, or another module to swap. Tap its name again to cancel.`:`Tap anywhere on the board to put ${MT[m.type].name} there, a box to snap it in, or another module to swap.`);
}
function placeIn(m,t){ m.slot=t; delete m.x; delete m.y; }
function swapPlaces(a,b){ const pa={slot:a.slot,x:a.x,y:a.y}; Object.assign(a,{slot:b.slot,x:b.x,y:b.y}); Object.assign(b,pa);
  [a,b].forEach(m=>{ if(m.slot!=null){ delete m.x; delete m.y; } }); }
function moveModuleTo(t){
  const m=S.patch&&S.patch.modules.find(x=>x.id===S.moving); S.moving=null;
  if(m&&t!=null&&t!==m.slot&&t!==S.slots-1){ const o=occupant(t);
    if(!o){ placeIn(m,t); Haptics.thunk(); } else if(!o.locked){ swapPlaces(m,o); Haptics.thunk(); } else toast('That slot holds a preset module.'); }
  renderRack(); saveDraft();
}
function swapWith(o){ const m=S.patch&&S.patch.modules.find(x=>x.id===S.moving); S.moving=null; if(m&&o&&m!==o&&!o.locked){ swapPlaces(m,o); Haptics.thunk(); } renderRack(); saveDraft(); }
/* Snap off: put a module down at a stage point (its name bar under the point), clear of OUTPUT. */
function floatAt(m,x,y){
  const [ox,oy]=slotXY(S.slots-1); x=Math.max(0,Math.round(x)); y=Math.max(0,Math.round(y));
  const cx=x+MW/2, cy=y+SH/2; if(cx>ox&&cx<ox+SW&&cy>oy&&cy<oy+SH){ toast('OUTPUT always stays in the top-right slot.'); return false; }
  m.slot=null; m.x=x; m.y=y; return true;
}
function setSnap(on){ S.snap=on; store.set('snap',on); const b=$('#zSnap'); b.classList.toggle('on',on); b.setAttribute('aria-pressed',on);
  b.title=on?'Snap is on: modules drop into the nearest box. Hold Alt or Shift while dragging to place freely.':'Snap is off: modules stay where you drop them. Hold Alt or Shift while dragging to snap to a box.'; }
function dragModule(head,m,d){
  head.addEventListener('pointerdown',e=>{
    if(e.target.closest('.del')) return;
    e.preventDefault(); e.stopPropagation(); try{head.setPointerCapture(e.pointerId);}catch(_){}
    const x0=e.clientX, y0=e.clientY; let moved=false, over=null;
    const snapNow=ev=>S.snap!==!!(ev.altKey||ev.shiftKey);
    const mv=ev=>{ if(S.pinching) return; const dx=(ev.clientX-x0)/S.view.s, dy=(ev.clientY-y0)/S.view.s;
      if(!moved&&Math.hypot(dx,dy)<5) return; moved=true; d.classList.add('dragging'); d.style.transform=`translate(${dx}px,${dy}px)`;
      const t=snapNow(ev)?dropSlot(m,dx,dy):null; if(t!==over){ document.querySelectorAll('.slot.drop').forEach(s=>s.classList.remove('drop')); over=t; const se=t!=null&&document.querySelector(`.slot[data-slot="${t}"]`); if(se&&t!==m.slot) se.classList.add('drop'); }
      drawCables(); };
    const up=ev=>{ head.removeEventListener('pointermove',mv); head.removeEventListener('pointerup',up); head.removeEventListener('pointercancel',up);
      d.style.transform=''; d.classList.remove('dragging'); document.querySelectorAll('.slot.drop').forEach(s=>s.classList.remove('drop'));
      if(!moved){ if(S.moving&&S.moving!==m.id) moveModuleTo(m.slot); else toggleMove(m); return; }
      const dx=(ev.clientX-x0)/S.view.s, dy=(ev.clientY-y0)/S.view.s;
      if(!snapNow(ev)){ const [mx,my]=modXY(m); if(floatAt(m,mx+dx,my+dy)) Haptics.thunk(); }
      else { const t=dropSlot(m,dx,dy);
        if(t===S.slots-1) toast('OUTPUT always stays in the top-right slot.');
        else if(t!=null&&t!==m.slot){ const o=occupant(t);
          if(!o){ placeIn(m,t); Haptics.thunk(); } else if(!o.locked){ swapPlaces(m,o); Haptics.thunk(); } else toast('That slot holds a preset module, so it can\'t move.'); }
        else if(t===m.slot&&m.slot!=null){ /* dropped back home */ } }
      renderRack(); saveDraft(); };
    head.addEventListener('pointermove',mv); head.addEventListener('pointerup',up); head.addEventListener('pointercancel',up);
  });
}

/* ---------- zoom & pan ---------- */
function applyView(){ const v=S.view; $('#stage').style.transform=`translate(${v.x}px,${v.y}px) scale(${v.s})`; $('#zoomPct').textContent=Math.round(v.s*100)+'%'; }
function clampView(){ const vp=$('#viewport'), W=vp.clientWidth, H=vp.clientHeight, g=S.grid, v=S.view, m=70;
  v.x=Math.min(W-m,Math.max(m-g.W*v.s,v.x)); v.y=Math.min(H-m,Math.max(m-g.H*v.s,v.y)); }
function fitView(){
  const vp=$('#viewport'), W=vp.clientWidth, H=vp.clientHeight, g=S.grid; if(!W||!H||!g) return;
  const top=34, bot=46;
  let s=S.mobile?Math.min((W-8)/g.W,1.1):Math.min((W-24)/g.W,(H-top-bot)/g.H,1.15);
  s=Math.max(0.3,s);
  const x=(W-g.W*s)/2, y=S.mobile?top-6:Math.max(top,top+(H-top-bot-g.H*s)/2);
  S.view={s,x,y}; S.userZoom=false; applyView();
}
function zoomAt(f,cx,cy){ const v=S.view, s=Math.min(2.5,Math.max(0.3,v.s*f)); v.x=cx-(cx-v.x)*(s/v.s); v.y=cy-(cy-v.y)*(s/v.s); v.s=s; S.userZoom=true; clampView(); applyView(); }
function zoomCenter(f){ const vp=$('#viewport'); zoomAt(f,vp.clientWidth/2,vp.clientHeight/2); }
function revealSlot(i){
  const vp=$('#viewport'), [x,y]=slotXY(i), v=S.view, W=vp.clientWidth, H=vp.clientHeight;
  const L=v.x+x*v.s, T=v.y+y*v.s, R=L+SW*v.s, B=T+SH*v.s;
  if(L>=0&&T>=30&&R<=W&&B<=H) return;
  v.x+= L<0? -L+10 : R>W ? W-R-10 : 0; v.y+= T<30? 34-T : B>H ? H-B-46 : 0; clampView(); applyView();
}
(function wireViewport(){
  const vp=$('#viewport'); let pan=null, pinch=null;
  vp.addEventListener('pointerdown',e=>{
    if(e.target.closest('.module,.slot.empty,.zoomCtl')||S.pinching) return;
    if(e.pointerType==='mouse'&&e.button!==0) return;
    pan={x0:e.clientX,y0:e.clientY,vx:S.view.x,vy:S.view.y,moved:false,id:e.pointerId}; try{vp.setPointerCapture(e.pointerId);}catch(_){}
  });
  vp.addEventListener('pointermove',e=>{ if(!pan||e.pointerId!==pan.id||S.pinching) return;
    const dx=e.clientX-pan.x0, dy=e.clientY-pan.y0; if(!pan.moved&&Math.hypot(dx,dy)<5) return;
    pan.moved=true; vp.classList.add('panning'); S.view.x=pan.vx+dx; S.view.y=pan.vy+dy; S.userZoom=true; clampView(); applyView(); });
  const end=e=>{ if(!pan||e.pointerId!==pan.id) return; vp.classList.remove('panning');
    if(!pan.moved&&!e.target.closest('#cables g')){ if(S.moving&&!S.snap){ const m=S.patch.modules.find(x=>x.id===S.moving), [px,py]=stagePoint(e); S.moving=null; if(m&&floatAt(m,px-MW/2,py-14)) Haptics.thunk(); renderRack(); saveDraft(); pan=null; return; }
      if(S.pick) clearPick(); if(S.slotMenu!=null){ S.slotMenu=null; renderRack(); } }
    pan=null; };
  vp.addEventListener('pointerup',end); vp.addEventListener('pointercancel',end);
  vp.addEventListener('wheel',e=>{ e.preventDefault(); const r=vp.getBoundingClientRect();
    if(e.ctrlKey||e.metaKey) zoomAt(Math.exp(-e.deltaY*0.01),e.clientX-r.left,e.clientY-r.top);
    else { S.view.x-=e.deltaX; S.view.y-=e.deltaY; S.userZoom=true; clampView(); applyView(); } },{passive:false});
  const tp=t=>{ const r=vp.getBoundingClientRect(); return [t.clientX-r.left,t.clientY-r.top]; };
  vp.addEventListener('touchstart',e=>{ if(e.touches.length===2){ e.preventDefault(); const a=tp(e.touches[0]), b=tp(e.touches[1]);
    pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,s:S.view.s,x:S.view.x,y:S.view.y}; S.pinching=true; pan=null; } },{passive:false});
  vp.addEventListener('touchmove',e=>{ if(!pinch||e.touches.length!==2) return; e.preventDefault();
    const a=tp(e.touches[0]), b=tp(e.touches[1]), d=Math.hypot(a[0]-b[0],a[1]-b[1]), mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
    const s=Math.min(2.5,Math.max(0.3,pinch.s*d/pinch.d)); S.view.s=s; S.view.x=mx-(pinch.cx-pinch.x)*(s/pinch.s); S.view.y=my-(pinch.cy-pinch.y)*(s/pinch.s);
    S.userZoom=true; clampView(); applyView(); },{passive:false});
  const tEnd=e=>{ if(pinch&&e.touches.length<2){ pinch=null; setTimeout(()=>{ S.pinching=false; },80); } };
  vp.addEventListener('touchend',tEnd); vp.addEventListener('touchcancel',tEnd);
  document.addEventListener('gesturestart',e=>e.preventDefault());
  $('#zSnap').onclick=()=>setSnap(!S.snap); setSnap(S.snap);
  $('#zIn').onclick=()=>zoomCenter(1.2); $('#zOut').onclick=()=>zoomCenter(1/1.2); $('#zFit').onclick=()=>fitView();
})();
function setFocus(on){
  S.focus=on; document.body.classList.toggle('focus',on);
  const b=$('#focusBtn'); b.innerHTML=on?'<span class="ico">✕</span><span class="lbl"> Exit focus</span>':'<span class="ico">⛶</span><span class="lbl"> Focus</span>'; b.classList.toggle('on',on); Haptics.addSwitch(b);
  const de=document.documentElement;
  try{ if(on&&de.requestFullscreen&&!document.fullscreenElement){ const p=de.requestFullscreen(); if(p&&p.catch) p.catch(()=>{}); }
       if(!on&&document.fullscreenElement){ const p=document.exitFullscreen(); if(p&&p.catch) p.catch(()=>{}); } }catch(_){}
  closeSide();
  setTimeout(()=>{ if(!S.userZoom) fitView(); else { clampView(); applyView(); } drawCables(); drawPlots(); renderKeys(); },60);
}
document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&S.focus) setFocus(false); });
function setKeysOpen(on){
  S.keysOpen=on; if(!S.mobile) store.set('keysOpen',on);   // phones never reopen the keyboard on their own
  $('#keysDock').hidden=!on; $('#keysBtn').classList.toggle('on',on);
  requestAnimationFrame(()=>{ if(on) renderKeys(); if(!S.userZoom) fitView(); else { clampView(); applyView(); } });
}
/* ---------- knobs ---------- */
const toN=(d,v)=>d.scale==='log'?Math.log(v/d.min)/Math.log(d.max/d.min):(v-d.min)/(d.max-d.min);
function fromN(d,n){ n=Math.min(1,Math.max(0,n)); let v=d.scale==='log'?d.min*Math.pow(d.max/d.min,n):d.min+n*(d.max-d.min);
  if(d.step) v=Math.round(v/d.step)*d.step; else if(d.scale==='log') v=+v.toPrecision(3); return +v.toFixed(6); }
function arc(cx,cy,r,a0,a1){ const p=a=>[cx+r*Math.cos(a),cy+r*Math.sin(a)]; const [x0,y0]=p(a0),[x1,y1]=p(a1); return `M${x0} ${y0} A${r} ${r} 0 ${a1-a0>Math.PI?1:0} 1 ${x1} ${y1}`; }
function knobSVG(n,color,bipolar){
  const A0=Math.PI*0.75, A1=Math.PI*2.25, a=A0+(A1-A0)*n, mid=(A0+A1)/2;
  // Bipolar knobs (amounts that can go negative) fill from the centre: left = negative, right = positive.
  const fill=bipolar?(Math.abs(n-0.5)>0.002?`<path d="${arc(20,19,15,Math.min(mid,a),Math.max(mid,a)+0.001)}" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:'')
    :(n>0.002?`<path d="${arc(20,19,15,A0,Math.max(A0+0.01,a))}" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:'');
  return `<svg width="40" height="36" viewBox="0 0 40 36"><path d="${arc(20,19,15,A0,A1)}" stroke="#3a322b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${fill}${bipolar?`<line x1="20" y1="2" x2="20" y2="5" stroke="#6d6356" stroke-width="1.5"/>`:''}
  <circle cx="20" cy="19" r="10" fill="#16120f" stroke="#4d433a"/><line x1="20" y1="19" x2="${20+9*Math.cos(a)}" y2="${19+9*Math.sin(a)}" stroke="#efe6d8" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function makeKnob(m,d){
  const color=MT[m.type].color.replace('var(','').replace(')','');
  const col=getComputedStyle(document.documentElement).getPropertyValue(color).trim()||'#f2a541';
  const locked=!!(m.locks&&m.locks[d.id]);
  const k=el('label',{class:'knob'+(d.type==='bar'?' bar':'')+(locked?' locked':''),'data-param':d.id,title:locked?`${d.label} is locked by Help. Tap to see why, or to unlock it.`:`${d.label} · drag up/down (Shift = fine) · click for precise control`});
  const kc=el('span',{class:'kc'}); k.appendChild(kc); Haptics.addSwitch(k);
  const barSVG=(n,bip)=>{ const top=bip?2+54*(1-Math.max(n,.5)):2+54*(1-n), h=bip?54*Math.abs(n-.5):54*n; return `<svg width="16" height="58" viewBox="0 0 16 58"><rect x="4" y="1" width="8" height="56" rx="3" fill="#0f0c0a" stroke="#4d433a"/>${bip?'<rect x="3" y="28.5" width="10" height="1" fill="#6b5f54"/>':''}<rect x="5" y="${top}" width="6" height="${h}" rx="2" fill="${col}"/><rect x="1" y="${Math.min(52,Math.max(0,54*(1-n)))}" width="14" height="5" rx="1.5" fill="#efe6d8"/></svg>`; };
  const draw=()=>{ const n=toN(d,m.params[d.id]); kc.innerHTML=(d.type==='bar'?barSVG(n,d.bipolar):knobSVG(n,col,d.bipolar))+`<span class="kl">${d.label}</span><span class="kv">${d.fmt(m.params[d.id])}</span>`; };
  draw();
  const steps=d.step?(d.max-d.min)/d.step:0, notch=n=>steps&&steps<=60?Math.round(n*steps):Math.floor(n*20+1e-9);
  const set=v=>{ const old=m.params[d.id]; if(v===old) return; m.params[d.id]=v; draw(); scheduleAnalyze();
    const n0=toN(d,old), n1=toN(d,v); if((n1<=0||n1>=1)&&n0>0&&n0<1) Haptics.edge(); else if(notch(n0)!==notch(n1)) Haptics.detent(); };
  k._set=set;
  if(locked){ k.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); }); k.addEventListener('click',()=>showLockInfo(m,d)); return k; }
  k.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); try{k.setPointerCapture(e.pointerId);}catch(_){}
    const touch=e.pointerType!=='mouse'; let y0=e.clientY, n0=toN(d,m.params[d.id]), moved=false;
    const mv=ev=>{ if(S.pinching) return; if(!moved&&Math.abs(y0-ev.clientY)<(touch?6:2)) return; if(!moved){ moved=true; y0=ev.clientY; }
      const sens=ev.shiftKey?(touch?0.0008:0.0007):(touch?0.0022:0.0035); set(fromN(d,n0+(y0-ev.clientY)*sens)); };
    const up=ev=>{ k.removeEventListener('pointermove',mv); k.removeEventListener('pointerup',up); k.removeEventListener('pointercancel',up);
      if(moved&&ev.type==='pointerup'&&touch) Haptics.release();
      if(!moved&&ev.type==='pointerup') openSheet(m,d,k); };
    k.addEventListener('pointermove',mv); k.addEventListener('pointerup',up); k.addEventListener('pointercancel',up); });
  // Wheel / trackpad: follow the real scroll distance. Coarse stepped knobs (OCT, SEMI…) move one step per ~40px of scroll.
  let wn=null, acc=0;
  k.addEventListener('wheel',e=>{ e.preventDefault(); e.stopPropagation();
    const px=(e.deltaMode===1?16:e.deltaMode===2?400:1)*(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:-e.deltaX);
    const steps=d.step?(d.max-d.min)/d.step:0;
    if(steps&&steps<=60){ acc+=px; while(Math.abs(acc)>=40){ const dir=acc>0?-1:1; acc-=Math.sign(acc)*40; set(fromN(d,toN(d,m.params[d.id])+dir/steps)); } return; }
    const cur=toN(d,m.params[d.id]); if(wn==null||Math.abs(wn-cur)>0.02) wn=cur;
    wn=Math.min(1,Math.max(0,wn-px*(e.shiftKey?0.00015:0.0006))); set(fromN(d,wn)); },{passive:false});
  return k;
}
function makeChoice(m,d){
  const locked=!!(m.locks&&m.locks[d.id]);
  const w=el('div',{class:'choice'+(locked?' locked':''),'data-param':d.id}); w.style.setProperty('--sel',MT[m.type].color);
  const draw=()=>{ w.innerHTML=''; d.options.forEach((o,i)=>{
    let b=el('button',{class:m.params[d.id]===o?'on':'',title:o},
      WAVE_PATH[o]?`<svg width="28" height="18" viewBox="0 0 28 18"><path d="${WAVE_PATH[o]}" stroke="#a09482" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>`:(d.labels?d.labels[i]:o));
    b=Haptics.upgrade(b);
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',()=>Haptics.later(()=>{ if(locked){ showLockInfo(m,d); return; } if(m.params[d.id]!==o) Haptics.select(); m.params[d.id]=o; draw(); scheduleAnalyze(); }));
    w.appendChild(b); }); };
  draw(); return w;
}

function reaches(fromM,toM){ // does a signal path already go from fromM to toM?
  const seen=new Set([fromM]), q=[fromM];
  while(q.length){ const x=q.shift(); if(x===toM) return true; S.patch.cables.filter(c=>c.from.m===x).forEach(c=>{ if(!seen.has(c.to.m)){ seen.add(c.to.m); q.push(c.to.m);} }); }
  return false;
}
function tryConnect(aEl,bEl){
  const dir=aEl.dataset.dir, kind=aEl.dataset.kind;
  if(bEl.dataset.dir===dir){ toast('Connect an output to an input.'); return false; }
  if(bEl.dataset.kind!==kind){ toast(kind==='audio'?'Audio (yellow) jacks only connect to audio jacks.':'Control (blue) jacks only connect to control jacks.'); return false; }
  const o=dir==='out'?aEl:bEl, n=dir==='out'?bEl:aEl;
  const from={m:o.dataset.mod,p:o.dataset.port}, to={m:n.dataset.mod,p:n.dataset.port};
  if(from.m===to.m){ toast('A module can\'t patch into itself.'); return false; }
  if(S.patch.cables.some(c=>c.from.m===from.m&&c.from.p===from.p&&c.to.m===to.m&&c.to.p===to.p)){ toast('Already patched.'); return false; }
  if(reaches(to.m,from.m)){ toast('That would make a feedback loop.'); return false; }
  S.patch.cables.push({from,to}); Haptics.plug(); scheduleAnalyze(); return true;
}
/* tap a jack, then tap where it goes */
const portSel=k=>document.querySelector(`.port[data-mod="${k.mid}"][data-port="${k.pid}"][data-dir="${k.dir}"]`);
function tapPort(p){
  const k={mid:p.dataset.mod,pid:p.dataset.port,dir:p.dataset.dir,kind:p.dataset.kind};
  if(S.pick){
    if(S.pick.mid===k.mid&&S.pick.pid===k.pid&&S.pick.dir===k.dir){ clearPick(); return; }
    if(k.dir!==S.pick.dir){ const a=portSel(S.pick); if(a&&tryConnect(a,p)){ clearPick(); drawCables(); return; } return; }
  }
  S.pick=k; Haptics.select(); markPicked(); showPatchbar();
}
function markPicked(){
  document.querySelectorAll('.port.picked,.port.hot').forEach(p=>p.classList.remove('picked','hot'));
  if(!S.pick) return; const a=portSel(S.pick); if(!a){ S.pick=null; showPatchbar(); return; }
  a.classList.add('picked');
  document.querySelectorAll(`.port.${S.pick.dir==='out'?'in':'out'}.${S.pick.kind}`).forEach(p=>{ if(p.dataset.mod!==S.pick.mid) p.classList.add('hot'); });
}
function clearPick(){ S.pick=null; markPicked(); showPatchbar(); }
function pickConns(){ const k=S.pick; return S.patch.cables.filter(c=>k.dir==='out'?(c.from.m===k.mid&&c.from.p===k.pid):(c.to.m===k.mid&&c.to.p===k.pid)); }
function showPatchbar(){
  let b=document.getElementById('patchbar');
  if(!S.pick){ if(b) b.remove(); return; }
  if(!b){ b=el('div',{id:'patchbar'}); document.body.appendChild(b); }
  const m=S.patch.modules.find(x=>x.id===S.pick.mid), T=MT[m.type], port=[...T.ins,...T.outs].find(q=>q.id===S.pick.pid), n=pickConns().length;
  const col=S.pick.kind==='audio'?'yellow':'blue';
  b.innerHTML=`<span class="msg"><b>${T.name} ${port.label}</b><br><span style="color:var(--dim)">Tap a ${col} ${S.pick.dir==='out'?'input':'output'} to patch</span></span>${n?`<button class="btn" id="pbUn">Unplug${n>1?' '+n:''}</button>`:''}<button class="btn ghost" id="pbX">Done</button>`;
  ['#pbX','#pbUn'].forEach(sel=>Haptics.upgrade(b.querySelector(sel)));
  $('#pbX').onclick=()=>Haptics.later(clearPick);
  if(n) $('#pbUn').onclick=()=>Haptics.later(()=>{ Haptics.unplug(); const kill=new Set(pickConns()); S.patch.cables=S.patch.cables.filter(c=>!kill.has(c)); clearPick(); drawCables(); scheduleAnalyze(); });
}

/* ---------- value sheet (tap a knob) ---------- */
function openSheet(m,d,knobEl){
  const sh=$('#sheet'); sh.hidden=false; sh.style.setProperty('--sel',MT[m.type].color);
  const steps=d.step?Math.round((d.max-d.min)/d.step):0;
  const fineSteps=steps&&steps<=60;
  const small=fineSteps?1/steps:steps?Math.max(1/steps,0.0025):0.0025, big=fineSteps?Math.max(1,Math.round(steps/12))/steps:0.03;
  sh.innerHTML=`<div class="sheetCard"><div class="shHead"><span class="shTitle">${MT[m.type].name} · ${d.label}</span><button class="btn primary" id="shDone">Done</button></div>
    <div class="shVal" id="shVal"></div><input class="shRange" id="shR" type="range" min="0" max="1000" step="1" aria-label="${d.label}">
    <div class="shBtns"><button data-d="${-big}">−−</button><button data-d="${-small}">−</button><button data-d="${small}">+</button><button data-d="${big}">++</button></div>
    <div class="shRow"><button id="shReset">Reset</button><button id="shPlay">▶ Yours</button></div>
    <div class="shKeys">← → nudge · Shift+← → bigger steps · Space plays yours · Esc closes</div></div>`;
  const R=$('#shR');
  const sync=()=>{ $('#shVal').textContent=d.fmt(m.params[d.id]); R.value=Math.round(toN(d,m.params[d.id])*1000); };
  const set=v=>{ knobEl._set(v); sync(); };
  sync();
  R.addEventListener('input',()=>set(fromN(d,R.value/1000)));
  sh.querySelectorAll('.shBtns button').forEach(b=>{ const t=Haptics.tapTarget(b.innerHTML,'shBtn',()=>nudge(parseFloat(b.dataset.d))); b.replaceWith(t); });
  $('#shReset').onclick=()=>set(d.def);
  $('#shPlay').onclick=()=>playFixed(S.patch,S.L,'mY');
  const nudge=delta=>{ let v=m.params[d.id], nv=fromN(d,toN(d,v)+delta); if(nv===v&&!fineSteps) nv=fromN(d,toN(d,v)+2*delta); set(nv); };
  const onKey=e=>{ if(sh.hidden) return;
    if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); nudge(e.shiftKey?big:small); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); nudge(-(e.shiftKey?big:small)); }
    else if(e.key===' '){ e.preventDefault(); playFixed(S.patch,S.L,'pY'); }
    else if(e.key==='Enter'){ e.preventDefault(); close(); } };
  window.addEventListener('keydown',onKey);
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; window.removeEventListener('keydown',onKey); };
  $('#shDone').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); };
}


/* ---------- cables ---------- */
function jackXY(mid,pid,dir){
  const j=document.querySelector(`.port[data-mod="${mid}"][data-port="${pid}"][data-dir="${dir}"] .jack`); if(!j) return null;
  const r=j.getBoundingClientRect(), R=$('#stage').getBoundingClientRect(), s=S.view.s;
  return [(r.left+r.width/2-R.left)/s,(r.top+r.height/2-R.top)/s];
}
function cablePath(a,b){
  const dx=Math.max(40,Math.abs(b[0]-a[0])*0.45), dist=Math.hypot(b[0]-a[0],b[1]-a[1]), sag=20+dist*0.16;
  return `M${a[0]} ${a[1]} C${a[0]+dx} ${a[1]+sag}, ${b[0]-dx} ${b[1]+sag}, ${b[0]} ${b[1]}`;
}
function drawCables(temp){
  const svg=$('#cables'); if(!svg||!S.patch) return; let h='';
  S.patch.cables.forEach((c,i)=>{
    const a=jackXY(c.from.m,c.from.p,'out'), b=jackXY(c.to.m,c.to.p,'in'); if(!a||!b) return;
    const fm=S.patch.modules.find(m=>m.id===c.from.m); const kind=MT[fm.type].outs.find(o=>o.id===c.from.p).kind;
    const col=kind==='audio'?'var(--audio)':'var(--mod)', d=cablePath(a,b);
    h+=`<g data-i="${i}"><path d="${d}" stroke="rgba(0,0,0,.45)" stroke-width="7" fill="none" transform="translate(0 3)"/>
      <path class="main" d="${d}" stroke="${col}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".92"/>
      <circle cx="${a[0]}" cy="${a[1]}" r="5" fill="${col}"/><circle cx="${b[0]}" cy="${b[1]}" r="5" fill="${col}"/>
      <path class="hit" d="${d}" stroke="transparent" stroke-width="16" fill="none"><title>Click to unplug</title></path></g>`;
  });
  if(temp) h+=`<path d="${cablePath(temp.a,temp.b)}" stroke="${temp.kind==='audio'?'var(--audio)':'var(--mod)'}" stroke-width="4" fill="none" stroke-dasharray="6 5" opacity=".9"/>`;
  svg.innerHTML=h;
  svg.querySelectorAll('g').forEach(g=>{ const hit=g.querySelector('.hit');
    hit.addEventListener('pointerdown',e=>e.stopPropagation());
    hit.addEventListener('click',()=>{ Haptics.unplug(); S.patch.cables.splice(+g.dataset.i,1); drawCables(); scheduleAnalyze(); showPatchbar(); }); });
}
function startCable(ev,portEl){
  ev.preventDefault(); ev.stopPropagation();
  const dir=portEl.dataset.dir, kind=portEl.dataset.kind, mid=portEl.dataset.mod, pid=portEl.dataset.port;
  const anchor=jackXY(mid,pid,dir), x0=ev.clientX, y0=ev.clientY; let dragging=false;
  const mv=e=>{ if(S.pinching) return;
    if(!dragging){ if(Math.hypot(e.clientX-x0,e.clientY-y0)<8) return; dragging=true;
      document.querySelectorAll(`.port.${dir==='out'?'in':'out'}.${kind}`).forEach(p=>{ if(p.dataset.mod!==mid) p.classList.add('hot'); }); }
    const pt=stagePoint(e); drawCables(dir==='out'?{a:anchor,b:pt,kind}:{a:pt,b:anchor,kind}); };
  const up=e=>{
    window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); window.removeEventListener('pointercancel',up);
    if(!dragging){ if(e.type==='pointerup'&&!S.pinching) tapPort(portEl); return; }
    document.querySelectorAll('.port.hot').forEach(p=>p.classList.remove('hot'));
    if(S.pick) markPicked();
    const t=document.elementFromPoint(e.clientX,e.clientY); const tp=t&&t.closest('.port');
    if(tp&&tp!==portEl) tryConnect(portEl,tp);
    drawCables(); showPatchbar();
  };
  window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
}

/* ---------- compare panel ---------- */
function renderCompare(){
  const c=$('#compare'), sb=S.sandbox; c.classList.remove('expanded');
  c.innerHTML=`<div class="cmpTop">${sb?'':'<button class="playBtn t" id="pT"><span class="dot"></span>▶ TARGET</button>'}<button class="playBtn y" id="pY"><span class="dot"></span>▶ ${sb?'PLAY':'YOURS'}</button>
    ${sb?'<div class="pctBox"><small>FREE JAM</small></div>':`<div class="pctBox"><b id="pct">–</b><small id="pctSub">need ${PASS}%</small></div><button class="btn primary" id="btnSubmit" disabled>Send</button><button class="btn" id="btnHelp" title="Stuck? Get a hint, or let Help patch a module or lock a knob"><span class="lbl">Help</span><span class="ico">?</span></button>`}</div>
    ${sb?'':`<div class="bar"><i id="barAll"></i><span class="thr" style="left:${PASS}%"></span></div>`}
    <div class="cmpBody">
      ${sb?'':`<div class="subs"><div class="sub"><span>Spectrogram</span><div class="bar"><i id="barSpec"></i></div><span id="vSpec"></span></div>
        <div class="sub"><span>Tone</span><div class="bar"><i id="barTone"></i></div><span id="vTone"></span></div>
        <div class="sub"><span>Shape</span><div class="bar"><i id="barShape"></i></div><span id="vShape"></span></div></div>
        <ul class="hints" id="hints"><li>Listening…</li></ul>`}
      <div class="plots" id="plots" data-view="${S.plotView}">
        <div class="plotTabs"><button data-v="scope">SCOPE</button><button data-v="env">LOUDNESS</button><button data-v="spec">SPECTRUM</button>${sb?'':'<button data-v="more">MORE ▾</button>'}</div>
        <div class="plotBox" data-p="scope"><div class="plotLbl">OSCILLOSCOPE · a few cycles of the held note</div><canvas class="plot" id="cScope" height="78"></canvas></div>
        <div class="plotBox" data-p="env"><div class="plotLbl">LOUDNESS OVER TIME</div><canvas class="plot" id="cEnv" height="60"></canvas></div>
        <div class="plotBox" data-p="spec"><div class="plotLbl">SPECTRUM · 40 Hz – 10 kHz</div><canvas class="plot" id="cSpec" height="78"></canvas></div>
        <div class="legend">${sb?'<span><i style="background:var(--amber)"></i>your sound</span>':'<span><i style="background:var(--cream)"></i>target (dashed)</span><span><i style="background:var(--amber)"></i>yours</span>'}</div>
      </div>
      <div class="stats" id="stats"></div>
    </div>`;
  ['#pT','#pY','#btnHelp','#btnSubmit'].forEach(sel=>Haptics.upgrade(c.querySelector(sel)));
  if(!sb){ $('#pT').onclick=()=>playTarget(); $('#btnSubmit').onclick=submit; $('#btnHelp').onclick=requestHelp;
    $('#hints').addEventListener('click',()=>{ if(S.mobile) toggleExpanded(); }); }
  $('#pY').onclick=()=>playYours();
  c.querySelectorAll('.plotTabs button').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.v==='more'){ toggleExpanded(); return; }
    S.plotView=b.dataset.v; $('#plots').dataset.view=S.plotView; paintPlotTabs(); requestAnimationFrame(drawPlots); }));
  paintPlotTabs();
}
function toggleExpanded(){ const c=$('#compare'); c.classList.toggle('expanded'); const m=c.querySelector('[data-v=more]'); if(m) m.textContent=c.classList.contains('expanded')?'LESS ▴':'MORE ▾';
  requestAnimationFrame(()=>{ if(!S.userZoom) fitView(); }); }
function paintPlotTabs(){ document.querySelectorAll('.plotTabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.plotView)); }
/* ▶ Target / ▶ Yours: one note, or in song mode (♫) a short demo song on that patch. */
S.songMode=!!store.get('songMode',false);
function playTarget(){ if(S.songMode&&!S.sandbox) flashPlay('pT',playSong(targetPatch(S.L),S.L)); else playFixed(targetPatch(S.L),S.L,'pT'); }
function playYours(){ if(S.songMode) flashPlay('pY',playSong(S.patch,S.L||{note:45,ch:'basics'})); else playFixed(S.patch,S.L,'pY'); }
function setSongMode(on){ S.songMode=on; store.set('songMode',on); stopOneShots(); const b=$('#songBtn'); b.classList.toggle('on',on); b.setAttribute('aria-pressed',on);
  b.title=on?'Song mode is on: ▶ Target and ▶ Yours play a demo song. Tap for single notes.':'Song mode: ▶ Target and ▶ Yours play a short demo song instead of one note';
  if(on) toast('Song mode: ▶ Target and ▶ Yours now play a short demo song.'); }
function flashPlay(id,dur){ const b=document.getElementById(id); if(!b) return; b.classList.add('lit'); setTimeout(()=>b.classList.remove('lit'),dur*1000); }

let aTimer=null, aSeq=0;
function scheduleAnalyze(){ if(S.stuck) S.stuck.changes++; clearTimeout(aTimer); aTimer=setTimeout(runAnalyze,S.mobile?220:120); saveDraft(); }
function saveDraft(){ if(S.L&&S.patch) store.set('draft2.'+S.L.id,S.patch); }
async function runAnalyze(){
  if(!S.L) return; const seq=++aSeq, L=S.L;
  if(typeof OfflineAudioContext==='undefined'){ const h=$('#hints'); if(h) h.innerHTML='<li>This browser can\'t render audio offline, so matching is unavailable.</li>'; return; }
  const xm=await renderPatch(S.patch,L), mine=analyze(xm);
  if(!S.sandbox&&!L._tX){ const xt=await renderPatch(targetPatch(L),L); L._tX=xt; L._tA=analyze(xt); }
  if(seq!==aSeq||S.L!==L) return;
  S.mineX=xm; S.mine=mine; S.cmp=S.sandbox?null:levelCompare(L,L._tA,mine); if(S.cmp) noteScore(S.cmp.overall);
  updateCompare();
}
function updateCompare(){
  const c=S.cmp, st=$('#stats'); if(!st) return;
  st.innerHTML=`<div class="stat"><b>${playerCost(S.patch)}¢</b><span>Cost</span></div><div class="stat"><b>${S.patch.modules.filter(m=>m.type!=='out').length}</b><span>Modules</span></div><div class="stat"><b>${S.patch.cables.length}</b><span>Cables</span></div>`;
  if(c){
    const ok=c.overall>=PASS-1e-9, pct=$('#pct');
    if(ok&&!S.wasOk) Haptics.success(); S.wasOk=ok;
    pct.textContent=Math.floor(c.overall)+'%'; pct.classList.toggle('ok',ok);
    $('#pctSub').textContent=ok?'ready to send':`need ${PASS}%`;
    $('#barAll').style.width=c.overall+'%'; $('#barAll').style.background=ok?'var(--good)':'var(--amber)';
    [['Spec','sSpec'],['Tone','sTone'],['Shape','sShape']].forEach(([k,f])=>{ $('#bar'+k).style.width=c[f]+'%'; $('#v'+k).textContent=Math.floor(c[f]); });
    const miss=missing(), hs=[];
    if(!ok&&isChallenge()){ const have=placedCount(), need=S.L.target.mods.length; if(have<need) hs.push({part:1,t:`Challenge: the reference patch uses ${need} modules. You have ${have}.`}); }
    else if(!ok&&miss.length){ const [t,n]=miss[0]; hs.push({part:1,t:`Missing part: this sound needs ${n>1?n+' more':'a'} ${MT[t].name}${n>1?'s':''}. Tap an empty slot to add ${n>1?'them':'one'}.`}); }
    const outFed=S.patch.cables.some(x=>x.to.m==='out');
    if(!outFed) hs.push({t:'Nothing reaches the OUTPUT yet. Patch an audio cable into its IN jack.'});
    c.hints.forEach(h=>{ if(!(outFed===false&&/Silence/.test(h.t))) hs.push(h); });
    $('#hints').innerHTML=hs.map(h=>`<li class="${h.ok?'ok':''}${h.part?' miss':''}">${h.t}</li>`).join('');
    $('#btnSubmit').disabled=!ok;
  }
  drawPlots();
}
function setupCanvas(cv){ const dpr=window.devicePixelRatio||1, w=cv.clientWidth; if(!cv.dataset.h) cv.dataset.h=cv.getAttribute('height'); const h=S.focus?(S.mobile?52:60):Math.round(+cv.dataset.h*(S.mobile?0.66:1));
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); cv.style.height=h+'px'; const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); return {g,w,h}; }
const cssv=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function scopeSeg(x,start,len,period){
  let i=start; const lim=Math.min(x.length-1,start+(period?Math.ceil(period)+2:600));
  for(let k=start;k<lim;k++){ if(x[k]<=0&&x[k+1]>0){ i=k+1; break; } }
  return x.subarray(i,Math.min(x.length,i+len));
}
function drawPlots(){
  const Y=S.mine; if(!Y||!S.L) return;
  const T=S.sandbox?null:S.L._tA, CREAM=cssv('--cream'), AMB=cssv('--amber'), GRID='#2a241f';
  // oscilloscope
  const cs=$('#cScope');
  if(cs&&cs.clientWidth&&S.mineX){ const {g,w,h}=setupCanvas(cs);
    const ref=(T&&T.pitch)||Y.pitch, period=ref?SR/ref:null;
    const len=Math.round(period?Math.min(Math.max(period*3,SR*0.006),SR*0.08):SR*0.02);
    const start=Math.floor(Math.min(S.L.gate*0.5,S.L.dur*0.4)*SR);
    const segs=[]; if(T&&S.L._tX) segs.push([scopeSeg(S.L._tX,start,len,period),CREAM,[4,3]]); segs.push([scopeSeg(S.mineX,start,len,period),AMB,[]]);
    let amp=1e-4; segs.forEach(([s])=>{ for(let i=0;i<s.length;i++) amp=Math.max(amp,Math.abs(s[i])); });
    g.strokeStyle=GRID; g.lineWidth=1; g.beginPath(); g.moveTo(0,h/2); g.lineTo(w,h/2); g.stroke();
    segs.forEach(([s,col,dash])=>{ g.beginPath(); for(let i=0;i<s.length;i++){ const x=i/(len-1)*w, y=h/2-(s[i]/amp)*(h/2-5); i?g.lineTo(x,y):g.moveTo(x,y); }
      g.setLineDash(dash); g.strokeStyle=col; g.lineWidth=dash.length?1.6:2; g.stroke(); g.setLineDash([]); });
    g.fillStyle='#6d6356'; g.font='9px IBM Plex Mono'; g.fillText(period?`${(len/SR*1000).toFixed(1)} ms · ${Math.round(len/period)} cycles`:`${(len/SR*1000).toFixed(0)} ms`,5,11);
  }
  // loudness
  const ce=$('#cEnv');
  if(ce&&ce.clientWidth){ const {g,w,h}=setupCanvas(ce); const ref=Math.max(Y.peak,T?T.peak:-200), fl=ref-60;
    g.strokeStyle=GRID; g.lineWidth=1; for(let i=1;i<3;i++){ g.beginPath(); g.moveTo(0,h*i/3); g.lineTo(w,h*i/3); g.stroke(); }
    const gx=S.L.gate/S.L.dur*w; g.setLineDash([2,3]); g.strokeStyle='#4d433a'; g.beginPath(); g.moveTo(gx,0); g.lineTo(gx,h); g.stroke(); g.setLineDash([]);
    g.fillStyle='#6d6356'; g.font='9px IBM Plex Mono'; g.fillText('key up',gx+3,10);
    const line=(A,col,fill,dash)=>{ g.beginPath(); for(let e=0;e<A.nE;e++){ const x=e/(A.nE-1)*w, v=Math.max(A.env[e],fl), y=h-2-(v-fl)/(ref-fl)*(h-6); e?g.lineTo(x,y):g.moveTo(x,y); }
      if(fill){ g.lineTo(w,h); g.lineTo(0,h); g.closePath(); g.fillStyle=fill; g.fill(); } else { g.setLineDash(dash||[]); g.strokeStyle=col; g.lineWidth=1.8; g.stroke(); g.setLineDash([]); } };
    line(Y,AMB,'rgba(242,165,65,.18)'); line(Y,AMB); if(T) line(T,CREAM,null,[4,3]);
  }
  // spectrum
  const cp=$('#cSpec');
  if(cp&&cp.clientWidth){ const {g,w,h}=setupCanvas(cp); const ref=Math.max(...Y.avg,...(T?T.avg:[-200])), fl=ref-70;
    g.strokeStyle=GRID; g.fillStyle='#6d6356'; g.font='9px IBM Plex Mono';
    [100,1000,10000].forEach(f=>{ const x=Math.log2(f/FMIN)/Math.log2(FMAX/FMIN)*w; g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); g.fillText(f>=1000?f/1000+'k':f,x+3,h-4); });
    const line=(A,col,fill,dash)=>{ g.beginPath(); for(let b=0;b<NB;b++){ const x=b/(NB-1)*w, v=Math.max(A.avg[b],fl), y=h-2-(v-fl)/(ref-fl)*(h-8); b?g.lineTo(x,y):g.moveTo(x,y); }
      if(fill){ g.lineTo(w,h); g.lineTo(0,h); g.closePath(); g.fillStyle=fill; g.fill(); } else { g.setLineDash(dash||[]); g.strokeStyle=col; g.lineWidth=1.5; g.stroke(); g.setLineDash([]); } };
    line(Y,AMB,'rgba(242,165,65,.16)'); line(Y,AMB); if(T) line(T,CREAM,null,[4,3]);
  }
}

/* ---------- submit ---------- */
function submit(){
  const c=S.cmp; if(!c||c.overall<PASS) return;
  const L=S.L, cost=playerCost(S.patch), mods=S.patch.modules.filter(m=>m.type!=='out'&&!m.preset).length, cab=S.patch.cables.length;
  const prev=progress.solved[L.id];
  const best={cost:prev?Math.min(prev.cost,cost):cost, cables:prev?Math.min(prev.cables,cab):cab, match:prev?Math.max(prev.match,c.overall):c.overall};
  progress.solved[L.id]=best; saveProgress();
  const ch=chapterOf(S.li), k=ch.levels.indexOf(S.li), nextIdx=ch.levels[k+1], next=nextIdx!=null&&isUnlocked(nextIdx)?nextIdx:null;
  const chDone=ch.levels.every(i=>progress.solved[LEVELS[i].id]), opened=ch.id==='basics'&&chDone;
  const par=parCost(L), m=$('#modal'); m.hidden=false;
  m.innerHTML=`<div class="modalCard"><h2>Patch accepted</h2><p class="lead">${L.client} · ${L.title}</p>${chDone&&next==null?`<p class="lead" style="color:var(--good)">${opened?'Basics complete! Every theme on the gig board is now open.':ch.title+' complete!'}</p>`:''}
    <blockquote>${L.reply}</blockquote>
    <div class="resGrid">
      <div class="res"><b>${Math.floor(c.overall)}%</b><span>Match</span><em>best ${Math.floor(best.match)}%</em></div>
      <div class="res"><b>${cost}¢</b><span>Cost</span><em>best ${best.cost}¢ / par ${par}</em></div>
      <div class="res"><b>${mods}</b><span>Added</span><em>modules</em></div>
      <div class="res"><b>${cab}</b><span>Cables</span><em>best ${best.cables}</em></div>
    </div>
    <div class="jingle"><button class="btn ghost" id="mJingle">♪ Replay jingle</button><span class="jDots" id="jDots"></span><span class="jLbl">your patch takes a bow</span></div>
    <div class="modalBtns"><button class="btn" id="mStay">Keep tweaking</button><button class="btn" id="mBoard">Gig board</button>${next!=null?'<button class="btn primary" id="mNext">Next gig →</button>':''}</div></div>`;
  const leave=fn=>()=>{ stopJingle(); clearTimeout(S.jT); m.hidden=true; fn&&fn(); };
  $('#mStay').onclick=leave(); $('#mBoard').onclick=leave(showBoard);
  if(next!=null) $('#mNext').onclick=leave(()=>openLevel(next));
  const patch=JSON.parse(JSON.stringify(S.patch));
  const runJingle=()=>{ const j=playJingle(patch,L), dots=$('#jDots'); if(!dots) return;
    const starts=[...new Set(j.events.map(e=>e.t))];
    dots.innerHTML=starts.map(()=>'<i></i>').join(''); (S.jTs||[]).forEach(clearTimeout);
    S.jTs=starts.map((t,k)=>setTimeout(()=>{ const d=dots.children[k]; if(d){ d.classList.add('on'); setTimeout(()=>d.classList.remove('on'),220); } },80+t*1000)); };
  $('#mJingle').onclick=runJingle;
  Haptics.success(); S.jT=setTimeout(runJingle,250);
}
let toastT=null;
function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=el('div',{class:'toast'}); document.body.appendChild(t); } t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),2600); }

/* ---------- global input ---------- */
const KEYMAP={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14};
let octShift=0;
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if(S.moving){ S.moving=null; renderRack(); } clearPick(); $('#sheet').hidden=true; closeSide(); if(S.slotMenu!=null){ S.slotMenu=null; renderRack(); } return; }
  if(!S.L||e.metaKey||e.ctrlKey||e.altKey||e.repeat) return;
  if(!$('#modal').hidden||!$('#sheet').hidden) return;
  const k=e.key.toLowerCase();
  if(k===' '){ e.preventDefault(); playYours(); return; }
  if(k==='t'&&e.shiftKey&&!S.sandbox){ playTarget(); return; }
  if(k==='f'&&e.shiftKey){ setFocus(!S.focus); return; }
  if(k==='='||k==='+'){ zoomCenter(1.2); return; } if(k==='-'){ zoomCenter(1/1.2); return; } if(k==='0'){ fitView(); return; }
  if(k==='z'){ octShift=Math.max(-3,octShift-1); toast('Keyboard octave '+fmtSigned(octShift)); return; }
  if(k==='x'){ octShift=Math.min(3,octShift+1); toast('Keyboard octave '+fmtSigned(octShift)); return; }
  if(k in KEYMAP) keyDown('k'+k,S.L.note+KEYMAP[k]+12*octShift,1);
});
window.addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); if(k in KEYMAP) keyUp('k'+k); });
window.addEventListener('blur',allNotesOff);
let rzT=null;
window.addEventListener('resize',()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{ if(!S.L) return; if(!S.userZoom) fitView(); else { clampView(); applyView(); } drawCables(); drawPlots(); renderKeys(); },80); });
$('#kbDn').onclick=()=>{ S.kbLo-=12; renderKeys(); };
$('#kbUp').onclick=()=>{ S.kbLo+=12; renderKeys(); };
$('#songBtn').onclick=()=>setSongMode(!S.songMode); $('#songBtn').classList.toggle('on',S.songMode);
$('#keysBtn').onclick=()=>setKeysOpen(!S.keysOpen);
$('#focusBtn').onclick=()=>setFocus(!S.focus);
function resetRack(){ S.pick=null; showPatchbar(); freshPatch(); refreshRack(); scheduleAnalyze(); toast('Rack reset'); }
$('#clearBtn').onclick=()=>{ const b=$('#clearBtn'); if(!b.dataset.armed){ b.dataset.armed=1; b.textContent='Sure?'; setTimeout(()=>{ b.textContent='Reset'; delete b.dataset.armed; },2500); return; }
  delete b.dataset.armed; b.textContent='Reset'; resetRack(); };
$('#kbClose').onclick=()=>setKeysOpen(false);
/* ---------- settings sheet (⚙ in the top bar) ---------- */
function openSettings(){
  const sh=$('#sheet'); sh.hidden=false; sh.style.removeProperty('--sel');
  const inLevel=!!S.L&&!$('#screenLevel').hidden;
  const row=(label,sub,btn)=>`<div class="setRow"><div><b>${label}</b><span>${sub}</span></div>${btn}</div>`;
  const hapSub=!Haptics.available?'Not available on this device.':Haptics.continuous?'Ticks on knobs, cables and modules.':'iPhone: ticks when you tap buttons, jacks, keys, slots and knob steps (iOS 18+). iOS doesn\'t allow ticks while dragging.';
  sh.innerHTML=`<div class="sheetCard"><div class="shHead"><span class="shTitle">SETTINGS</span><button class="btn primary" id="shDone">Done</button></div>
    ${row('Haptics',hapSub,Haptics.available?`<label class="nativeSw" title="Haptics on/off"><input type="checkbox" switch id="stHapSw" ${Haptics.enabled?'checked':''}></label>`:'')}
    ${inLevel?row('On-screen keyboard','Find the client\'s note and play your patch.',`<button class="btn tgl" id="stKeys">${S.keysOpen?'Shown':'Hidden'}</button>`):''}
    ${inLevel?row('Focus mode','Bigger board, compact compare bar.',`<button class="btn tgl" id="stFocus">${S.focus?'On':'Off'}</button>`):''}
    ${inLevel?row('Reset this rack','Removes everything you added to this gig.','<button class="btn" id="stReset">Reset</button>'):''}
    ${row('Your data',dataSummary(),'<button class="btn" id="stData">Details</button>')}</div>`;
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; };
  $('#shDone').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); }; $('#stData').onclick=openDataSheet;
  // A real iOS switch: on iOS 18 the system itself ticks when it's flipped, so it doubles as a check that switch haptics work here.
  const hs=$('#stHapSw'); if(hs) hs.onchange=()=>{ Haptics.set(hs.checked); if(hs.checked) Haptics.select(); const fb=$('#btnHaptics'); if(fb&&fb.firstChild&&fb.firstChild.nodeType===3) fb.firstChild.nodeValue='Haptics: '+(Haptics.enabled?'on':'off'); };
  if(inLevel){
    $('#stKeys').onclick=()=>{ close(); setKeysOpen(!S.keysOpen); };
    $('#stFocus').onclick=()=>{ close(); setFocus(!S.focus); };
    const rb=$('#stReset'); rb.onclick=()=>{ if(!rb.dataset.armed){ rb.dataset.armed=1; rb.textContent='Sure?'; return; } close(); resetRack(); };
  }
}
$('#btnSettings').onclick=openSettings;

/* ---------- Your data: what's saved, where, and export / import / delete ---------- */
function dataInfo(){
  const ks=store.keys(), drafts=ks.filter(k=>k.startsWith('draft')), solved=Object.keys(progress.solved).length;
  return {ks,drafts:drafts.length,solved,played:Object.keys(progress.played||{}).length,helped:Object.keys(progress.helped||{}).length,
    prefs:ks.filter(k=>!k.startsWith('draft')&&k!=='progress'),kb:Math.max(0.1,store.bytes()*2/1024)};
}
function dataSummary(){ const d=dataInfo(); return store.available()?`Saved only in this browser on this device: ${d.solved} gig${d.solved===1?'':'s'} paid, ${d.drafts} patch${d.drafts===1?'':'es'} in progress, ${d.kb.toFixed(1)} KB.`:'This browser isn\'t letting the game save anything (private mode or storage blocked), so progress lasts only until you close the page.'; }
function openDataSheet(){
  const sh=$('#sheet'); sh.hidden=false; const d=dataInfo();
  const PREF={haptics:'Haptics on/off',keysOpen:'On-screen keyboard shown',songMode:'♫ Song mode',boardView:'Gig board chapter and filter',midiAuto:'Reconnect MIDI automatically',snap:'Snap modules to boxes'};
  sh.innerHTML=`<div class="sheetCard dataCard"><div class="shHead"><span class="shTitle">YOUR DATA</span><button class="btn primary" id="shDone">Done</button></div>
    <p><b>Where it lives:</b> in this browser's local storage, on this device only. There are no accounts, nothing is uploaded, and there are no analytics or cookies.</p>
    <p><b>What that means:</b> another browser or device, a private window, or the other copy of the game (GitHub Pages vs. claude.ai) each keeps its own separate progress. Clearing this site's data in your browser settings erases it. Use Export to move it.</p>
    <ul class="dataList">
      <li><b>Progress</b><span>${d.solved} gig${d.solved===1?'':'s'} paid (cost, match %), ${d.played} with the note played, ${d.helped} finished with Help.</span></li>
      <li><b>Patches in progress</b><span>${d.drafts} gig${d.drafts===1?'':'s'}: your rack and cables, so you can leave a gig and come back.</span></li>
      <li><b>Preferences</b><span>${d.prefs.length?d.prefs.map(k=>PREF[k]||k).join(' · '):'None yet.'}</span></li>
      <li><b>Total</b><span>${d.kb.toFixed(1)} KB in ${d.ks.length} entr${d.ks.length===1?'y':'ies'} (named <code>sph.*</code>).</span></li>
    </ul>
    <div class="dataBtns"><button class="btn" id="dExport">Export</button><label class="btn" id="dImportL">Import<input type="file" accept="application/json,.json" id="dImport" hidden></label><button class="btn danger" id="dWipe">Delete everything</button></div>
    <small class="dataNote">Export saves a small .json file. Import replaces what's here with that file.</small></div>`;
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; };
  $('#shDone').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); };
  $('#dExport').onclick=()=>{ try{ const blob=new Blob([JSON.stringify({game:'synth-patch-hero',version:1,exported:new Date().toISOString(),data:store.dump()},null,1)],{type:'application/json'});
    const a=el('a',{href:URL.createObjectURL(blob),download:'synth-patch-hero-progress.json'}); document.body.appendChild(a); a.click(); a.remove(); toast('Exported synth-patch-hero-progress.json'); }catch(e){ toast('This page isn\'t allowed to download files here.'); } };
  $('#dImport').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    try{ const j=JSON.parse(await f.text()); if(j.game!=='synth-patch-hero'||!j.data) throw 0;
      store.keys().forEach(k=>store.del(k)); Object.entries(j.data).forEach(([k,v])=>store.set(k,v)); progress=store.get('progress',{solved:{}});
      close(); showBoard(); toast(`Imported ${Object.keys(progress.solved).length} paid gigs.`); }catch(_){ toast('That file isn\'t a Synth Patch Hero export.'); } };
  const w=$('#dWipe'); w.onclick=()=>{ if(!w.dataset.armed){ w.dataset.armed=1; w.textContent='Tap again to delete'; return; }
    store.keys().forEach(k=>store.del(k)); progress={solved:{}}; close(); showBoard(); toast('Deleted all saved data.'); };
}
$('#briefBtn').onclick=openSide; $('#sideClose').onclick=closeSide; $('#sideBackdrop').onclick=closeSide;
$('#midiChip').onclick=()=>{ if(MIDI.state==='on'){ toast('Connected: '+MIDI.names.join(', ')); return; } connectMIDI(false); };
if(store.get('midiAuto',false)) connectMIDI(true);
$('#btnHome').onclick=()=>{ if(history.state&&history.state.fromBoard) history.back(); else showBoard(); };

/* ---------- browser history: Back/Forward move between the gig board and gigs ----------
   Board = #/ , a gig = #/gig/<id>, Free Jam = #/jam. Back from a gig returns to the board instead of leaving the site. */
const ROUTE={busy:false};
function routeFor(i){ return i==null?'#/':i<0?'#/jam':'#/gig/'+LEVELS[i].id; }
function routeFromHash(h=location.hash){ let m; if(h==='#/jam') return -1; if((m=h.match(/^#\/gig\/([\w-]+)$/))){ const i=LEVELS.findIndex(L=>L.id===m[1]); return i>=0?i:null; } return null; }
function pushRoute(i){
  if(ROUTE.busy||location.hash==='#selftest') return; const h=routeFor(i), cur=location.hash||'#/';
  if(cur===h) return;
  try{ history.pushState({i,fromBoard:i!=null&&cur==='#/'},'',h); }catch(_){}
}
function applyRoute(){ ROUTE.busy=true; try{ const i=routeFromHash(); if(i==null) showBoard(); else openLevel(i); } finally{ ROUTE.busy=false; } }
window.addEventListener('popstate',()=>{ if(location.hash!=='#selftest') applyRoute(); });
/* On load: a link to a gig opens it, with the board underneath in history so Back still lands on the board. */
function startRoute(){
  const i=routeFromHash();
  if(i==null){ ROUTE.busy=true; showBoard(); ROUTE.busy=false; try{ history.replaceState(null,'','#/'); }catch(_){} return; }
  try{ history.replaceState(null,'','#/'); }catch(_){}
  ROUTE.busy=true; showBoard(); ROUTE.busy=false; openLevel(i);
}
(function(){ if(!Haptics.available) return; let b=el('button',{class:'btn ghost',id:'btnHaptics'}); $('#btnReset').after(b); b=Haptics.upgrade(b);
  const lbl=()=>{ b.firstChild&&b.firstChild.nodeType===3?b.firstChild.nodeValue='Haptics: '+(Haptics.enabled?'on':'off'):b.prepend('Haptics: '+(Haptics.enabled?'on':'off')); }; lbl();
  b.onclick=()=>{ Haptics.set(!Haptics.enabled); lbl(); Haptics.select(); }; })();
$('#btnReset').onclick=()=>{ const b=$('#btnReset'); if(b.dataset.armed){ progress={solved:{}}; saveProgress(); LEVELS.concat([SANDBOX]).forEach(L=>{ store.del('draft.'+L.id); store.del('draft2.'+L.id); }); b.textContent='Wipe progress'; delete b.dataset.armed; showBoard(); toast('Progress wiped'); } else { b.dataset.armed=1; b.textContent='Click again to confirm'; setTimeout(()=>{ b.textContent='Wipe progress'; delete b.dataset.armed; },3000); } };
