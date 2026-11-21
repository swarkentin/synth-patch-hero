/* Synth Patch Hero · Shared UI helpers and state. */
'use strict';
/* =====================================================================
   UI STATE
   ===================================================================== */
const $=s=>document.querySelector(s);
const el=(tag,attrs={},html)=>{ const e=document.createElement(tag); for(const k in attrs){ if(k==='class') e.className=attrs[k]; else if(k.startsWith('on')) e.addEventListener(k.slice(2),attrs[k]); else e.setAttribute(k,attrs[k]); } if(html!=null) e.innerHTML=html; return e; };
const S={li:-1, L:null, patch:null, feats:null, palette:null, mine:null, cmp:null, sandbox:false, pick:null, mobile:false,
  idNote:{}, sustained:new Set(), sustain:false, kbLo:null, kbOct:4, promptDone:false, kbFb:null,
  slots:4, grid:null, view:{s:1,x:0,y:0}, userZoom:false, pinching:false, slotMenu:null,
  plotView:'scope', keysOpen:false, focus:false};
const MQ=window.matchMedia('(max-width:760px)'); S.mobile=MQ.matches;
const MQ2=window.matchMedia('(max-width:1099px)');
const onMQ=()=>{ S.mobile=MQ.matches; if(S.L){ layoutBoard(); renderRack(); requestAnimationFrame(()=>{ fitView(); drawPlots(); renderKeys(); }); } };
if(MQ.addEventListener) MQ.addEventListener('change',onMQ); else if(MQ.addListener) MQ.addListener(onMQ);
S.keysOpen=store.get('keysOpen',false);
let idc=1;
const SANDBOX={id:'jam',title:'Free Jam',concept:'Sandbox',client:'You',role:'After hours, no clients',note:45,gate:1.2,dur:2.0,slots:12,
  palette:{osc:4,noise:2,filter:3,vca:3,env:4,lfo:3},
  brief:`The studio's empty. No client, no reference, no rent check riding on it. Just you and the rack. Make something weird.`,
  manual:`<h4>Free jam</h4><p>Every module and every knob is unlocked. Open <b>♪ Keys</b> to play, use computer keys <code>A</code>–<code>K</code>, or plug in a USB keyboard.</p><div class="tip">The scope, loudness and spectrum graphs show your sound. Use them to learn what each knob does.</div>`};
