// npm test: scoring calibration, every gig opens cleanly (desktop + phone), every gig is solvable.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = pathToFileURL(join(ROOT, 'index.html')).href;
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) failures++; };

// Expected score bands for the self-test variants (see js/selftest.js). Key: "gig|change".
const BANDS = {
  // exact
  'dial-tone|EXACT': [99.9, 100],
  // clearly wrong: wrong pitch, waveform or filter type
  'dial-tone|o.oct=0': [0, 15], 'dial-tone|o.semi=1': [0, 15], 'dial-tone|o.wave=triangle': [0, 45],
  'shape|o.wave=square': [0, 40], 'shape|o.wave=triangle': [0, 40], 'shape|o.wave=sine': [0, 30],
  'pixel-knight|o.semi=6': [0, 15], 'pixel-knight|o.semi=5': [0, 15], 'pixel-knight|o.oct=0': [0, 15],
  'payphone|f.type=lowpass': [0, 40], 'snare|f.type=lowpass': [0, 40], 'kick|o.pitchAmt=0': [0, 45],
  // close enough to pass
  'thin-walls|f.cutoff=520': [92, 100], 'thin-walls|f.cutoff=560': [90, 100], 'squelch|f.res=0.7': [90, 100],
  'wow-bass|f.cutAmt=3400': [90, 100], 'slow-bloom|e.a=0.7': [90, 100], 'vibrato|l.rate=5.4': [90, 100],
  'vibrato|o.pitchAmt=45': [90, 100], 'wobble|l.rate=3.05': [90, 100],
  // near misses: close, but should not pass
  'thin-walls|f.cutoff=800': [70, 89.9], 'squelch|f.cutoff=1200': [55, 89.9], 'pluck|e.d=0.5': [35, 80],
  'vibrato|l.rate=5': [70, 89.9],
  // new chapters
  'air|f.type=lowpass': [0, 30], 'hat|f.type=lowpass': [0, 30], 'cowbell|o2.semi=0': [0, 45],
  'breathing|e.a=0.5': [90, 100], 'sub|e.a=0.03': [90, 100], 'ufo|l.rate=7.1': [80, 95], 'wobble|l.rate=3.3': [60, 89.9], 'supersaw|o.fine=0,o2.fine=0': [40, 89.9],
  // mixer, harmonics, FM, effects, strings, random
  'notch|f.type=bandpass': [0, 40], 'notch|f.cutoff=700': [65, 89.9], 'swell|f.cutAmt=4200': [0, 75], 'sub-layer|m.l2=0.5': [0, 75],
  'build-square|h.h3=0.3': [93, 100], 'build-square|h.h5=0': [40, 85], 'metal-ring|m.semi=7': [0, 35], 'fm-bell|m.semi=7': [0, 35], 'epiano|me.d=1.2': [0, 60],
  'slapback|d.time=0.16': [0, 65], 'canyon|d.time=0.25': [0, 50], 'chorus|d.modAmt=0.004': [40, 85], 'fuzz|d.drive=1': [0, 60], 'fuzz|d.drive=13': [90, 100],
  // advanced tier: sync, ring, function generator, mod VCA, folder, low-pass gate, key tracking
  'first-steps|q.s2=5': [0, 80], 'slide|q.glide=0': [0, 60], 'warehouse|q.bpm=120': [0, 70],
  'torn-edge|s.ratio=2': [0, 50], 'sync-sweep|s.sweepAmt=2': [0, 85], 'robot-voice|b.semi=5': [0, 45], 'strike-once|f.fall=0.4': [0, 50],
  'late-vibrato|o.pitchAmt=60': [0, 85], 'fold|f.fold=2.5': [0, 45], 'fold|f.fold=3.3': [90, 100], 'bonk|e.d=0.15': [0, 60], 'bonk|e.d=0.27': [90, 100], 'even-keel|f.track=0': [0, 75],
  'ks-string|d.tone=3000': [0, 70], 'ks-string|d.fb=0.95': [70, 89.9], 'robot|f.type=lowpass': [0, 65],
};

const { page, close } = await launch();
try {
  console.log('\nScoring calibration');
  await page.open(URL + '#selftest');
  const res = await page.waitFor('window.__selftest', 180000);
  const byKey = Object.fromEntries(res.map(r => [`${r.id}|${r.change}`, r.score]));
  for (const [k, [lo, hi]] of Object.entries(BANDS)) {
    const v = byKey[k]; ok(v != null && v >= lo && v <= hi, `${k.padEnd(34)} ${v == null ? 'missing' : v.toFixed(1)}  (expect ${lo}–${hi})`);
  }
  const tw = ['520', '560', '640', '800', '2000'].map(c => byKey[`thin-walls|f.cutoff=${c}`]);
  ok(tw.every((v, i) => i === 0 || v < tw[i - 1]), `score falls as cutoff moves away (${tw.map(v => v.toFixed(0)).join(' > ')})`);

  for (const vp of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'phone', width: 390, height: 664, mobile: true }]) {
    console.log(`\nEvery gig opens cleanly · ${vp.name}`);
    await page.open(URL, vp);
    await page.waitFor("document.querySelector('.gig')");
    const report = await page.evaluate(`(async()=>{
      const out=[];
      for(let i=-1;i<LEVELS.length;i++){
        LEVELS.concat([SANDBOX]).forEach(L=>store.del('draft2.'+L.id));
        openLevel(i); closeSide(); for(let t=0;t<100&&!S.mine;t++) await new Promise(r=>setTimeout(r,50));
        const vpR=document.querySelector('#viewport').getBoundingClientRect(), o=document.querySelector('.module[data-id="out"]').getBoundingClientRect();
        const outVisible=o.left>=vpR.left-1&&o.right<=vpR.right+1&&o.top>=vpR.top-1&&o.bottom<=vpR.bottom+1;
        const cmp=document.querySelector('#compare').getBoundingClientRect();
        out.push({i,id:S.L.id,outVisible,compareVisible:cmp.height>40&&cmp.width>200,analysed:!!S.mine});
      }
      showBoard(); return out; })()`);
    for (const r of report) ok(r.outVisible && r.compareVisible && r.analysed, `${r.id.padEnd(13)} OUTPUT in view, compare panel visible, analysis ran`);
    const errs = page.errors(); ok(errs.length === 0, `no page errors${errs.length ? ': ' + errs.join(' | ') : ''}`);
  }

  for (const vp of [{ name: 'iPhone 13', width: 390, height: 664, mobile: true }, { name: 'iPhone SE/mini', width: 375, height: 600, mobile: true }]) {
    console.log(`\nPhone layout · ${vp.name}`);
    await page.open(URL, vp);
    await page.waitFor("document.querySelector('.gig')");
    const ph = await page.evaluate(`(async()=>{ store.set('keysOpen',true); const res={}; const wide=()=>document.documentElement.scrollWidth<=innerWidth+1;
      res.boardFits=wide();
      for(const id of ['dial-tone','pluck','stadium']){ store.del('draft2.'+id); openLevel(LEVELS.findIndex(l=>l.id===id)); closeSide(); await new Promise(r=>setTimeout(r,300)); if(!wide()) res['noSideScroll_'+id]=false; }
      res.noSideScroll=Object.keys(res).every(k=>!k.startsWith('noSideScroll_')); Object.keys(res).filter(k=>k.startsWith('noSideScroll_')).forEach(k=>delete res[k]);
      res.keysStartHidden=document.querySelector('#keysDock').hidden;
      const inView=sel=>{ const r=document.querySelector(sel).getBoundingClientRect(); return r.width>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight; };
      res.controlsInView=['#pT','#pY','#btnSubmit','#btnHelp','#keysBtn','#focusBtn','#briefBtn','#btnSettings','#btnHome'].every(inView);
      res.boardTall=document.querySelector('#viewport').clientHeight>=0.45*innerHeight;
      setKeysOpen(true); await new Promise(r=>setTimeout(r,200)); res.keysCloseInView=inView('#kbClose');
      document.querySelector('#kbClose').click(); res.keysClose=document.querySelector('#keysDock').hidden;
      openSettings(); res.settingsHaptics=!!document.querySelector('#stHapSw')&&!document.querySelector('#stHapTest')&&!!document.querySelector('#stKeys'); document.querySelector('#shDone').click();
      showBoard(); return res; })()`);
    for (const [k, v] of Object.entries(ph)) ok(v, `phone: ${k}`);
  }

  for (const vp of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'phone', width: 390, height: 664, mobile: true }]) {
    console.log(`\nFocus mode · ${vp.name}`);
    await page.open(URL, vp);
    await page.waitFor("document.querySelector('.gig')");
    const f = await page.evaluate(`(async()=>{ store.del('draft2.wow-bass'); openLevel(LEVELS.findIndex(l=>l.id==='wow-bass')); closeSide();
      for(let t=0;t<100&&!S.mine;t++) await new Promise(r=>setTimeout(r,50));
      const area0=S.view.s; setFocus(true); await new Promise(r=>setTimeout(r,400));
      const vis=(sel,w=100,h=30)=>{ const r=document.querySelector(sel).getBoundingClientRect(); return r.width>w&&r.height>h&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth; };
      const vpR=document.querySelector('#viewport').getBoundingClientRect(), o=document.querySelector('.module[data-id="out"]').getBoundingClientRect();
      const fb=document.querySelector('#focusBtn').getBoundingClientRect();
      const r={topbarHidden:document.querySelector('.topbar').offsetHeight===0, scope:vis('#cScope'), loud:vis('#cEnv'), play:vis('#pT',40,20)&&vis('#pY',40,20),
        out:o.left>=vpR.left-1&&o.right<=vpR.right+1&&o.top>=vpR.top-1&&o.bottom<=vpR.bottom+1, exitVisible:fb.right<=innerWidth&&fb.left>=0, zoom:S.view.s>=area0-0.01};
      setFocus(false); await new Promise(r=>setTimeout(r,200)); r.restored=!document.body.classList.contains('focus')&&document.querySelector('.topbar').offsetHeight>0;
      showBoard(); return r; })()`);
    for (const [k, v] of Object.entries(f)) ok(v, `focus: ${k}`);
  }

  console.log('\nEvery gig is solvable with its reference patch');
  await page.open(URL, { width: 1280, height: 800 });
  await page.waitFor("document.querySelector('.gig')");
  const solved = await page.evaluate(`(async()=>{
    const out=[];
    for(let i=0;i<LEVELS.length;i++){
      store.del('draft2.'+LEVELS[i].id); openLevel(i); const L=S.L;
      if(!L._tA) L._tA=analyze(await renderPatch(targetPatch(L),L));
      const fresh=levelCompare(L,L._tA,analyze(await renderPatch(S.patch,L))).overall;
      const t=targetPatch(L);
      const fits=t.modules.length-1<=S.slots-1;
      let slot=0; t.modules.forEach(m=>{ m.slot = m.type==='out' ? S.slots-1 : slot++; });
      S.patch=t; renderRack();
      const presetsOk=(L.start||[]).every(s=>Number.isInteger(s.slot)&&s.slot<S.slots-1);
      const xm=await renderPatch(S.patch,L); if(!L._tA) L._tA=analyze(await renderPatch(targetPatch(L),L));
      const c=levelCompare(L,L._tA,analyze(xm));
      out.push({id:L.id,fits,presetsOk,score:c.overall,missing:missing().length,fresh});
    }
    LEVELS.forEach(L=>store.del('draft2.'+L.id)); showBoard(); return out; })()`);
  for (const r of solved) ok(r.fits && r.presetsOk && r.score >= 99.9 && r.missing === 0 && r.fresh < 80,
    `${r.id.padEnd(13)} fits the board, presets valid, reference scores ${r.score.toFixed(1)}%, untouched rack scores ${r.fresh.toFixed(0)}%`);

  console.log('\nHelp can rescue every gig from an untouched rack');
  await page.open(URL, { width: 1280, height: 800 });
  await page.waitFor("document.querySelector('.gig')");
  const rescued = await page.evaluate(`(async()=>{
    const out=[];
    for(let i=0;i<LEVELS.length;i++){
      store.del('draft2.'+LEVELS[i].id); openLevel(i); const L=S.L;
      const need={}; L.target.mods.forEach(m=>need[m.type]=(need[m.type]||0)+1);
      const paletteOk=Object.entries(need).every(([t,n])=>(L.palette[t]||0)>=n);
      if(!L._tA) L._tA=analyze(await renderPatch(targetPatch(L),L));
      let steps=0, score=0;
      for(;steps<25;steps++){ score=levelCompare(L,L._tA,analyze(await renderPatch(S.patch,L))).overall; if(score>=PASS) break; if(!(await autoHelp())) break; }
      out.push({id:L.id,paletteOk,steps,score});
    }
    LEVELS.forEach(L=>store.del('draft2.'+L.id)); progress.helped={}; showBoard(); return out; })()`);
  for (const r of rescued) ok(r.paletteOk && r.score >= 90 && r.steps <= 16, `${r.id.padEnd(13)} palette has the parts; passes after ${r.steps} help step(s) (${r.score.toFixed(0)}%)`);

  console.log('\nThe end-of-gig jingle is the demo song on the player\'s patch');
  const same = await page.evaluate(`(async()=>{ const out=[]; for(const id of ['acid','glass','kick','harp']){ const L=LEVELS.find(l=>l.id===id)||LEVELS[0];
      const a=await renderJingle(targetPatch(L),L), b=await renderSong(targetPatch(L),L); let d=0; for(let i=0;i<Math.min(a.length,b.length);i++) d=Math.max(d,Math.abs(a[i]-b[i]));
      out.push({id:L.id,d,len:a.length===b.length}); } return out; })()`);
  ok(same.every(x => x.len && x.d < 1e-6), `jingle and ♫ Song render identically (${same.map(x => x.id).join(', ')}); every song's audibility is checked below`);
  const modal = await page.evaluate(`(async()=>{ const i=LEVELS.findIndex(l=>l.id==='pluck'); store.del('draft2.pluck'); openLevel(i);
    const t=targetPatch(S.L); let k=0; t.modules.forEach(m=>{ m.slot=m.type==='out'?S.slots-1:k++; }); S.patch=t; renderRack(); scheduleAnalyze();
    for(let n=0;n<60&&!(S.cmp&&S.cmp.overall>=PASS);n++) await new Promise(r=>setTimeout(r,50));
    submit(); await new Promise(r=>setTimeout(r,900));
    const dots=document.querySelectorAll('#jDots i').length, playing=!!jingleNow; document.querySelector('#mStay').click(); const stopped=!jingleNow;
    delete progress.solved.pluck; saveProgress(); showBoard(); return {dots,playing,stopped}; })()`);
  console.log('\nEvery gig has an audible demo song on its patch');
  const songs = await page.evaluate(`(async()=>{ const out=[];
    for(const L of LEVELS){ const x=await renderSong(targetPatch(L),L); let peak=0, nan=false;
      for(let i=0;i<x.length;i++){ const v=x[i]; if(v!==v){ nan=true; break; } const a=Math.abs(v); if(a>peak) peak=a; }
      out.push({id:L.id,peak,nan,secs:songLength(L,targetPatch(L))}); }
    return out; })()`);
  for (const j of songs) ok(!j.nan && j.peak > 0.01 && j.peak < 4 && j.secs > 2 && j.secs < 9, `${j.id.padEnd(13)} song peak ${j.peak.toFixed(2)}, ${j.secs.toFixed(1)}s`);
  const songMode = await page.evaluate(`(async()=>{ const i=LEVELS.findIndex(l=>l.id==='acid'); openLevel(i);
    setSongMode(true); playTarget(); const t=!!songNow&&$('#pT').classList.contains('lit'); playYours(); const y=!!songNow&&$('#pY').classList.contains('lit');
    setSongMode(false); const off=!songNow; playTarget(); const note=!songNow&&oneShots.length===1; stopOneShots(); showBoard(); return {t,y,off,note}; })()`);
  ok(songMode.t && songMode.y, 'with ♫ Song on, ▶ Target and ▶ Yours play the demo song');
  ok(songMode.off && songMode.note, 'turning ♫ Song off stops it and goes back to single notes');
  const groups = await page.evaluate(`(async()=>{ openLevel(LEVELS.findIndex(l=>l.id==='acid')); const q=s=>document.querySelector(s), vis=e=>!!e&&getComputedStyle(e).display!=='none';
    const listen=q('.cmpTop .grp.listen'), score=q('.cmpTop .grp.score');
    const ok1=listen&&listen.contains(q('#pT'))&&listen.contains(q('#pY'))&&listen.contains(q('#playSeg'))&&score.contains(q('#btnSubmit'))&&score.contains(q('#btnHelp'))&&score.contains(q('#pct'));
    const viewOnly=[...q('.viewGrp').children].every(b=>['songBtn','keysBtn','focusBtn'].includes(b.id))&&!q('#clearBtn')&&!vis(q('#songBtn'));
    q('#playSeg [data-m=song]').click(); await new Promise(r=>setTimeout(r,40)); const segOn=S.songMode&&q('#playSeg [data-m=song]').classList.contains('on');
    q('#playSeg [data-m=note]').click(); await new Promise(r=>setTimeout(r,40)); const segOff=!S.songMode&&q('#playSeg [data-m=note]').classList.contains('on');
    setFocus(true); await new Promise(r=>setTimeout(r,100)); const fr=q('.cmpTop').getBoundingClientRect(), lr=listen.getBoundingClientRect(), sr=score.getBoundingClientRect();
    const focusRow=sr.left>=lr.right-1&&Math.abs((sr.top+sr.bottom)/2-(lr.top+lr.bottom)/2)<30; setFocus(false); showBoard(); return {ok1,viewOnly,segOn,segOff,focusRow}; })()`);
  ok(groups.ok1, 'the compare panel groups Listen (▶ Target, ▶ Yours, Note | Song) apart from Score (match, Send, Help)');
  ok(groups.viewOnly, 'the toolbar\'s right side holds only view switches (Keys, Focus); Reset lives in Settings');
  ok(groups.segOn && groups.segOff, 'the Note | Song switch sets what ▶ plays');
  ok(groups.focusRow, 'in focus mode Listen and Score sit side by side in the compare bar');
  ok(modal.dots >= 4 && modal.playing && modal.stopped, `result screen plays the client's song on your patch (${modal.dots} note markers) and stops it when closed`);

  console.log('\nHaptics on a phone');
  await page.open(URL, { width: 390, height: 664, mobile: true });
  await page.waitFor("document.querySelector('.gig')");
  const hap = await page.evaluate(`(async()=>{ const calls=[]; navigator.vibrate=p=>{ calls.push(p); return true; }; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    store.del('draft2.thin-walls'); openLevel(LEVELS.findIndex(l=>l.id==='thin-walls')); closeSide(); const res={available:Haptics.available};
    let n=calls.length; addModule('osc'); await wait(120); res.addModule=calls.length>n;
    const o=S.patch.modules.find(m=>m.type==='osc'); n=calls.length;
    const tap=el=>{ const r=el.getBoundingClientRect(); const e={bubbles:true,clientX:r.left+6,clientY:r.top+6,pointerId:7,pointerType:'touch'}; el.dispatchEvent(new PointerEvent('pointerdown',e)); window.dispatchEvent(new PointerEvent('pointerup',e)); };
    tap(document.querySelector('.port[data-mod="'+o.id+'"][data-dir="out"]')); await wait(80); tap(document.querySelector('.port[data-mod="out"][data-dir="in"]')); await wait(80);
    res.plug=S.patch.cables.length===1&&calls.length>=n+2;
    const k=document.querySelector('.module[data-id="'+o.id+'"] [data-param="oct"]'); const r=k.getBoundingClientRect();
    k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:8,pointerType:'touch'}));
    k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:8,pointerType:'touch'}));
    n=calls.length; for(let q=0;q<3;q++){ document.querySelectorAll('.shBtns .shBtn')[2].click(); await wait(60); } res.knob=calls.length>=n+3&&o.params.oct===3;
    document.querySelector('#shDone').click(); for(let q=0;q<60&&!S.cmp;q++) await wait(50); await wait(400); n=calls.length; S.wasOk=false; S.cmp={...S.cmp,overall:95}; updateCompare(); res.pass=calls.length>n;
    Haptics.set(false); n=calls.length; addModule('filter'); await wait(80); res.toggleOff=calls.length===n; Haptics.set(true);
    store.del('draft2.thin-walls'); showBoard(); return res; })()`);
  for (const [k, v] of Object.entries(hap)) ok(v, `haptics: ${k}`);

  console.log('\nHaptics on iPhone (no vibrate(): switch haptic only during a real gesture)');
  await page.addInitScript(`Object.defineProperty(Navigator.prototype,'vibrate',{value:undefined,configurable:true});
    window.__sw=0; const oc=HTMLLabelElement.prototype.click; HTMLLabelElement.prototype.click=function(){ if(this.querySelector('input[switch]')) window.__sw++; return oc.call(this); };
    window.__swToggles=0; document.addEventListener('change',e=>{ if(e.target.classList&&e.target.classList.contains('hapSw')) window.__swToggles++; },true);`);
  await page.open(URL, { width: 390, height: 664, mobile: true });
  await page.waitFor("document.querySelector('.gig')");
  const ios1 = await page.evaluate(`(async()=>{ await new Promise(r=>setTimeout(r,6000)); const before=__sw; Haptics.select(); return {noVibrate:typeof navigator.vibrate!=='function', continuous:Haptics.continuous, noGesture:__sw===before}; })()`);
  ok(ios1.noVibrate && ios1.continuous === false, 'iPhone mode: no vibrate(), no continuous drag ticks');
  ok(ios1.noGesture, 'no haptic is attempted without a live user gesture');
  const still = await page.evaluate(`(async()=>{ store.del('draft2.squelch'); openLevel(LEVELS.findIndex(l=>l.id==='squelch')); closeSide(); const tops=new Set();
    for(let k=0;k<24;k++){ tops.add(Math.round(document.querySelector('.palBtn').getBoundingClientRect().top)); await new Promise(r=>setTimeout(r,50)); } showBoard(); return [...tops]; })()`);
  ok(still.length === 1, `the phone layout holds still while the first analysis lands (toolbar tops seen: ${still.join(', ')})`);
  const pal = await page.evaluate(`(async()=>{ store.del('draft2.thin-walls'); openLevel(LEVELS.findIndex(l=>l.id==='thin-walls')); closeSide(); await new Promise(r=>setTimeout(r,300));
    const b=document.querySelector('.palBtn'); const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,mods:S.patch.modules.length,checked:b.querySelector('input.hapSw').checked}; })()`);
  await page.tap(pal.x, pal.y);
  for (let q = 0; q < 40; q++) { await new Promise(r => setTimeout(r, 50)); if (await page.evaluate(`S.patch.modules.length`) > pal.mods) break; }   // the tap's action runs a tick later; renders can be slow
  await new Promise(r => setTimeout(r, 150));
  const after = await page.evaluate(`(()=>{ const b=document.querySelector('.palBtn'), i=b&&b.querySelector('input.hapSw'); return {mods:S.patch.modules.length, sw:__swToggles}; })()`);
  ok(after.mods === pal.mods + 1, 'a real tap on a module button adds exactly one module (no double click)');
  ok(after.sw >= 1, 'that tap flips the hidden switch under the finger (what makes iOS tick)');
  const cover = await page.evaluate(`(async()=>{ await new Promise(r=>setTimeout(r,300)); const has=sel=>{ const e=document.querySelector(sel); return !!e&&e.tagName==='LABEL'&&!!e.querySelector(':scope > input.hapSw'); };
    const sels=['#pT','#pY','#btnHelp','#btnSubmit','#briefBtn','#keysBtn','#focusBtn','#btnSettings','#btnHome','.palBtn','.port','.knob','.choice label','.slot.empty'];
    const missing=sels.filter(s=>!has(s));
    setKeysOpen(true); await new Promise(r=>setTimeout(r,200)); if(!has('#kbWrap')) missing.push('#kbWrap'); if(!has('#kbClose')) missing.push('#kbClose'); setKeysOpen(false);
    const send=document.querySelector('#btnSubmit'), sendOff=send.getAttribute('aria-disabled')==='true'&&send.querySelector('input.hapSw').disabled;
    Haptics.set(false); const allOff=[...document.querySelectorAll('input.hapSw')].every(i=>i.disabled); Haptics.set(true);
    const someOn=[...document.querySelectorAll('input.hapSw')].some(i=>!i.disabled);
    store.del('draft2.thin-walls'); showBoard(); const cards=has('.gig'); return {missing,sendOff,allOff,someOn,cards}; })()`);
  ok(cover.missing.length === 0, `every tap target carries a switch${cover.missing.length ? ' (missing: ' + cover.missing.join(', ') + ')' : ''}`);
  ok(cover.cards, 'gig cards carry a switch');
  ok(cover.sendOff, 'a disabled Send button does not tick');
  ok(cover.allOff && cover.someOn, 'turning haptics off disables every switch, and on re-enables them');
  const ios2 = await page.evaluate(`(async()=>{ store.del('draft2.thin-walls'); openLevel(LEVELS.findIndex(l=>l.id==='thin-walls')); closeSide(); addModule('filter'); await new Promise(r=>setTimeout(r,300));
    const f=S.patch.modules.find(m=>m.type==='filter'), k=document.querySelector('.module[data-id="'+f.id+'"] [data-param="cutoff"]'), r=k.getBoundingClientRect();
    k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:4,pointerType:'touch'})); k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:4,pointerType:'touch'}));
    const steps=[...document.querySelectorAll('.shBtns .shBtn')], stepsHaveSwitch=steps.length===4&&steps.every(l=>l.tagName==='LABEL'&&l.querySelector('input[switch]'));
    const c0=f.params.cutoff; steps[2].click(); await new Promise(r=>setTimeout(r,60)); const nudged=f.params.cutoff>c0; document.querySelector('#shDone').click();
    openSettings(); const tests=!!document.querySelector('#stHapSw')&&!document.querySelector('#stHapTest'); document.querySelector('#shDone').click();
    store.del('draft2.thin-walls'); showBoard(); return {stepsHaveSwitch,nudged,tests}; })()`);
  ok(ios2.stepsHaveSwitch && ios2.nudged, 'knob editor −/+ are tap targets with a real switch under the finger, and still nudge');
  ok(ios2.tests, 'Settings haptics is a single on/off switch');

  console.log('\nCurriculum structure');
  const cur = await page.evaluate(`(()=>{
    const ids=LEVELS.map(l=>l.id), uniq=new Set(ids).size===ids.length;
    const themesEndInChallenge=CHAPTERS.slice(1).filter(c=>!c.bonus).every(c=>LEVELS[c.levels[c.levels.length-1]].challenge&&c.levels.filter(i=>LEVELS[i].challenge).length===1);
    const every=CHAPTERS.reduce((n,c)=>n+c.levels.length,0)===LEVELS.length;
    const saved=progress; progress={solved:{}};
    const allOpen=LEVELS.every((l,i)=>isUnlocked(i));
    const nextStart=CHAPTERS.every(c=>nextInChapter(c)===c.levels[0]);
    progress.solved[LEVELS[CHAPTERS[2].levels[2]].id]={cost:1,cables:1,match:95};
    const skipAhead=nextInChapter(CHAPTERS[2])===CHAPTERS[2].levels[0]&&!!progress.solved[LEVELS[CHAPTERS[2].levels[2]].id];
    progress=saved; return {uniq,every,themesEndInChallenge,allOpen,nextStart,skipAhead,n:LEVELS.length,chapters:CHAPTERS.length};
  })()`);
  ok(cur.uniq && cur.every, `${cur.n} gigs in ${cur.chapters} chapters, unique ids`);
  ok(cur.themesEndInChallenge, 'every theme (bonus chapters aside) ends with exactly one challenge');
  ok(cur.allOpen, 'every gig is open to a new player');
  ok(cur.nextStart, 'each chapter suggests its first gig as NEXT');
  ok(cur.skipAhead, 'solving a later gig out of order is recorded, and NEXT still points at the earliest unsolved one');

  console.log('\nGig board preview');
  const pv = await page.evaluate(`(async()=>{
    showBoard(); const cards=document.querySelectorAll('.gigWrap'), btns=document.querySelectorAll('.gigWrap > .gigPv');
    const b=btns[3]; b.click(); await new Promise(r=>setTimeout(r,80));
    const playing=!!songNow&&b.classList.contains('lit'), stayed=!$('#screenBoard').hidden&&S.L===null;
    b.click(); const stopped=!songNow&&!b.classList.contains('lit');
    btns[0].click(); btns[1].click(); const switched=!!songNow&&!btns[0].classList.contains('lit')&&btns[1].classList.contains('lit');
    cards[0].querySelector('.gig').click(); await new Promise(r=>setTimeout(r,50)); const opened=S.L&&S.L.id===LEVELS[0].id&&!btns[1].classList.contains('lit');
    const all=btns.length===LEVELS.length; showBoard(); return {all,playing,stayed,stopped,switched,opened}; })()`);
  ok(pv.all, 'every gig card has a ▶ preview button');
  ok(pv.playing && pv.stayed, 'preview plays a demo song on the target patch without opening the gig');
  ok(pv.stopped, 'tapping ▶ again stops the preview');
  ok(pv.switched, 'starting another preview stops the first');
  ok(pv.opened, 'opening a gig stops the preview');

  console.log('\nSound engine (Studio everywhere; ladder filter only where a gig asks for it)');
  const eng = await page.evaluate(`(async()=>{ const out={};
    out.noToggle=!document.querySelector('#engBtn');
    openLevel(LEVELS.findIndex(l=>l.id==='squelch')); out.squelch=ENGINE==='studio'&&STUDIO.ladder===!!(LEVELS.find(l=>l.id==='squelch').studio==='ladder');
    const ai=LEVELS.findIndex(l=>l.id==='acid'); store.del('draft2.acid'); openLevel(ai); out.acid=ENGINE==='studio'&&STUDIO.ladder===true;
    openLevel(LEVELS.findIndex(l=>l.id==='supersaw')); out.saw=STUDIO.ladder===false;
    openLevel(-1); out.jam=ENGINE==='studio'&&STUDIO.ladder===false;
    openLevel(ai); const L=LEVELS[ai], T=targetPatch(L), tA=analyze(await renderPatch(T,L)), sc=async p=>levelCompare(L,tA,analyze(await renderPatch(p,L))).overall;
    out.self=await sc(targetPatch(L));
    const near=targetPatch(L); near.modules.find(m=>m.id==='f').params.cutoff*=Math.pow(2,0.2); out.near=await sc(near);
    const sq=targetPatch(L); sq.modules.find(m=>m.id==='o').params.wave='square'; out.square=await sc(sq);
    const x=await renderPatch(T,L); let pk=0,nan=false; for(const v of x){ if(v!==v) nan=true; pk=Math.max(pk,Math.abs(v)); } out.sane=!nan&&pk>0.05&&pk<2;
    showBoard(); return out; })()`);
  ok(eng.noToggle, 'there is no engine toggle to worry about');
  ok(eng.acid && eng.saw && eng.jam && eng.squelch, 'every gig plays on Studio; the ladder filter is used only where the gig asks for it');
  ok(eng.sane && Math.abs(eng.self - 100) < 0.01, `Studio renders are clean and deterministic (reference scores ${eng.self.toFixed(1)})`);
  ok(eng.near > 75 && eng.near < 95 && eng.square < 60, `Acid Test on the ladder: cutoff +0.2 oct ${eng.near.toFixed(1)}, square ${eng.square.toFixed(1)}`);
  const full = await page.evaluate(`(async()=>{ const res={};
    for(const id of ['acid','glass','warehouse']){ const L=LEVELS.find(l=>l.id===id); openLevel(LEVELS.indexOf(L)); const x=await renderSong(targetPatch(L),L), len=songLength(L,targetPatch(L)), w=Math.floor(SR/4), quiet=[];
      for(let i=0;i+w<len*SR-w;i+=w){ let s=0; for(let j=i;j<i+w;j++) s+=x[j]*x[j]; if(Math.sqrt(s/w)<0.003) quiet.push((i/SR).toFixed(2)); } res[L.id]=quiet; }
    showBoard(); return res; })()`);
  ok(Object.values(full).every(q => !q.length), `long songs play all the way through (silent stretches: ${JSON.stringify(full)})`);

  console.log('\nBack and Forward');
  await page.evaluate(`(()=>{ showBoard(); })()`);
  const r1 = await page.evaluate(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)); const onBoard=()=>!$('#screenBoard').hidden;
    const i=LEVELS.findIndex(l=>l.id==='acid'); openLevel(i); const hash=location.hash;
    history.back(); await w(250); const back=onBoard()&&(location.hash==='#/'||location.hash==='');
    history.forward(); await w(250); const fwd=!onBoard()&&S.L&&S.L.id==='acid';
    const len0=history.length; $('#btnHome').click(); await w(250); const home=onBoard()&&history.length===len0;
    return {hash,back,fwd,home}; })()`);
  ok(r1.hash === '#/gig/acid', 'opening a gig gives it its own address (#/gig/acid)');
  ok(r1.back && r1.fwd, 'browser Back returns to the gig board, and Forward reopens the gig');
  ok(r1.home, '← Gigs steps back through history instead of piling up new entries');
  await page.open(URL + '#/gig/fm-bell', { width: 1280, height: 800 }); await page.waitFor("typeof S!=='undefined'&&S.L&&S.L.id==='fm-bell'", 8000);
  const r2 = await page.evaluate(`(async()=>{ history.back(); await new Promise(r=>setTimeout(r,300)); return !$('#screenBoard').hidden&&location.href.startsWith('file:'); })()`);
  ok(r2, 'a link to a gig opens it directly, with the board underneath so Back stays in the game');
  const data = await page.evaluate(`(async()=>{ showBoard(); progress.solved['dial-tone']={cost:2,match:95}; saveProgress(); openSettings();
    const sum=[...document.querySelectorAll('.setRow')].some(r=>/Your data/.test(r.textContent)&&/only in this browser/.test(r.textContent));
    const w8=()=>new Promise(r=>setTimeout(r,80)); $('#stData').click(); await w8(); const card=$('.dataCard'), txt=card?card.textContent:'';
    const explains=/local storage/.test(txt)&&/nothing is uploaded/.test(txt)&&/1 gig paid/.test(txt);
    $('#dWipe').click(); await w8(); $('#dWipe').click(); await w8(); const wiped=store.keys().length===0&&!Object.keys(progress.solved).length;
    return {sum,explains,wiped,btns:!!$('#dExport')||true}; })()`);
  ok(data.sum && data.explains, 'Settings → Your data explains where progress is stored and what is in it');
  ok(data.wiped, 'Delete everything clears every saved entry');

  console.log('\nMoving modules');
  const mv = await page.evaluate(`(async()=>{ const i=LEVELS.findIndex(l=>l.id==='squelch'); store.del('draft2.squelch'); openLevel(i); addModule('osc'); addModule('filter');
    const freeDefault=store.get('snapOn')==null&&S.snap===false; setSnap(true); const o=S.patch.modules.find(m=>m.type==='osc'), f=S.patch.modules.find(m=>m.type==='filter'); const grip=!!document.querySelector('.module .mhead .grip');
    toggleMove(o); const pick=!!document.querySelector('.module.moving')&&document.querySelectorAll('.slot.moveTarget').length>0&&!!document.querySelector('.module.moveTarget');
    const free=document.querySelector('.slot.moveTarget'), t=+free.dataset.slot; free.click(); await new Promise(r=>setTimeout(r,60)); const moved=o.slot===t&&!S.moving;
    const fs=f.slot; toggleMove(o); document.querySelector('.module.moveTarget').click(); const swapped=o.slot===fs&&f.slot===t&&!S.moving;
    toggleMove(o); toggleMove(o); const cancelled=!S.moving&&!document.querySelector('.moveTarget');
    const outSafe=S.patch.modules.find(m=>m.type==='out').slot===S.slots-1; setSnap(false); store.del('snapOn'); showBoard(); return {grip,pick,moved,swapped,cancelled,outSafe,freeDefault}; })()`);
  ok(mv.grip, 'movable modules show a grip on their name bar');
  ok(mv.freeDefault, 'free placement is the default (Snap starts off)');
  ok(mv.pick && mv.moved, 'tapping a name bar picks the module up; tapping a free slot moves it there');
  ok(mv.swapped, 'tapping another module swaps the two');
  ok(mv.cancelled && mv.outSafe, 'tapping the name bar again cancels, and OUTPUT stays in its slot');

  // Real drags: line the module up with an empty slot but let go a little high, so the pointer (on the name bar)
  // ends in the gap above the slot. The module should still land in that slot, judged by its own centre.
  for (const mob of [false, true]) {
    await page.open(URL, mob ? { width: 390, height: 664, mobile: true } : { width: 1280, height: 800 });
    await page.waitFor("document.querySelector('.gig')");
    const g = JSON.parse(await page.evaluate(`(async()=>{ store.del('draft2.squelch'); openLevel(LEVELS.findIndex(l=>l.id==='squelch')); addModule('osc'); addModule('filter'); closeSide&&closeSide(); setSnap(true);
      await new Promise(r=>setTimeout(r,400)); const o=S.patch.modules.find(m=>m.type==='osc');
      const d=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.name').textContent==='OSC'), h=d.querySelector('.mhead').getBoundingClientRect(), md=d.getBoundingClientRect();
      const free=[...Array(S.slots).keys()].find(i=>i!==S.slots-1&&!occupant(i)&&slotXY(i)[1]>slotXY(o.slot)[1]-1&&i!==o.slot);
      const st=$('#stage').getBoundingClientRect(), [sx,sy]=slotXY(free), [ox,oy]=slotXY(o.slot), k=S.view.s;
      const px=h.left+12, py=h.top+h.height/2, tx=px+(sx-ox)*k, ty=st.top+(sy-8)*k;   // let go 8px above the slot's top edge, in the gap
      return JSON.stringify({free,px,py,tx,ty}); })()`));
    const n = 10;
    if (!mob) {
      await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px, y: g.py });
      await page.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.px, y: g.py, button: 'left', buttons: 1, clickCount: 1 });
      for (let k = 1; k <= n; k++) await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px + (g.tx - g.px) * k / n, y: g.py + (g.ty - g.py) * k / n, button: 'left', buttons: 1 });
      await page.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g.tx, y: g.ty, button: 'left', buttons: 0, clickCount: 1 });
    } else {
      await page.cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.px, y: g.py }] });
      for (let k = 1; k <= n; k++) await page.cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.px + (g.tx - g.px) * k / n, y: g.py + (g.ty - g.py) * k / n }] });
      await page.cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await new Promise(r => setTimeout(r, 250));
    const landed = await page.evaluate(`S.patch.modules.find(m=>m.type==='osc').slot`);
    ok(landed === g.free, `${mob ? 'finger' : 'mouse'} drag lands in the slot the module is lined up with, even when let go a little high (slot ${landed}, wanted ${g.free})`);
  }

  // Free placement: with Snap off a module stays exactly where it's dropped (anywhere, even past the box grid).
  {
    await page.open(URL, { width: 1280, height: 800 }); await page.waitFor("document.querySelector('.gig')");
    const g = JSON.parse(await page.evaluate(`(async()=>{ store.del('draft2.squelch'); openLevel(LEVELS.findIndex(l=>l.id==='squelch')); addModule('osc'); addModule('filter');
      setSnap(false); fitView(); await new Promise(r=>setTimeout(r,300));
      const o=S.patch.modules.find(m=>m.type==='osc'), h=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.name').textContent==='OSC').querySelector('.mhead').getBoundingClientRect();
      const [ox,oy]=modXY(o); return JSON.stringify({px:h.left+12,py:h.top+h.height/2,ox,oy,k:S.view.s}); })()`));
    const dx = 37, dy = 260;   // screen px: lands between and below the boxes
    await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px, y: g.py });
    await page.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.px, y: g.py, button: 'left', buttons: 1, clickCount: 1 });
    for (let k = 1; k <= 8; k++) await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px + dx * k / 8, y: g.py + dy * k / 8, button: 'left', buttons: 1 });
    await page.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g.px + dx, y: g.py + dy, button: 'left', buttons: 0, clickCount: 1 });
    await new Promise(r => setTimeout(r, 250));
    const f = await page.evaluate(`(async()=>{ const o=S.patch.modules.find(m=>m.type==='osc'), d=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.name').textContent==='OSC');
      const at=[o.x,o.y], floating=o.slot===null&&d.classList.contains('floating');
      const grew=S.grid.H>=o.y+SH;
      const freed=emptySlots().length;
      // reopen: position is saved with the patch
      openLevel(LEVELS.findIndex(l=>l.id==='squelch')); const o2=S.patch.modules.find(m=>m.type==='osc'); const kept=o2.slot===null&&o2.x===at[0]&&o2.y===at[1];
      // snap back on: dragging into a box puts it back in the grid
      setSnap(true); const snapPref=store.get('snapOn')===true;
      S.moving=o2.id; const free=emptySlots()[0]; moveModuleTo(free); const boxed=o2.slot===free&&o2.x===undefined;
      // help still works with a floating module present
      o2.slot=null; o2.x=40; o2.y=600; renderRack(); for(let k=0;k<16;k++){ if(!(await autoHelp())) break; }
      const helped=S.patch.modules.filter(m=>m.type!=='out').length>=2;
      return {at,floating,grew,freed,kept,snapPref,boxed,helped}; })()`);
    const want = [Math.round(g.ox + dx / g.k), Math.round(g.oy + dy / g.k)];
    ok(f.floating && Math.abs(f.at[0] - want[0]) <= 1 && Math.abs(f.at[1] - want[1]) <= 1, `with Snap off a dragged module stays where it's dropped (${f.at} vs ${want})`);
    ok(f.grew && f.freed >= 1, 'the board grows to hold it, and the box it left is free again');
    ok(f.kept, 'a free position is saved with the patch');
    ok(f.snapPref && f.boxed, 'with Snap on, moving a floating module puts it back in a box');
    ok(f.helped, 'Help still works when modules float');
  }

  // Up and to the left, past the corner of the box grid: the board grows that way and the module stays exactly
  // where it was let go on screen (it used to be clamped back to the board's edge).
  for (const mob of [false, true]) {
    await page.open(URL, mob ? { width: 390, height: 664, mobile: true } : { width: 1280, height: 800 });
    await page.waitFor("document.querySelector('.gig')");
    const g = JSON.parse(await page.evaluate(`(async()=>{ store.del('draft2.squelch'); store.del('snapOn'); openLevel(LEVELS.findIndex(l=>l.id==='squelch')); addModule('osc'); closeSide&&closeSide(); setSnap(false,false);
      zoomCenter(1/1.6); await new Promise(r=>setTimeout(r,400));
      const h=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.name').textContent==='OSC').querySelector('.mhead').getBoundingClientRect();
      return JSON.stringify({px:h.left+12,py:h.top+h.height/2,hl:h.left,ht:h.top}); })()`));
    const dx = mob ? -45 : -90, dy = mob ? -60 : -80, n = 10;
    if (!mob) {
      await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px, y: g.py });
      await page.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.px, y: g.py, button: 'left', buttons: 1, clickCount: 1 });
      for (let k = 1; k <= n; k++) await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.px + dx * k / n, y: g.py + dy * k / n, button: 'left', buttons: 1 });
      await page.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g.px + dx, y: g.py + dy, button: 'left', buttons: 0, clickCount: 1 });
    } else {
      await page.cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.px, y: g.py }] });
      for (let k = 1; k <= n; k++) await page.cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.px + dx * k / n, y: g.py + dy * k / n }] });
      await page.cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await new Promise(r => setTimeout(r, 300));
    const a = await page.evaluate(`(()=>{ const o=S.patch.modules.find(m=>m.type==='osc'); const h=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.name').textContent==='OSC').querySelector('.mhead').getBoundingClientRect(); return JSON.stringify({hl:h.left,ht:h.top,x:o.x,y:o.y,slot:o.slot}); })()`);
    const r = JSON.parse(a), ex = g.hl + dx, ey = g.ht + dy;
    ok(r.slot === null && r.x < 0 && r.y < 0 && Math.abs(r.hl - ex) < 2 && Math.abs(r.ht - ey) < 2,
      `${mob ? 'finger' : 'mouse'}: a module dragged up and left past the boxes stays exactly where it's let go (off by ${(r.hl - ex).toFixed(1)}, ${(r.ht - ey).toFixed(1)} px)`);
  }
  await page.open(URL, { width: 1280, height: 800 }); await page.waitFor("document.querySelector('.gig')");
  await page.open(URL, { width: 1280, height: 800 }); await page.waitFor("document.querySelector('.gig')");

  console.log('\nGig board browsing');
  const nav = await page.evaluate(`(async()=>{ showBoard(); const q=s=>document.querySelector(s), vis=()=>[...document.querySelectorAll('#gigs .chapter')].filter(x=>!x.hidden).map(x=>x.dataset.ch);
    const chips=[...document.querySelectorAll('#boardNav .bnChip')].map(b=>b.dataset.ch).filter(Boolean);
    const allChips=CHAPTERS.every(c=>chips.includes(c.id))&&chips.includes('jam');
    q('.bnChip[data-ch="fm"]').click(); const one=vis().join()==='fm';
    q('.bnSt[data-st="done"]').click(); const doneEmpty=vis().length===0&&!q('#boardEmpty').hidden;
    progress.solved['metal-ring']={cost:4,match:95}; showBoard(); const doneOne=vis().join()==='fm'&&[...document.querySelectorAll('[data-ch="fm"] .gigWrap')].filter(w=>!w.hidden).length===1;
    q('.bnSt[data-st="todo"]').click(); const todo=[...document.querySelectorAll('[data-ch="fm"] .gigWrap')].filter(w=>!w.hidden).length===3;
    const remembered=store.get('boardView').ch==='fm'&&store.get('boardView').status==='todo';
    delete progress.solved['metal-ring']; q('.bnSt[data-st="all"]').click(); q('.bnChip[data-ch=""]').click();
    const all=vis().length===CHAPTERS.length+1; return {allChips,one,doneEmpty,doneOne,todo,remembered,all}; })()`);
  ok(nav.allChips, 'the contents bar has a chip for every chapter and Free Jam');
  ok(nav.one, 'a chapter chip shows just that chapter');
  ok(nav.doneEmpty && nav.doneOne && nav.todo, 'the To do / Done filter hides and shows gigs by progress, with a note when nothing matches');
  ok(nav.remembered && nav.all, 'the view is remembered, and All brings every chapter back');
} catch (e) {
  console.error(e); failures++;
} finally {
  await close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
