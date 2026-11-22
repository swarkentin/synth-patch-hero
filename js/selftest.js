/* Synth Patch Hero · Scoring calibration run (open index.html#selftest). Used by tests/run.mjs. */
'use strict';
/* =====================================================================
   SELF-TEST (open with #selftest) — calibrates the match score
   ===================================================================== */
async function selftest(){
  const out=[], res=[]; const lv=id=>LEVELS.find(l=>l.id===id);
  const variant=(L,changes)=>{ const p=targetPatch(L); for(const [mid,k,v] of changes){ const m=p.modules.find(x=>x.id===mid); m.params[k]=v; } return p; };
  const cases=[
    ['dial-tone',[]],['dial-tone',[['o','oct',0]]],['dial-tone',[['o','semi',1]]],['dial-tone',[['o','wave','triangle']]],
    ['shape',[['o','wave','square']]],['shape',[['o','wave','triangle']]],['shape',[['o','wave','sine']]],
    ['pixel-knight',[['o','semi',6]]],['pixel-knight',[['o','semi',5]]],['pixel-knight',[['o','oct',0]]],
    ['thin-walls',[['f','cutoff',560]]],['thin-walls',[['f','cutoff',640]]],['thin-walls',[['f','cutoff',800]]],['thin-walls',[['f','cutoff',2000]]],
    ['squelch',[['f','res',0.7]]],['squelch',[['f','res',0.5]]],['squelch',[['f','cutoff',1000]]],['squelch',[['f','cutoff',1200]]],
    ['payphone',[['f','type','lowpass']]],['payphone',[['f','cutoff',1500]]],['payphone',[['f','res',0.5]]],
    ['thin-walls',[['f','cutoff',520]]],['pluck',[['e','d',0.32]]],['vibrato',[['l','rate',5.4]]],['vibrato',[['o','pitchAmt',45]]],['wobble',[['l','rate',3.05]]],['wobble',[['l','rate',3.1]]],['supersaw',[['o','fine',8],['o2','fine',-8]]],['supersaw',[['o','fine',0],['o2','fine',-18]]],['wow-bass',[['f','cutAmt',3400]]],
    ['pluck',[['e','d',0.3]]],['pluck',[['e','d',0.5]]],['pluck',[['e','d',0.2]]],['pluck',[['o','wave','sine']]],['pluck',[['e','a',0.03]]],
    ['slow-bloom',[['e','a',0.7]]],['slow-bloom',[['e','a',0.5]]],['slow-bloom',[['e','r',0.8]]],['slow-bloom',[['e','s',0.5]]],
    ['wow-bass',[['f','cutAmt',3000]]],['wow-bass',[['f','cutAmt',2400]]],['wow-bass',[['e2','d',0.25]]],['wow-bass',[['f','cutAmt',0]]],
    ['vibrato',[['l','rate',5]]],['vibrato',[['l','rate',6.5]]],['vibrato',[['o','pitchAmt',70]]],['vibrato',[['o','pitchAmt',0]]],
    ['wobble',[['l','rate',3.3]]],['wobble',[['l','rate',4]]],['wobble',[['f','cutAmt',1800]]],
    ['supersaw',[['o','fine',6],['o2','fine',-6]]],['supersaw',[['o','fine',14],['o2','fine',-14]]],['supersaw',[['o','fine',0],['o2','fine',0]]],
    ['kick',[['o','pitchAmt',2400]]],['kick',[['e2','d',0.12]]],['kick',[['o','pitchAmt',0]]],
    ['snare',[['f','cutoff',2500]]],
    ['air',[['f','type','lowpass']]],['hat',[['f','type','lowpass']]],['breathing',[['e','a',0.5]]],['cowbell',[['o2','semi',0]]],['sub',[['e','a',0.03]]],['ufo',[['l','rate',7.1]]],['snare',[['e','d',0.25]]],['snare',[['f','type','lowpass']]],
    ['notch',[['f','type','bandpass']]],['notch',[['f','cutoff',700]]],['swell',[['f','cutAmt',4200]]],['sub-layer',[['m','l2',0.5]]],
    ['build-square',[['h','h3',0.3]]],['build-square',[['h','h5',0]]],['metal-ring',[['m','semi',7]]],['fm-bell',[['m','semi',7]]],['epiano',[['me','d',1.2]]],
    ['slapback',[['d','time',0.16]]],['canyon',[['d','time',0.25]]],['chorus',[['d','modAmt',0.004]]],['fuzz',[['d','drive',1]]],['fuzz',[['d','drive',13]]],
    ['ks-string',[['d','tone',3000]]],['ks-string',[['d','fb',0.95]]],['robot',[['f','type','lowpass']]],
  ];
  for(const [id,ch] of cases){
    const L=lv(id); if(!L._tA) L._tA=analyze(await renderPatch(targetPatch(L),L));
    const Y=analyze(await renderPatch(variant(L,ch),L)); const c=levelCompare(L,L._tA,Y);
    const label=ch.map(x=>x[0]+'.'+x[1]+'='+x[2]).join(',')||'EXACT'; res.push({id,change:label,score:c.overall});
    out.push(`${id.padEnd(13)} ${(ch.map(x=>x[0]+'.'+x[1]+'='+x[2]).join(',')||'EXACT').padEnd(34)} ${c.overall.toFixed(1).padStart(6)}  spec ${c.dSpec.toFixed(2)} tone ${c.dTone.toFixed(2)} shape ${c.dShape.toFixed(2)} | ${c.hints.filter(h=>!h.ok).map(h=>h.t).join(' ')}`);
  }
  const pre=el('pre',{id:'selftest'}); pre.textContent=out.join('\n'); document.body.innerHTML=''; document.body.appendChild(pre); window.__selftest=res;
}
