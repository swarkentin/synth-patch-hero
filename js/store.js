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
let progress = store.get('progress',{solved:{},unlockAll:false});
const saveProgress = ()=>store.set('progress',progress);
const isUnlocked = i => progress.unlockAll || i===0 || !!progress.solved[LEVELS[i-1].id];
function featuresFor(i){ const f=new Set(); for(let j=0;j<=i;j++) LEVELS[j].unlock.forEach(x=>f.add(x)); return f; }

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
