/* Synth Patch Hero · Pixel-art client portraits.
   Each client gets a 32×32 portrait drawn in code (no image files). The client's name seeds the look (skin, hair, colours),
   so a returning client looks the same every time. Their role picks the props: headphones for DJs, a mic for singers,
   a guitar neck, drumsticks, keys, shades, glasses, a robot head… Bands and duos get bandmates behind them. */
'use strict';
const PORTRAITS={};
const PX={
  skins:[['#f3d2b3','#d9ae8c'],['#e8b98f','#c7946c'],['#c98e62','#a6704a'],['#9c6640','#7c4e30'],['#6e4529','#55341e'],['#4a2e1c','#371f12']],
  hair:['#1b1512','#3b2618','#6b4226','#b8823a','#e0c36a','#a8361f','#d9d2c4','#e06aa8','#4f8fe0','#5fbf8f','#8a6fd1'],
  shirts:['#f0a53c','#4fb3a9','#c4574a','#8a6fd1','#6fae5a','#d98a4a','#4f8fe0','#e06aa8','#e9dcc5','#3a3530'],
  bgs:[['#2a1f14','#3d2c19'],['#132228','#1b333b'],['#21172b','#302143'],['#1b2415','#27341e'],['#2a1616','#3d2020']],
  ink:'#17110e', lip:'#7a3028', white:'#f6efe4', metal:['#a4adb6','#7d8790','#59626a'], wood:'#c9a06a', dark:'#2b2a30',
};
function pxHash(s){ let h=2166136261; for(const ch of s){ h^=ch.codePointAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function pxRng(seed){ let a=seed; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function pxMix(a,b,t){ const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)), A=p(a), B=p(b);
  return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
function clientTraits(name,role){
  const t=(name+' '+role).toLowerCase(), has=(...w)=>w.some(x=>t.includes(x));
  return {
    robot:has('robot','gadget'),
    phones:has('dj','rave','promoter','selector','house','techno','sound-system','drum & bass','bass music','producer','streamer'),
    mic:has('singer','rapper','mc ','cabaret','opera','host','podcast','radio','choir'),
    guitar:has('guitar','garage','rockabilly','bassist','punk','shoegaze','folk singer'),
    sticks:has('drum','percussion','cowbell','rimshot'),
    keys:has('keys','organ','keyboardist','piano'),
    flute:has('flaut','pipes','flute'),
    shades:has('synthwave','sunglasses','acid','neon'),
    glasses:has('prof.','dr.','lecturer','restorer','acoustics','app designer'),
    collar:has('rev.','father'), veil:has('sister'),
    bowtie:has('orchestra','director','theatre'),
    calm:has('yoga','meditation','sound bath'),
    cable:has('modular'),
    cap:has('owner','game','comics','chiptune','kids','children','busker'),
    group:has('duo')?2:has('trio','crew','collective','bros','ladies','payphones','orchestra')?3:1,
  };
}
function drawPortrait(name,role){
  const W=32, g=Array.from({length:W},()=>Array(W).fill(null)), r=pxRng(pxHash(name)), pick=a=>a[Math.floor(r()*a.length)];
  const T=clientTraits(name,role), set=(x,y,c)=>{ if(c&&x>=0&&y>=0&&x<W&&y<W) g[y][x]=c; };
  const rect=(x,y,w,h,c)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) set(x+i,y+j,c); };
  const line=(x0,y0,x1,y1,c,w=1)=>{ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)); for(let k=0;k<=n;k++){ const x=Math.round(x0+(x1-x0)*k/n), y=Math.round(y0+(y1-y0)*k/n); rect(x,y,w,w,c); } };
  const disc=(cx,cy,rad,c)=>{ for(let y=Math.floor(cy-rad);y<=cy+rad;y++) for(let x=Math.floor(cx-rad);x<=cx+rad;x++) if((x-cx)**2+(y-cy)**2<=rad*rad) set(x,y,c); };
  // background: dark, warm stage with a soft spotlight
  const [b0,b1]=pick(PX.bgs); rect(0,0,W,W,b0); disc(15.5,13,12.5,b1); disc(15.5,13,8,pxMix(b1,'#ffffff',0.04));
  const HAIRS=['short','long','puff','bun','mohawk','bob','bald','spiky','curly'];
  const person=(dx,dy,dim,look)=>{
    const D=c=>dim?pxMix(c,b0,dim):c, X=x=>x+dx, Y=y=>y+dy;
    const sk=look.robot?PX.metal.slice(0,2):look.skin, hc=look.hair, sh=look.shirt, style=look.style;
    const P=(x,y,c)=>set(X(x),Y(y),D(c)), R=(x,y,w,h,c)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) P(x+i,y+j,c); };
    // hair that hangs behind the head
    if(!look.robot){
      if(style==='puff') { for(let y=0;y<=19;y++) for(let x=4;x<=27;x++) if((x-15.5)**2/100+(y-10.5)**2/80<=1) P(x,y,hc); }
      if(style==='long') R(9,9,14,16,hc);
      if(style==='bob') R(9,9,14,11,hc);
      if(look.veil){ R(8,6,16,20,PX.dark); R(10,8,12,1,PX.white); }
    }
    // shoulders and shirt
    const shirt=look.collar?'#1d1a1e':sh, shD=pxMix(shirt,'#000000',0.25);
    for(let y=25;y<32;y++){ const half=Math.min(10,6+(y-25)); R(16-half,y,half*2,1,shirt); R(16+half-3,y,3,1,shD); }
    R(14,22,4,3,sk[1]);                                   // neck
    if(!look.collar&&!look.robot){ P(15,25,sk[1]); P(16,25,sk[1]); P(15,26,sk[1]); P(16,26,sk[1]); }   // V-neck
    if(look.collar){ R(15,24,2,2,PX.white); }
    // head
    if(look.robot){ R(10,8,12,14,sk[0]); R(10,8,12,1,PX.metal[2]); R(21,8,1,14,sk[1]); P(15,6,PX.metal[2]); P(15,7,PX.metal[2]); P(15,5,'#e04a3a'); P(16,5,'#e04a3a'); }
    else {
      const rows={8:[12,19],9:[11,20],19:[11,20],20:[12,19],21:[13,18]};
      for(let y=8;y<=21;y++){ const [a,b]=rows[y]||[10,21]; R(a,y,b-a+1,1,sk[0]); }
      R(20,10,2,9,sk[1]); P(9,14,sk[0]); P(9,15,sk[1]); P(22,14,sk[1]); P(22,15,sk[1]);   // shade, ears
    }
    // face
    if(look.robot){ R(12,13,3,2,'#5fe3d6'); R(17,13,3,2,'#5fe3d6'); for(let x=12;x<=19;x+=2) P(x,18,PX.metal[2]); R(12,19,8,1,PX.metal[2]); }
    else {
      if(look.calm){ R(12,15,3,1,PX.ink); R(17,15,3,1,PX.ink); }
      else { P(13,14,PX.ink); P(13,15,PX.ink); P(18,14,PX.ink); P(18,15,PX.ink); P(12,14,PX.white); P(17,14,PX.white); }
      R(12,12,3,1,pxMix(hc,'#000000',0.3)); R(17,12,3,1,pxMix(hc,'#000000',0.3));      // brows
      P(16,17,sk[1]); P(15,18,sk[1]); P(16,18,sk[1]);                                    // nose
      if(look.mouth===0){ R(14,20,4,1,PX.lip); P(13,19,PX.lip); P(18,19,PX.lip); }       // smile
      else if(look.mouth===1){ R(14,19,4,2,PX.lip); R(15,19,2,1,PX.white); }             // grin
      else R(14,20,3,1,PX.lip);                                                          // straight
      if(look.blush){ P(11,17,'#e08a7a'); P(20,17,'#e08a7a'); }
    }
    // hair on top
    if(!look.robot&&!look.veil){
      const top=()=>{ R(12,6,8,1,hc); R(11,7,10,1,hc); R(10,8,12,2,hc); R(10,10,1,3,hc); R(21,10,1,3,hc); };
      if(style==='short'||style==='long'||style==='bob'||style==='spiky'||style==='curly'||style==='bun') top();
      if(style==='bob') R(11,10,10,1,hc);
      if(style==='long') { R(11,10,4,1,hc); }
      if(style==='spiky') for(let x=11;x<=19;x+=2){ P(x,5,hc); P(x,4,hc); }
      if(style==='curly') for(let x=10;x<=21;x+=2){ P(x,5+(x%4?0:1),hc); P(x,10,pxMix(hc,'#000000',0.3)); }
      if(style==='bun') { for(let y=1;y<=5;y++) for(let x=13;x<=18;x++) if((x-15.5)**2+(y-3)**2<=7) P(x,y,hc); }
      if(style==='mohawk') { R(14,2,4,8,hc); }
      if(style==='bald') { P(13,9,'#ffffff55'); P(14,9,pxMix(sk[0],'#ffffff',0.35)); }
    }
  };
  const look=()=>({ skin:pick(PX.skins), hair:pick(PX.hair), shirt:pick(PX.shirts), style:pick(['short','long','puff','bun','mohawk','bob','bald','spiky','curly']), mouth:Math.floor(r()*3), blush:r()<0.35 });
  // bandmates first, dimmed into the background
  if(T.group>=2) person(9,-1,0.45,{...look(),robot:T.robot});
  if(T.group>=3) person(-9,-1,0.45,{...look(),robot:T.robot});
  const me={...look(),robot:T.robot,calm:T.calm,collar:T.collar,veil:T.veil}; person(0,0,0,me);
  // props
  if(T.shades&&!T.robot){ rect(11,13,4,3,PX.ink); rect(17,13,4,3,PX.ink); rect(15,13,2,1,PX.ink); set(12,13,'#e06aa8'); set(18,13,'#4fd1c5'); }
  if(T.glasses&&!T.robot){ for(const x0 of [11,17]){ rect(x0,13,4,1,PX.ink); rect(x0,16,4,1,PX.ink); set(x0,14,PX.ink); set(x0,15,PX.ink); set(x0+3,14,PX.ink); set(x0+3,15,PX.ink); } set(15,14,PX.ink); set(16,14,PX.ink); }
  if(T.phones){ const acc=me.shirt===PX.shirts[0]?PX.shirts[1]:PX.shirts[0];
    const band=PX.metal[1], hi=PX.metal[0];
    rect(12,3,8,2,band); rect(12,3,8,1,hi); rect(10,4,2,2,band); rect(20,4,2,2,band); rect(9,6,1,6,band); rect(22,6,1,6,band);
    rect(6,11,4,8,PX.dark); rect(22,11,4,8,PX.dark); rect(6,12,1,6,acc); rect(25,12,1,6,acc); }
  if(T.bowtie){ const c=PX.ink; rect(12,24,3,3,c); rect(17,24,3,3,c); rect(15,25,2,1,pxMix(c,'#000000',0.3)); }
  if(T.cable){ const c='#f0a53c'; line(11,24,15,28,c); line(15,28,20,24,c); rect(10,22,2,3,PX.metal[1]); rect(20,22,2,3,PX.metal[1]); }
  if(T.cap&&!T.robot&&!me.veil){ const c=pick(PX.shirts.slice(0,8)); rect(11,5,10,4,c); rect(10,7,1,2,c); rect(21,7,1,2,c); rect(8,9,16,1,pxMix(c,'#000000',0.3)); }
  if(T.keys){ rect(0,27,32,5,PX.white); for(let x=1;x<32;x+=4) rect(x,31,1,1,'#bfb6a8'); for(const x of [2,6,14,18,22,30]) rect(x,27,2,3,PX.ink); rect(9,26,4,2,me.skin[0]); rect(20,26,4,2,me.skin[0]); }
  if(T.mic){ disc(5.5,21.5,2.6,PX.metal[0]); set(5,21,PX.metal[2]); set(6,22,PX.metal[2]); set(4,22,PX.metal[2]); rect(5,24,2,8,PX.dark); rect(4,26,4,3,me.skin[0]); }
  if(T.guitar){ line(19,31,28,17,PX.wood,2); rect(27,12,4,6,'#5a3a22'); for(const y of [13,15,17]){ set(26,y,PX.metal[0]); set(31,y,PX.metal[0]); } line(20,31,29,18,'#e9dcc5'); rect(22,26,3,3,me.skin[0]); }
  if(T.sticks){ line(2,30,8,18,PX.wood); line(29,30,24,18,PX.wood); set(8,18,PX.white); set(24,18,PX.white); rect(3,26,3,3,me.skin[0]); rect(26,26,3,3,me.skin[0]); }
  if(T.flute){ rect(2,20,13,1,'#cfd3da'); rect(2,21,13,1,'#8e939b'); for(const x of [4,6,8]) set(x,20,PX.ink); rect(4,22,3,2,me.skin[0]); rect(9,22,3,2,me.skin[0]); }
  // to an image
  const cv=document.createElement('canvas'); cv.width=cv.height=W; const cx=cv.getContext('2d');
  for(let y=0;y<W;y++) for(let x=0;x<W;x++) if(g[y][x]){ cx.fillStyle=g[y][x]; cx.fillRect(x,y,1,1); }
  return cv.toDataURL('image/png');
}
/* The portrait for a client, drawn once and cached. Props follow the client's first role, so returning clients keep their look. */
function portraitURL(client){
  if(!client) return '';
  if(!PORTRAITS[client]){ const first=LEVELS.find(l=>l.client===client); try{ PORTRAITS[client]=drawPortrait(client,first?first.role:''); }catch(e){ PORTRAITS[client]=''; } }
  return PORTRAITS[client];
}
function portraitImg(L,cls='portrait'){ const u=L&&!L.sandbox&&portraitURL(L.client); return u?`<img class="${cls}" src="${u}" alt="Pixel portrait of ${L.client}" width="32" height="32">`:''; }
