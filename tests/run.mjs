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
  'breathing|e.a=0.5': [90, 100], 'sub|e.a=0.03': [90, 100], 'ufo|l.rate=7.1': [80, 95], 'wobble|l.rate=3.3': [60, 89.9], 'supersaw|o.fine=0,o2.fine=0': [60, 89.9],
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
      progress.unlockAll=true; const out=[];
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

  for (const vp of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'phone', width: 390, height: 664, mobile: true }]) {
    console.log(`\nFocus mode · ${vp.name}`);
    await page.open(URL, vp);
    await page.waitFor("document.querySelector('.gig')");
    const f = await page.evaluate(`(async()=>{ progress.unlockAll=true; store.del('draft2.wow-bass'); openLevel(LEVELS.findIndex(l=>l.id==='wow-bass')); closeSide();
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
    progress.unlockAll=true; const out=[];
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
    progress.unlockAll=true; const out=[];
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

  console.log('\nEvery gig ends with an audible jingle on its patch');
  const jingles = await page.evaluate(`(async()=>{ const out=[];
    for(const L of LEVELS){ const x=await renderJingle(targetPatch(L),L); let peak=0, nan=false;
      for(let i=0;i<x.length;i++){ const v=x[i]; if(v!==v){ nan=true; break; } const a=Math.abs(v); if(a>peak) peak=a; }
      out.push({id:L.id,peak,nan,secs:x.length/SR}); }
    return out; })()`);
  for (const j of jingles) ok(!j.nan && j.peak > 0.01 && j.peak < 4, `${j.id.padEnd(13)} jingle peak ${j.peak.toFixed(2)} over ${j.secs.toFixed(1)}s`);
  const modal = await page.evaluate(`(async()=>{ progress.unlockAll=true; const i=LEVELS.findIndex(l=>l.id==='pluck'); store.del('draft2.pluck'); openLevel(i);
    const t=targetPatch(S.L); let k=0; t.modules.forEach(m=>{ m.slot=m.type==='out'?S.slots-1:k++; }); S.patch=t; renderRack(); scheduleAnalyze();
    for(let n=0;n<60&&!(S.cmp&&S.cmp.overall>=PASS);n++) await new Promise(r=>setTimeout(r,50));
    submit(); await new Promise(r=>setTimeout(r,900));
    const dots=document.querySelectorAll('#jDots i').length, playing=!!jingleNow; document.querySelector('#mStay').click(); const stopped=!jingleNow;
    delete progress.solved.pluck; saveProgress(); showBoard(); return {dots,playing,stopped}; })()`);
  ok(modal.dots >= 4 && modal.playing && modal.stopped, `result screen plays the jingle (${modal.dots} note markers) and stops it when closed`);

  console.log('\nHaptics on a phone');
  await page.open(URL, { width: 390, height: 664, mobile: true });
  await page.waitFor("document.querySelector('.gig')");
  const hap = await page.evaluate(`(async()=>{ const calls=[]; navigator.vibrate=p=>{ calls.push(p); return true; }; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    progress.unlockAll=true; store.del('draft2.thin-walls'); openLevel(LEVELS.findIndex(l=>l.id==='thin-walls')); closeSide(); const res={available:Haptics.available};
    let n=calls.length; addModule('osc'); await wait(120); res.addModule=calls.length>n;
    const o=S.patch.modules.find(m=>m.type==='osc'); n=calls.length;
    const tap=el=>{ const r=el.getBoundingClientRect(); const e={bubbles:true,clientX:r.left+6,clientY:r.top+6,pointerId:7,pointerType:'touch'}; el.dispatchEvent(new PointerEvent('pointerdown',e)); window.dispatchEvent(new PointerEvent('pointerup',e)); };
    tap(document.querySelector('.port[data-mod="'+o.id+'"][data-dir="out"]')); await wait(80); tap(document.querySelector('.port[data-mod="out"][data-dir="in"]')); await wait(80);
    res.plug=S.patch.cables.length===1&&calls.length>=n+2;
    const k=document.querySelector('.module[data-id="'+o.id+'"] [data-param="oct"]'); const r=k.getBoundingClientRect();
    k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:8,pointerType:'touch'}));
    k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:r.left+20,clientY:r.top+20,pointerId:8,pointerType:'touch'}));
    n=calls.length; for(let q=0;q<3;q++){ document.querySelectorAll('.shBtns button')[2].click(); await wait(60); } res.knob=calls.length>=n+3&&o.params.oct===3;
    document.querySelector('#shDone').click(); for(let q=0;q<60&&!S.cmp;q++) await wait(50); await wait(400); n=calls.length; S.wasOk=false; S.cmp={...S.cmp,overall:95}; updateCompare(); res.pass=calls.length>n;
    Haptics.set(false); n=calls.length; addModule('filter'); await wait(80); res.toggleOff=calls.length===n; Haptics.set(true);
    store.del('draft2.thin-walls'); showBoard(); return res; })()`);
  for (const [k, v] of Object.entries(hap)) ok(v, `haptics: ${k}`);

  console.log('\nHaptics on iPhone (no vibrate(): switch haptic only during a real gesture)');
  await page.addInitScript(`Object.defineProperty(Navigator.prototype,'vibrate',{value:undefined,configurable:true});
    window.__sw=0; const oc=HTMLLabelElement.prototype.click; HTMLLabelElement.prototype.click=function(){ if(this.querySelector('input[switch]')) window.__sw++; return oc.call(this); };`);
  await page.open(URL, { width: 390, height: 664, mobile: true });
  await page.waitFor("document.querySelector('.gig')");
  const ios1 = await page.evaluate(`(async()=>{ await new Promise(r=>setTimeout(r,6000)); const before=__sw; Haptics.select(); return {noVibrate:typeof navigator.vibrate!=='function', continuous:Haptics.continuous, noGesture:__sw===before}; })()`);
  ok(ios1.noVibrate && ios1.continuous === false, 'iPhone mode: no vibrate(), no continuous drag ticks');
  ok(ios1.noGesture, 'no haptic is attempted without a live user gesture');
  const btn = await page.evaluate(`(()=>{ const b=document.querySelector('#btnHaptics'); b.scrollIntoView(); const r=b.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]; })()`);
  const sw0 = await page.evaluate('__sw'); await page.tap(btn[0], btn[1]); await page.tap(btn[0], btn[1]);
  ok((await page.evaluate('__sw')) > sw0, 'a real tap on the haptics switch fires the iOS switch haptic');

  console.log('\nCurriculum structure');
  const cur = await page.evaluate(`(()=>{
    const ids=LEVELS.map(l=>l.id), uniq=new Set(ids).size===ids.length;
    const themesEndInChallenge=CHAPTERS.slice(1).every(c=>LEVELS[c.levels[c.levels.length-1]].challenge&&c.levels.filter(i=>LEVELS[i].challenge).length===1);
    const every=CHAPTERS.reduce((n,c)=>n+c.levels.length,0)===LEVELS.length;
    const saved=progress; progress={solved:{},unlockAll:false};
    const openAtStart=LEVELS.map((l,i)=>isUnlocked(i)?l.id:null).filter(Boolean);
    CHAPTERS[0].levels.forEach(i=>progress.solved[LEVELS[i].id]={cost:1,cables:1,match:95});
    const openAfterBasics=CHAPTERS.slice(1).every(c=>isUnlocked(c.levels[0])&&!isUnlocked(c.levels[1]));
    progress=saved; return {uniq,every,themesEndInChallenge,firstOnly:openAtStart.length===1&&openAtStart[0]===LEVELS[0].id,openAfterBasics,n:LEVELS.length,chapters:CHAPTERS.length};
  })()`);
  ok(cur.uniq && cur.every, `${cur.n} gigs in ${cur.chapters} chapters, unique ids`);
  ok(cur.themesEndInChallenge, 'every theme ends with exactly one challenge');
  ok(cur.firstOnly, 'a new player can only open the first Basics gig');
  ok(cur.openAfterBasics, 'finishing Basics opens the first gig of every theme (and only the first)');
} catch (e) {
  console.error(e); failures++;
} finally {
  await close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
