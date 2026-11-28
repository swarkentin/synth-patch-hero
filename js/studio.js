/* Synth Patch Hero · Pay, by-ear mode, and your studio.
   By ear (hard): the graphs and sound hints are hidden, and a gig pays 2× (3× for challenges and advanced gigs).
   With the scope (easy): normal pay. Switching to the scope during a gig gives up its by-ear bonus until the rack is reset.
   Pay buys modules for your own studio rack (Free Jam) and panel themes for the gear. */
'use strict';
const STARTER={osc:1,filter:1,vca:1,env:1};          // the dusty rack from the story
const MAX_OWN=6;
const THEMES=[
  {id:'dusty', name:'Dusty Basement', price:0, blurb:'The rack as you found it: worn brown panels.', sw:['#2b2520','#231e1a','#3a312a']},
  {id:'midnight', name:'Midnight', price:400, blurb:'Matte black panels, cool blue edges.', sw:['#1c1e23','#15171b','#2c3440']},
  {id:'walnut', name:'Walnut Cheeks', price:600, blurb:'Dark panels between warm wooden end cheeks.', sw:['#26211c','#1e1a16','#7a4f2c']},
  {id:'oxide', name:'Oxide Green', price:800, blurb:'Military olive panels, like old test gear.', sw:['#26291f','#1f2219','#3d4430']},
  {id:'neon', name:'Neon Arcade', price:1200, blurb:'Deep purple panels with a pink glow.', sw:['#231a2e','#1b1424','#e06aa8']},
];
const chapterById=id=>CHAPTERS.find(c=>c.id===id)||{};
function gigTier(L){ const ch=chapterById(L.ch); return L.challenge?(ch.level==='advanced'?'advChallenge':'challenge'):ch.level==='advanced'?'advanced':ch.bonus?'bonus':L.ch==='basics'?'basics':'theme'; }
const BASE_PAY={basics:120,theme:160,challenge:220,advanced:200,advChallenge:260,bonus:150};
const basePay=L=>BASE_PAY[gigTier(L)];
const earMult=L=>{ const t=gigTier(L); return t==='challenge'||t==='advanced'||t==='advChallenge'?3:2; };
const earPay=L=>basePay(L)*earMult(L);
/* What a solved gig has paid so far. Gigs paid before pay depended on the mode count at the scope rate. */
const paidFor=id=>{ const v=progress.solved[id]; if(!v) return 0; const L=LEVELS.find(l=>l.id===id); return v.pay!=null?v.pay:(L?basePay(L):0); };
const earned=()=>Object.keys(progress.solved).reduce((s,id)=>s+paidFor(id),0);
const studio=()=>Object.assign({owned:{},spent:0,gift:0,themes:['dusty'],theme:'dusty'},store.get('studio',{}));
const wallet=()=>earned()+(studio().gift||0)-studio().spent;
const owned=t=>(STARTER[t]||0)+(studio().owned[t]||0);
function studioPalette(){ const p={}; Object.keys(MT).forEach(t=>{ if(t==='out') return; const n=owned(t); if(n) p[t]=n; }); return p; }

/* ---------- mode ---------- */
const playMode=()=>store.get('mode',null);                 // 'ear' | 'scope' | null (not chosen yet)
const peeked=id=>!!(store.get('peek',{})[id]);
function setPeek(id,on){ const p=store.get('peek',{}); if(on) p[id]=1; else delete p[id]; store.set('peek',p); }
/* Is this gig attempt still earning the by-ear bonus? */
const earBonusLive=()=>S.L&&!S.sandbox&&S.byEar&&!peeked(S.L.id);
function applyMode(){
  const c=$('#compare'); if(c) c.classList.toggle('byEar',!!S.byEar&&!S.sandbox);
  document.querySelectorAll('#modeSeg [data-m]').forEach(b=>{ const on=(b.dataset.m==='ear')===!!S.byEar; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
  const mb=$('#modeBtn'); if(mb){ mb.classList.toggle('on',!!S.byEar); mb.setAttribute('aria-pressed',!!S.byEar); mb.title=S.byEar?'By ear: graphs hidden. Tap to show the scope.':'Scope on. Tap to play by ear.'; }
  const pi=$('#payInfo'); if(pi) pi.innerHTML=payLine();
}
function payLine(){
  if(!S.L||S.sandbox) return ''; const L=S.L, have=paidFor(L.id), ear=earPay(L), base=basePay(L);
  if(earBonusLive()) return have>=ear?`By ear · paid in full (${money(ear)})`:`By ear · pays <b>${money(ear)}</b> (${earMult(L)}×)`;
  if(S.byEar) return `By ear · bonus used: <a href="#" id="payReset">reset the rack</a> to earn ${money(ear)}`;
  return have>=base?`Scope · paid ${money(have)}`:`Scope · pays ${money(base)} · by ear ${money(ear)}`;
}
function setByEar(on){
  if(!S.L||S.sandbox||on===!!S.byEar) return;
  if(!on&&earBonusLive()&&paidFor(S.L.id)<earPay(S.L)){ confirmPeek(); return; }
  S.byEar=on; store.set('mode',on?'ear':'scope'); if(!on) setPeek(S.L.id,true);
  applyMode(); updateCompare(); requestAnimationFrame(()=>{ document.querySelectorAll('canvas.plot').forEach(cv=>{ try{ setupCanvas(cv); }catch(_){} }); drawPlots(); });
}
function confirmPeek(){
  const L=S.L, sh=$('#sheet'); sh.hidden=false;
  sh.innerHTML=`<div class="sheetCard modeCard"><div class="shHead"><span class="shTitle">SHOW THE SCOPE?</span></div>
    <p>The graphs and hints make this easier, but the client pays by-ear work better: <b>${money(earPay(L))}</b> by ear, <b>${money(basePay(L))}</b> with the scope.</p>
    <p class="dim">Once you look, this attempt pays the scope rate. Reset the rack (Settings) for a fresh by-ear attempt.</p>
    <div class="modeBtns"><button class="btn" id="mpKeep">Keep listening</button><button class="btn primary" id="mpShow">Show the scope</button></div></div>`;
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; };
  $('#mpKeep').onclick=close; sh.onclick=e=>{ if(e.target===sh) close(); };
  $('#mpShow').onclick=()=>{ close(); setPeek(L.id,true); S.byEar=false; store.set('mode','scope'); applyMode(); updateCompare(); requestAnimationFrame(()=>{ document.querySelectorAll('canvas.plot').forEach(cv=>{ try{ setupCanvas(cv); }catch(_){} }); drawPlots(); }); };
}
/* First gig ever: choose how to play. */
function chooseModeSheet(then){
  const sh=$('#sheet'); sh.hidden=false;
  sh.innerHTML=`<div class="sheetCard modeCard"><div class="shHead"><span class="shTitle">HOW DO YOU WANT TO PLAY?</span></div>
    <p>Every gig has a reference sound to match. You can switch any time in a gig.</p>
    <div class="modePick">
      <button class="modeOpt" data-m="ear"><b>By ear</b><span>No graphs, no hints about the sound. Just your ears and the match %. Pays <b>2–3×</b>.</span><em>For a challenge</em></button>
      <button class="modeOpt" data-m="scope"><b>With the scope</b><span>See your sound next to the target: waveform, loudness and spectrum, plus hints. Normal pay.</span><em>Best to start</em></button>
    </div>
    <p class="dim">Pay buys modules for your own studio rack (Free Jam) and new looks for your gear.</p></div>`;
  sh.querySelectorAll('.modeOpt').forEach(b=>b.onclick=()=>{ store.set('mode',b.dataset.m); sh.hidden=true; sh.innerHTML=''; then&&then(); });
}
function modeOnLevel(){
  if(S.sandbox){ S.byEar=false; applyMode(); return; }
  const m=playMode(); S.byEar=m==='ear'; applyMode();
  if(!m) chooseModeSheet(()=>{ S.byEar=playMode()==='ear'; applyMode(); updateCompare(); });
}
/* Pay on Send: returns {paid, total, byEar, topUp}. */
function payGig(L){
  const prev=paidFor(L.id), now=earBonusLive()?earPay(L):basePay(L), total=Math.max(prev,now);
  return {paid:total-prev, total, byEar:earBonusLive(), topUp:prev>0&&total>prev, mult:earMult(L)};
}

/* ---------- your studio: modules and themes ---------- */
function applyTheme(){ const t=studio().theme; document.body.dataset.theme=t&&t!=='dusty'?t:'';
  const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=getComputedStyle(document.body).getPropertyValue('--top2').trim()||'#15110e'; }
/* small faceplate icons for the studio tiles */
function modIcon(t){ const m=MT[t], nk=Math.min(4,(m.params||[]).length||1), nj=Math.min(4,(m.ins||[]).length+(m.outs||[]).length||1);
  const knobs=Array.from({length:nk},(_,i)=>{ const x=nk===1?24:10+i*(28/(nk-1)); return `<circle cx="${x}" cy="27" r="4.2" fill="#14110f" stroke="#8a7a66" stroke-width="1"/><line x1="${x}" y1="27" x2="${x}" y2="23.4" stroke="#e9dcc6" stroke-width="1.2"/>`; }).join('');
  const jacks=Array.from({length:nj},(_,i)=>{ const x=nj===1?24:10+i*(28/(nj-1)); return `<circle cx="${x}" cy="44" r="3" fill="#0b0908" stroke="#b7a88f" stroke-width="1"/>`; }).join('');
  return `<svg class="tIcon" viewBox="0 0 48 56" aria-hidden="true"><rect x="2" y="2" width="44" height="52" rx="4" fill="#2b2520" stroke="#4a3f35"/><rect x="2" y="2" width="44" height="11" rx="4" style="fill:${m.color}"/><rect x="2" y="9" width="44" height="4" style="fill:${m.color}"/>${knobs}<line x1="6" y1="36" x2="42" y2="36" stroke="#3a312a"/>${jacks}</svg>`; }
function themeIcon(th){ const [a,b,c]=th.sw;
  return `<svg class="tIcon" viewBox="0 0 48 56" aria-hidden="true"><defs><linearGradient id="tg-${th.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect x="2" y="2" width="44" height="52" rx="4" fill="url(#tg-${th.id})" stroke="${c}" stroke-width="${th.id==='walnut'?4:1.2}"/><line x1="4" y1="13" x2="44" y2="13" stroke="${c}"/>
    <circle cx="15" cy="26" r="4.5" fill="#14110f" stroke="#8a7a66"/><circle cx="33" cy="26" r="4.5" fill="#14110f" stroke="#8a7a66"/><circle cx="15" cy="43" r="3" fill="#0b0908" stroke="#b7a88f"/><circle cx="33" cy="43" r="3" fill="#0b0908" stroke="#b7a88f"/></svg>`; }
let STUDIO_TAB='mods';
function openStudio(tab){
  const sh=$('#sheet'); sh.hidden=false; if(typeof tab==='string') STUDIO_TAB=tab;
  const render=()=>{ const st=studio(), w=wallet(), keep=sh.querySelector('.studioGrid:not([hidden])')?.scrollTop||0;
    const mods=Object.keys(MT).filter(t=>t!=='out').sort((a,b)=>MT[a].cost-MT[b].cost).map(t=>{ const n=owned(t), can=w>=MT[t].cost&&n<MAX_OWN;
      return `<div class="tile${n?' have':''}" title="${MT[t].long}">${n?`<span class="tOwn">×${n}</span>`:''}${modIcon(t)}<b>${MT[t].name}</b><small>${MT[t].long}</small>
        <button class="btn${can?'':' dim'}" data-buy="${t}" ${can?'':'disabled'}>${n>=MAX_OWN?'Full':money(MT[t].cost)}</button></div>`; }).join('');
    const themes=THEMES.map(th=>{ const have=st.themes.includes(th.id), on=st.theme===th.id, can=!have&&w>=th.price;
      return `<div class="tile theme${on?' on':''}" title="${th.blurb}">${themeIcon(th)}<b>${th.name}</b><small>${th.blurb}</small>
        ${on?'<span class="tUse">IN USE</span>':have?`<button class="btn" data-use="${th.id}">Use</button>`:`<button class="btn${can?'':' dim'}" data-theme="${th.id}" ${can?'':'disabled'}>${money(th.price)}</button>`}</div>`; }).join('');
    const nOwn=Object.values(st.owned).reduce((a,b)=>a+b,0);
    sh.innerHTML=`<div class="sheetCard studioCard"><div class="shHead"><span class="shTitle">YOUR STUDIO</span><button class="btn primary" id="shDone">Done</button></div>
      <div class="wallet"><div id="walletTap"><small>WALLET</small><b>${money(w)}</b></div><div><small>EARNED</small><b>${money(earned())}</b></div><div><small>SPENT</small><b>${money(st.spent)}</b></div></div>
      <div class="stTabs" role="tablist"><button role="tab" data-tab="mods" aria-selected="${STUDIO_TAB==='mods'}">Modules${nOwn?` <i>${nOwn}</i>`:''}</button><button role="tab" data-tab="themes" aria-selected="${STUDIO_TAB==='themes'}">Panel themes <i>${st.themes.length}/${THEMES.length}</i></button></div>
      <div class="studioGrid" data-pane="mods" ${STUDIO_TAB==='mods'?'':'hidden'}><p class="dim gridNote">Your <b>Free Jam</b> rack holds the starter modules plus everything you buy here. Playing by ear pays 2–3×.</p>${mods}</div>
      <div class="studioGrid" data-pane="themes" ${STUDIO_TAB==='themes'?'':'hidden'}><p class="dim gridNote">A new look for every module in the game.</p>${themes}</div>
      <small class="dataNote">Saved on this device only. Prices are roughly what the real modules cost new.</small></div>`;
    const g=sh.querySelector('.studioGrid:not([hidden])'); if(g) g.scrollTop=keep;
    $('#shDone').onclick=close;
    let taps=[]; $('#walletTap').onclick=()=>{ const n=Date.now(); taps=taps.filter(t=>n-t<2500).concat(n); if(taps.length<5||sh.querySelector('.cheatIn')) return; taps=[];
      const f=document.createElement('form'); f.className='cheatBox'; f.innerHTML='<input class="cheatIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Got a code?"><button class="btn">OK</button>';
      sh.querySelector('.wallet').after(f); const i=f.querySelector('input'); i.focus();
      f.onsubmit=ev=>{ ev.preventDefault(); if(i.value.trim().toLowerCase().replace(/\s+/g,'')===CHEAT) moogMoney(); else { toast('Nothing happens.'); f.remove(); } }; };
    sh.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ STUDIO_TAB=b.dataset.tab; sh.querySelector('.studioGrid:not([hidden])').scrollTop=0; render(); });
    sh.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const t=b.dataset.buy, s2=studio(); if(wallet()<MT[t].cost||owned(t)>=MAX_OWN) return;
      s2.owned[t]=(s2.owned[t]||0)+1; s2.spent+=MT[t].cost; store.set('studio',s2); Haptics.success&&Haptics.success(); toast(`Bought a ${MT[t].name} for your studio`); render(); });
    sh.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{ const th=THEMES.find(x=>x.id===b.dataset.theme), s2=studio(); if(wallet()<th.price) return;
      s2.themes.push(th.id); s2.spent+=th.price; s2.theme=th.id; store.set('studio',s2); applyTheme(); toast(`${th.name} panels fitted`); render(); });
    sh.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{ const s2=studio(); s2.theme=b.dataset.use; store.set('studio',s2); applyTheme(); render(); });
  };
  const close=()=>{ sh.hidden=true; sh.innerHTML=''; if(!$('#screenBoard').hidden) showBoard(); else if(S.sandbox){ S.palette=studioPalette(); renderPalette(); } };
  sh.onclick=e=>{ if(e.target===sh) close(); };
  render();
}
/* Secret code: type MOOGMONEY anywhere (or tap the wallet five times on a phone) for enough money to buy everything left. */
const CHEAT='moogmoney';
function cheatCost(){ const st=studio(); let need=0; Object.keys(MT).forEach(t=>{ if(t!=='out') need+=(MAX_OWN-owned(t))*MT[t].cost; }); THEMES.forEach(th=>{ if(!st.themes.includes(th.id)) need+=th.price; }); return Math.max(0,need-wallet()); }
function moogMoney(){ const add=cheatCost(), s2=studio(); s2.gift=(s2.gift||0)+add; store.set('studio',s2); Haptics.success&&Haptics.success();
  toast(add?`MOOG MONEY! ${money(add)} in the wallet. Everything is affordable now.`:'MOOG MONEY! You already have enough for everything.');
  if($('.studioCard')) openStudio(); else if(!$('#screenBoard').hidden) showBoard(); return add; }
let cheatBuf='';
document.addEventListener('keydown',e=>{ if(e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1) return; const tg=e.target; if(tg&&(tg.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))&&!tg.classList.contains('cheatIn')) return;
  cheatBuf=(cheatBuf+e.key.toLowerCase()).slice(-CHEAT.length); if(cheatBuf===CHEAT){ cheatBuf=''; moogMoney(); } });
applyTheme();
