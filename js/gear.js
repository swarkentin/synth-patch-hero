/* Synth Patch Hero · On your box: guides for making a gig's sound on a real instrument.
   The game is a modular synth. A standalone box has the same modules inside, already wired, so each guide
   walks the patch onto that box's panel: which page, which knob, roughly how far, and which cables are built in. */
'use strict';
const GR={tab:null, step:0, done:new Set(), open:false};
const myGear=()=>store.get('gear',[]).filter(id=>GEAR[id]&&!GEAR[id].soon);
function guidesFor(L){ const g=L&&GEAR_GUIDES[L.id]; return g?myGear().filter(id=>g[id]):[]; }
function gearBadges(L){ return guidesFor(L).map(id=>`<span class="gearTag" title="On your box: a guide for your ${GEAR[id].name}">${GEAR[id].short}</span>`).join(''); }

/* ---------- the toolbar button and the drawer under the rack ---------- */
function gearOnLevel(){
  const ids=S.sandbox?[]:guidesFor(S.L), b=$('#gearBtn');
  b.hidden=!ids.length; GR.tab=ids[0]||null; GR.step=0; GR.done=new Set();
  setGearOpen(false,true);
}
function setGearOpen(on,quiet){
  GR.open=on&&!!GR.tab; $('#gearDock').hidden=!GR.open; $('#gearBtn').classList.toggle('on',GR.open); $('#gearBtn').setAttribute('aria-pressed',GR.open);
  if(GR.open) renderGear(); else $('#gearDock').innerHTML='';
  if(!quiet) requestAnimationFrame(()=>{ if(!S.userZoom) fitView(); else { clampView(); applyView(); } drawCables(); });
}
function gearKnob(k){
  const [name,val,aim,hi]=k; if(!name) return '<div class="gKnob blank"></div>';
  const a0=-225*Math.PI/180, a1=45*Math.PI/180, R=15, c=19, pt=f=>{ const a=a0+(a1-a0)*f; return [c+R*Math.cos(a),c+R*Math.sin(a)]; };
  const [x0,y0]=pt(0),[x1,y1]=pt(1);
  let svg=`<path d="M${x0} ${y0} A${R} ${R} 0 1 1 ${x1} ${y1}" class="gTrack"/>`;
  if(aim!=null){ const [px,py]=pt(aim); svg+=`<line x1="${c}" y1="${c}" x2="${px}" y2="${py}" class="gAim"/>`; }
  return `<div class="gKnob${hi?' hi':''}"><svg viewBox="0 0 38 38" aria-hidden="true">${svg}<circle cx="${c}" cy="${c}" r="9" class="gCap"/></svg><b>${name}</b><span>${hi?val:''}</span></div>`;
}
function gearScreen(st){
  const cell=k=>!k[0]?'<i></i>':`<i class="${k[3]?'inv':''}">${k[0]}<br>${k[1]}</i>`;
  return `<div class="oled" role="img" aria-label="Copy of the box's screen: ${st.head[0]} page${st.knobs.filter(k=>k[3]).length?', change '+st.knobs.filter(k=>k[3]).map(k=>k[0]).join(', '):''}">
    <div class="oHead${st.hiHead?' inv':''}"><span>${st.head[0]}</span><span>${st.head[1]}</span></div>
    <div class="oGrid">${st.knobs.map(cell).join('')}</div>
    <div class="oFoot"><span>T1 SYN</span><span>${S.L.title.toUpperCase()}</span></div></div>`;
}
function renderGear(){
  const d=$('#gearDock'), id=GR.tab, gear=GEAR[id], G=GEAR_GUIDES[S.L.id][id], st=G.steps[GR.step], n=G.steps.length;
  const tabs=guidesFor(S.L).map(g=>`<button class="gTab${g===id?' on':''}" data-g="${g}" aria-pressed="${g===id}">${GEAR[g].name}</button>`).join('');
  const steps=G.steps.map((s,i)=>`<li class="${i===GR.step?'cur':''}${GR.done.has(i)?' done':''}"><button data-s="${i}"><span class="gN">${GR.done.has(i)?'✓':i+1}</span><span>${s.t}</span></button></li>`).join('');
  d.innerHTML=`<div class="gHead"><b class="gTitle">ON YOUR BOX</b><div class="gTabs" role="group" aria-label="Instrument">${tabs}</div>
      <span class="gDraft" title="Names are from the manual. Knob positions are rough, and the knob order on screen is our best reading of the manual.">ROUGH POSITIONS</span>
      <span class="spacer"></span><button class="gClose" aria-label="Close On your box">×</button></div>
    <div class="gBody">
      <ol class="gSteps">${steps}</ol>
      <div class="gNow">
        <div class="gStepHead"><span class="gN">${GR.step+1}/${n}</span><b>${st.t}</b><span class="gGame">game: ${st.game}</span></div>
        <p class="gText">${st.x}</p>
        <div class="gNav"><button class="btn ghost" id="gPrev" ${GR.step?'':'disabled'}>◀ Back</button><button class="btn" id="gDone">${GR.step===n-1?'Done on my box ✓':'Done on my box ▶'}</button></div>
      </div>
      <div class="gPanel">
        ${gearScreen(st)}
        <div class="gPages" aria-label="Page keys">${gear.pages.map(p=>`<span class="${p===st.page?'on':''}">${p}</span>`).join('')}</div>
        <div class="gKnobs">${st.knobs.map(gearKnob).join('')}</div>
      </div>
      <div class="gWords"><b>SAME IDEA, ITS WORDS</b>
        <dl>${G.words.map(w=>`<div><dt>${w[0]}</dt><dd>${w[1]}</dd></div>`).join('')}</dl>
        <p>${G.note}</p>
        <small>Not affiliated with or endorsed by the maker. From the <a href="${gear.source.url}" target="_blank" rel="noopener">${gear.source.label}</a>.</small></div>
    </div>`;
  d.querySelector('.gClose').onclick=()=>setGearOpen(false);
  d.querySelectorAll('.gTab').forEach(b=>b.onclick=()=>{ GR.tab=b.dataset.g; GR.step=0; GR.done=new Set(); renderGear(); drawCables(); });
  d.querySelectorAll('.gSteps button').forEach(b=>b.onclick=()=>{ GR.step=+b.dataset.s; renderGear(); });
  $('#gPrev').onclick=()=>{ if(GR.step>0){ GR.step--; renderGear(); } };
  $('#gDone').onclick=()=>{ GR.done.add(GR.step); Haptics.select&&Haptics.select();
    if(GR.step<n-1){ GR.step++; renderGear(); } else { renderGear(); toast(`All ${n} steps done. Play the client's song and compare it with your box.`); } };
}

/* ---------- cables that the box already has inside: dimmed teal overlay with a tag (drawn by drawCables) ---------- */
function gearCableOverlay(){
  if(!GR.open||!GR.tab||!S.patch) return '';
  const G=GEAR_GUIDES[S.L.id][GR.tab], mt=id=>(S.patch.modules.find(m=>m.id===id)||{}).type; let h='';
  S.patch.cables.forEach(c=>{
    const w=G.prewired.find(p=>p[0]===mt(c.from.m)&&p[1]===c.from.p&&p[2]===mt(c.to.m)&&p[3]===c.to.p); if(!w) return;
    const a=jackXY(c.from.m,c.from.p,'out'), b=jackXY(c.to.m,c.to.p,'in'); if(!a||!b) return;
    const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2+12+Math.hypot(b[0]-a[0],b[1]-a[1])*0.12;
    h+=`<g class="prewired"><path d="${cablePath(a,b)}" class="pwLine"/><rect x="${mx-44}" y="${my-10}" width="88" height="20" rx="5"/><text x="${mx}" y="${my+4}">IN YOUR BOX</text><title>Already wired inside your ${GEAR[GR.tab].name}: set it on the ${w[4]}</title></g>`;
  });
  return h;
}

/* ---------- Settings → My gear ---------- */
function openGearSheet(){
  const sh=$('#sheet'); sh.hidden=false; const sel=new Set(myGear());
  const item=id=>{ const g=GEAR[id]; return `<label class="gearPick${g.soon?' soon':''}"><input type="checkbox" data-g="${id}" ${sel.has(id)?'checked':''} ${g.soon?'disabled':''}>
    <span><b>${g.name}</b><span>${g.blurb}</span></span><em>${g.soon?'coming later':Object.keys(GEAR_GUIDES).filter(k=>GEAR_GUIDES[k][id]).length+' gig'+(Object.keys(GEAR_GUIDES).filter(k=>GEAR_GUIDES[k][id]).length===1?'':'s')}</em></label>`; };
  sh.innerHTML=`<div class="sheetCard gearCard"><div class="shHead"><span class="shTitle">MY GEAR</span><button class="btn primary" id="shDone">Done</button></div>
    <p>The game is a modular synth. If you don't have a rack yet, a standalone synth has the same modules inside, already wired. Pick yours and gigs that fit get an <b>On your box</b> guide: which page, which knob, about how far.</p>
    <div class="gearGrp">MODULAR <span>· 1:1 with the game</span></div>${item('rack')}
    <div class="gearGrp">STANDALONE &amp; GROOVEBOXES <span>· the affordable way in</span></div>${['dt2','minifreak','mc707'].map(item).join('')}
    <small class="dataNote">Saved on this device only. Not affiliated with or endorsed by any maker; names are used to describe their instruments.</small></div>`;
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; if(S.L&&!$('#screenLevel').hidden) gearOnLevel(); else if(!$('#screenBoard').hidden) showBoard(); };
  $('#shDone').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); };
  sh.querySelectorAll('input[data-g]').forEach(c=>c.onchange=()=>{ const s=new Set(store.get('gear',[])); c.checked?s.add(c.dataset.g):s.delete(c.dataset.g); store.set('gear',[...s]); });
}
$('#gearBtn').onclick=()=>setGearOpen(!GR.open);
