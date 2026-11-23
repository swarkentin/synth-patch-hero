/* Synth Patch Hero · Saved progress (localStorage, best-effort) and patch helpers. */
'use strict';
/* =====================================================================
   PROGRESS (per-viewer, best-effort)
   ===================================================================== */
const store = {
  get(k,d){ try{ const v=localStorage.getItem('sph.'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('sph.'+k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('sph.'+k);}catch(e){} }
};
let progress = store.get('progress',{solved:{}});
const saveProgress = ()=>store.set('progress',progress);
const chapterOf = i => CHAPTERS.find(c=>c.id===LEVELS[i].ch);
const basicsDone = () => CHAPTERS[0].levels.every(i=>progress.solved[LEVELS[i].id]);
/* Every gig is open so players can explore and skip ahead. Progress is still recorded; the board suggests an order. */
function isUnlocked(i){ return i>=0&&i<LEVELS.length; }
/* The suggested next gig in a chapter: its first unsolved one. */
function nextInChapter(c){ return c.levels.find(i=>!progress.solved[LEVELS[i].id]); }
/* Features (which knobs/jacks show) needed by a gig's reference patch. */
function autoFeatures(L){
  const f=new Set();
  L.target.mods.forEach(m=>{ f.add(m.type);
    if(m.type==='filter'){ f.add('res'); if(m.p.type&&m.p.type!=='lowpass') f.add('ftype'); }
    if(m.type==='osc'&&m.p.fine) f.add('fine');
    if(m.type==='filter'&&m.p.track) f.add('keytrk'); });
  L.target.cables.forEach(c=>{ if(/\.(pitch|cut|mod|sweep)$/.test(c)||/^\w+\.out>\w+\.cv$/.test(c)&&L.target.mods.some(m=>m.type==='fold'&&c.endsWith(m.id+'.cv'))) f.add('mod'); if(/\.fm$/.test(c)) f.add('fm'); if(/\.trig$/.test(c)) f.add('seq'); });
  return f;
}
/* Basics unlocks features one lesson at a time; themes get everything from Basics plus what their gigs use. */
function featuresFor(i){
  const c=chapterOf(i), f=new Set(), upto=c.levels.slice(0,c.levels.indexOf(i)+1);
  if(c.id!=='basics'){ CHAPTERS[0].levels.forEach(j=>LEVELS[j].unlock.forEach(x=>f.add(x))); ['wave','res','ftype'].forEach(x=>f.add(x)); }
  upto.forEach(j=>{ LEVELS[j].unlock.forEach(x=>f.add(x)); if(c.id!=='basics') autoFeatures(LEVELS[j]).forEach(x=>f.add(x)); });
  return f;
}

/* =====================================================================
   PATCH helpers
   ===================================================================== */
function defaultParams(type){ const p={}; MT[type].params.forEach(d=>p[d.id]=d.def); return p; }
function parseCable(s){ const [a,b]=s.split('>'); const [am,ap]=a.split('.'); const [bm,bp]=b.split('.'); return {from:{m:am,p:ap},to:{m:bm,p:bp}}; }
function targetPatch(L){
  return { modules:[...L.target.mods.map(m=>({id:m.id,type:m.type,params:Object.assign(defaultParams(m.type),m.p)})),{id:'out',type:'out',params:{}}],
           cables:L.target.cables.map(parseCable) };
}
function patchCost(p){ return p.modules.reduce((s,m)=>s+MT[m.type].cost,0); }
