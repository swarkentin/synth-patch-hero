/* Synth Patch Hero · Module definitions (ports, params, costs, lesson unlocks) and the gig list. */
'use strict';
/* =====================================================================
   DATA: module types
   ===================================================================== */
const WAVES = ['sine','triangle','square','sawtooth'];
const WAVE_PATH = {
  sine:'M2 9 C6 1, 10 1, 14 9 S22 17, 26 9',
  triangle:'M2 9 L8 2 L20 16 L26 9',
  square:'M2 15 L2 3 L14 3 L14 15 L26 15 L26 3',
  sawtooth:'M2 15 L14 3 L14 15 L26 3 L26 15'
};
const fmtHz = v => v >= 1000 ? (v/1000).toFixed(v>=10000?1:2)+'kHz' : Math.round(v)+'Hz';
const fmtT = v => v < 1 ? Math.round(v*1000)+'ms' : v.toFixed(2)+'s';
const fmtSigned = v => (v>0?'+':'')+v;
const fmtPct = v => Math.round(v*100)+'%';

const MT = {
  osc: {name:'OSC', long:'Oscillator', color:'var(--amber)', cost:240,
    ins:[{id:'pitch',kind:'mod',label:'PITCH',req:'mod'},{id:'fm',kind:'audio',label:'FM',req:'fm'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'wave',type:'choice',options:WAVES,def:'sine',req:'wave'},
      {id:'oct',label:'OCT',min:-3,max:3,step:1,def:0,fmt:fmtSigned},
      {id:'semi',label:'SEMI',min:-12,max:12,step:1,def:0,fmt:fmtSigned},
      {id:'fine',label:'FINE',min:-50,max:50,step:1,def:0,fmt:v=>fmtSigned(v)+'ct',req:'fine'},
      {id:'pitchAmt',label:'MOD AMT',min:-4800,max:4800,step:5,def:0,fmt:v=>fmtSigned(+(v/100).toFixed(Math.abs(v)<1000?2:1))+'st',req:'mod',bipolar:true},
      {id:'fmAmt',label:'FM AMT',min:0,max:3000,step:5,def:0,fmt:v=>Math.round(v)+'Hz',req:'fm'},
    ]},
  noise: {name:'NOISE', long:'Noise source', color:'var(--grey)', cost:90, ins:[], outs:[{id:'out',kind:'audio',label:'OUT'}], params:[]},
  filter: {name:'FILTER', long:'Filter', color:'var(--teal)', cost:220,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'cut',kind:'mod',label:'CUT',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'type',type:'choice',options:['lowpass','highpass','bandpass','notch'],labels:['LP','HP','BP','NT'],def:'lowpass',req:'ftype'},
      {id:'cutoff',label:'CUTOFF',min:40,max:12000,scale:'log',def:2000,fmt:fmtHz},
      {id:'res',label:'RES',min:0,max:1,step:0.01,def:0.1,fmt:fmtPct,req:'res'},
      {id:'cutAmt',label:'MOD AMT',min:-7200,max:7200,step:10,def:0,fmt:v=>(v>0?'+':'')+(v/1200).toFixed(2)+'oct',req:'mod',bipolar:true},
      {id:'track',label:'KEY TRK',min:0,max:1,step:0.01,def:0,fmt:fmtPct,req:'keytrk'},
    ]},
  vca: {name:'VCA', long:'Amplifier', color:'var(--red)', cost:110,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'gain',kind:'mod',label:'CV'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[{id:'level',label:'LEVEL',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct}]},
  env: {name:'ENV', long:'ADSR envelope', color:'var(--violet)', cost:140, ins:[{id:'trig',kind:'mod',label:'TRIG',req:'seq'}], outs:[{id:'out',kind:'mod',label:'ENV'}],
    params:[
      {id:'a',label:'ATTACK',min:0.001,max:3,scale:'log',def:0.01,fmt:fmtT},
      {id:'d',label:'DECAY',min:0.005,max:3,scale:'log',def:0.3,fmt:fmtT},
      {id:'s',label:'SUSTAIN',min:0,max:1,step:0.01,def:0.7,fmt:fmtPct},
      {id:'r',label:'RELEASE',min:0.005,max:4,scale:'log',def:0.3,fmt:fmtT},
    ]},
  lfo: {name:'LFO', long:'Low-frequency oscillator', color:'var(--green)', cost:130, ins:[], outs:[{id:'out',kind:'mod',label:'LFO'}],
    params:[
      {id:'wave',type:'choice',options:WAVES,def:'sine'},
      {id:'rate',label:'RATE',min:0.1,max:20,scale:'log',def:2,fmt:v=>v.toFixed(v<10?2:1)+'Hz'},
    ]},
  mixer: {name:'MIXER', long:'Mixer', color:'var(--sand)', cost:90,
    ins:[{id:'in1',kind:'audio',label:'IN 1'},{id:'in2',kind:'audio',label:'IN 2'},{id:'in3',kind:'audio',label:'IN 3'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'l1',label:'LEVEL 1',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct},
      {id:'l2',label:'LEVEL 2',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct},
      {id:'l3',label:'LEVEL 3',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct},
    ]},
  harm: {name:'HARMONIC', long:'Harmonic oscillator (drawbars)', color:'var(--pink)', cost:320,
    ins:[], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[1,2,3,4,5,6].map(n=>({id:'h'+n,label:'H'+n,type:'bar',min:0,max:1,step:0.01,def:n===1?1:0,fmt:fmtPct}))},
  delay: {name:'DELAY', long:'Delay / echo', color:'var(--blue)', cost:290,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'mod',kind:'mod',label:'TIME',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'sync',type:'choice',options:['free','note'],labels:['MS','NOTE'],def:'free'},
      {id:'time',label:'TIME',min:0.002,max:1,scale:'log',def:0.25,fmt:fmtT},
      {id:'fb',label:'FDBK',min:0,max:0.99,step:0.005,def:0.3,fmt:fmtPct},
      {id:'mix',label:'MIX',min:0,max:1,step:0.01,def:0.35,fmt:fmtPct},
      {id:'tone',label:'TONE',min:300,max:12000,scale:'log',def:8000,fmt:fmtHz},
      {id:'modAmt',label:'MOD',min:0,max:0.02,step:0.0001,def:0,fmt:v=>(v*1000).toFixed(1)+'ms',req:'mod'},
    ]},
  reverb: {name:'REVERB', long:'Reverb', color:'var(--sky)', cost:340,
    ins:[{id:'in',kind:'audio',label:'IN'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'size',label:'SIZE',min:0.2,max:6,scale:'log',def:1.5,fmt:v=>v.toFixed(1)+'s'},
      {id:'mix',label:'MIX',min:0,max:1,step:0.01,def:0.3,fmt:fmtPct},
    ]},
  drive: {name:'DRIVE', long:'Drive / distortion', color:'var(--orange)', cost:160,
    ins:[{id:'in',kind:'audio',label:'IN'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'drive',label:'DRIVE',min:1,max:60,scale:'log',def:4,fmt:v=>v.toFixed(1)+'×'},
      {id:'level',label:'LEVEL',min:0,max:1,step:0.01,def:0.7,fmt:fmtPct},
    ]},
  sh: {name:'S&H', long:'Sample & hold (random steps)', color:'var(--lime)', cost:150, ins:[], outs:[{id:'out',kind:'mod',label:'S&H'}],
    params:[{id:'rate',label:'RATE',min:0.5,max:30,scale:'log',step:0.5,def:6,fmt:v=>v.toFixed(v<10?2:1)+'Hz'}]},
  seq: {name:'SEQ', long:'Step sequencer (8 steps of 16th notes)', color:'var(--mint)', cost:380,
    ins:[], outs:[{id:'pitch',kind:'mod',label:'PITCH'},{id:'gate',kind:'mod',label:'GATE'}],
    params:[
      ...[1,2,3,4,5,6,7,8].map(i=>({id:'s'+i,label:String(i),type:'bar',min:-12,max:12,step:1,def:0,bipolar:true,fmt:v=>(v>0?'+':'')+v})),
      {id:'len',label:'STEPS',min:1,max:8,step:1,def:8,fmt:v=>String(v)},
      {id:'bpm',label:'BPM',min:60,max:180,step:1,def:120,fmt:v=>String(v)},
      {id:'gate',label:'GATE',min:0.05,max:1,step:0.01,def:0.5,fmt:fmtPct},
      {id:'glide',label:'GLIDE',min:0,max:0.3,step:0.005,def:0,fmt:v=>v?Math.round(v*1000)+'ms':'off'},
    ]},
  /* ---- advanced tier ---- */
  sync: {name:'SYNC OSC', long:'Hard-sync oscillator', color:'var(--rust)', cost:280,
    ins:[{id:'sweep',kind:'mod',label:'SWEEP',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'wave',type:'choice',options:['sawtooth','square'],def:'sawtooth'},
      {id:'oct',label:'OCT',min:-3,max:3,step:1,def:0,fmt:fmtSigned},
      {id:'ratio',label:'RATIO',min:1,max:8,step:0.05,def:2,fmt:v=>v.toFixed(2)+'×'},
      {id:'sweepAmt',label:'SWEEP',min:0,max:8,step:0.05,def:0,fmt:v=>'+'+v.toFixed(2)+'×',req:'mod'},
    ]},
  ring: {name:'RING MOD', long:'Ring modulator (multiplies two signals)', color:'var(--gold)', cost:120,
    ins:[{id:'a',kind:'audio',label:'A'},{id:'b',kind:'audio',label:'B'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[{id:'level',label:'LEVEL',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct}]},
  func: {name:'FUNC', long:'Function generator (rise/fall, one-shot or looping)', color:'var(--lilac)', cost:260,
    ins:[], outs:[{id:'out',kind:'mod',label:'OUT'}],
    params:[
      {id:'loop',type:'choice',options:['once','loop'],labels:['ONCE','LOOP'],def:'once'},
      {id:'rise',label:'RISE',min:0.002,max:5,scale:'log',def:0.01,fmt:fmtT},
      {id:'fall',label:'FALL',min:0.002,max:5,scale:'log',def:0.5,fmt:fmtT},
    ]},
  modvca: {name:'MOD VCA', long:'Control-signal amplifier / attenuverter', color:'var(--cyan)', cost:100,
    ins:[{id:'in',kind:'mod',label:'IN'},{id:'cv',kind:'mod',label:'CV'}], outs:[{id:'out',kind:'mod',label:'OUT'}],
    params:[{id:'amt',label:'AMOUNT',min:-1,max:1,step:0.01,def:1,fmt:v=>(v>0?'+':'')+Math.round(v*100)+'%',bipolar:true}]},
  fold: {name:'FOLDER', long:'Wavefolder', color:'var(--coral)', cost:230,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'cv',kind:'mod',label:'CV',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'fold',label:'FOLD',min:1,max:8,step:0.01,def:1,fmt:v=>v.toFixed(2)+'×'},
      {id:'foldAmt',label:'MOD AMT',min:0,max:7,step:0.01,def:0,fmt:v=>'+'+v.toFixed(2)+'×',req:'mod'},
      {id:'level',label:'LEVEL',min:0,max:1,step:0.01,def:0.7,fmt:fmtPct},
    ]},
  lpg: {name:'LPG', long:'Low-pass gate (volume and brightness together)', color:'var(--olive)', cost:210,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'cv',kind:'mod',label:'CV'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[{id:'open',label:'OPEN',min:0,max:1,step:0.01,def:0,fmt:fmtPct}]},
  out: {name:'OUTPUT', long:'Speaker', color:'var(--cream)', cost:0, ins:[{id:'in',kind:'audio',label:'IN'}], outs:[], params:[]},
};
const ALL_FEATURES = ['osc','wave','filter','res','ftype','vca','env','mod','lfo','fine','noise','fm','keytrk','seq'];

/* =====================================================================
   DATA: levels
   ===================================================================== */
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteName = m => NOTE_NAMES[m%12]+(Math.floor(m/12)-1);
const mtof = m => 440*Math.pow(2,(m-69)/12);

const LEVELS = [
/* ---------------- BASICS ---------------- */
{ id:'dial-tone', ch:'basics', title:'Dial Tone', concept:'Oscillator', client:'Marlene Okafor', role:'Owner, Suds & Spins Laundromat',
  unlock:['osc'], palette:{osc:1}, note:57, gate:1.2, dur:1.4,
  start:[{type:'osc',slot:0}],
  brief:`Our "cycle done" beeper died. It was a smooth, pure tone, kind of soothing. Higher than whatever that box of yours is making right now, I'll tell you that much. Twenty bucks if you can match it.`,
  manual:`<h4>The oscillator</h4>
  <p>Every synth sound starts with an <b>oscillator</b>: a circuit that wiggles a voltage back and forth very fast. How fast it wiggles is the <b>frequency</b>, which you hear as <b>pitch</b>.</p>
  <ul><li><b>OCT</b> jumps a whole octave. One octave up = twice the frequency.</li><li><b>SEMI</b> moves in semitones (piano keys). 12 semitones = 1 octave.</li></ul>
  <p>Sound only reaches the speaker if it's <b>patched</b>. Drag from the OSC's <b>OUT</b> jack to the OUTPUT's <b>IN</b> jack. Click a cable to remove it.</p>
  <div class="tip">Press <b>▶ Target</b> and <b>▶ Yours</b> back and forth. The graphs on the right show where your sound differs. Keys <code>A</code>–<code>K</code> play your patch like a keyboard.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{oct:1}}], cables:['o.out>out.in']},
  reply:`That's the one! The whole laundromat sighed in relief. Here's your twenty, and I'm telling my nephew about you.`},
{ id:'shape', ch:'basics', title:'Shape of Sound', concept:'Waveforms', client:'DJ Kettle', role:'Basement rave curator',
  unlock:['wave'], palette:{osc:1}, note:45, gate:1.2, dur:1.4,
  brief:`I need a raw tone. Buzzy. Nasty. Like a bee trapped in a soda can. Same note as the reference, I just need that edge on it.`,
  manual:`<h4>Waveforms and harmonics</h4>
  <p>The <b>shape</b> of the wiggle sets the tone color, or <b>timbre</b>. Any shape other than a sine adds <b>harmonics</b>: quieter copies of the note at 2×, 3×, 4×… the frequency.</p>
  <ul><li><b>Sine</b>: the fundamental only. Pure and soft.</li><li><b>Triangle</b>: a few odd harmonics, fading fast. Mellow, flute-like.</li><li><b>Square</b>: strong odd harmonics. Hollow, reedy, "8-bit."</li><li><b>Saw</b>: every harmonic. Bright and buzzy, the classic synth raw material.</li></ul>
  <div class="tip">Watch the <b>spectrum</b> plot: each spike is a harmonic. Count the spikes and compare their spacing to pick the right shape.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}}], cables:['o.out>out.in']},
  reply:`BZZZZT. Perfect. The crowd is going to hate it in the best way.`},
{ id:'pixel-knight', ch:'basics', title:'Pixel Knight', concept:'Pitch practice', client:'Bitcrush Bros.', role:'Two-person indie game studio',
  unlock:[], palette:{osc:1}, note:57, gate:1.2, dur:1.4,
  brief:`Our hero's jump sound needs a chiptune "bloop." Hollow, retro, way up high. We lost the original file and only have this recording. Help.`,
  manual:`<h4>Intervals</h4>
  <p>Musicians count pitch distance in <b>semitones</b>. A few you'll hear constantly:</p>
  <ul><li><b>+12</b>: an octave. Same note, higher.</li><li><b>+7</b>: a <b>perfect fifth</b>. Bright and stable (think power chords).</li><li><b>+5</b>: a fourth. <b>+4</b>: a major third. <b>+3</b>: a minor third.</li></ul>
  <p>OCT and SEMI add together, so +1 OCT and +7 SEMI is 19 semitones up.</p>
  <div class="tip">Get the shape right first, then sweep pitch. The hint list tells you how many semitones off you are.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square',oct:1,semi:7}}], cables:['o.out>out.in']},
  reply:`Our knight jumps with dignity again. Paying you in cash AND a credit in the game.`},
{ id:'thin-walls', ch:'basics', title:'Thin Walls', concept:'Low-pass filter', client:'Lo & Behold', role:'Lo-fi duo, bedroom label',
  unlock:['filter'], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`We want this buzzy note to sound like it's coming through the wall from the neighbour's apartment. Muffled, warm, distant. Same buzz underneath, just… dulled.`,
  manual:`<h4>Subtractive synthesis</h4>
  <p>Start with a harmonic-rich wave, then <b>carve harmonics away</b> with a <b>filter</b>. This is how most classic analog synths work.</p>
  <p>A <b>low-pass filter</b> lets low frequencies through and removes highs above its <b>CUTOFF</b>. Lower cutoff = darker, more muffled sound.</p>
  <p>Patch it <i>between</i> the oscillator and the output: <code>OSC → FILTER → OUTPUT</code>.</p>
  <div class="tip">On the spectrum plot, watch the right side of the curve drop as you lower the cutoff. Line yours up with the target's slope.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:480}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Exactly like our neighbour, Gary. Love that for us. Track's going on the "rainy window" playlist.`},
{ id:'gate', ch:'basics', title:'Curtain Call', concept:'VCA + envelope', client:'Dot Marlowe', role:'Community theatre, sound booth',
  unlock:['vca','env'], palette:{osc:1,filter:1,vca:1,env:1}, note:57, gate:1.0, dur:2.2,
  start:[{id:'p1',type:'osc',slot:0,locked:1,p:{wave:'square'}},{id:'p2',type:'vca',slot:1,locked:1,p:{level:0.8}}],
  startCables:['p1.out>p2.in','p2.out>out.in'],
  presetNote:`Preset on your rack: OSC → VCA → OUTPUT. With nothing in its CV jack, the VCA just passes sound through at its LEVEL, so it drones forever. Add an <b>ENV</b> and patch it into the VCA's <b>CV</b> jack.`,
  brief:`Our cue beep is stuck on: it drones until somebody pulls the plug. I need it to start the moment the button is pressed, stay steady while it's held, and fade out gently after it's let go.`,
  manual:`<h4>The VCA and the envelope</h4>
  <p>A <b>VCA</b> (voltage-controlled amplifier) is a volume control that another module can turn.</p>
  <ul><li><b>Nothing in CV:</b> the VCA passes the sound through at its LEVEL, all the time.</li><li><b>Something in CV:</b> the VCA is silent until that signal opens it. LEVEL becomes the most it can open.</li></ul>
  <p>An <b>envelope</b> (ENV) is the classic thing to plug in. Each note, it rises, holds, and falls. This gig only needs two of its knobs:</p>
  <ul><li><b>Sustain</b>: how open the VCA stays while the key is held. All the way up means "fully on".</li><li><b>Release</b>: how long the sound takes to fade after the key is let go.</li></ul>
  <div class="tip">Watch the loudness graph: the dotted line marks when the key is let go. Match the fade after it with RELEASE.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square'}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.01,d:0.1,s:1,r:0.5}}], cables:['o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`On, off, and a lovely little fade. The actors stopped flinching. Thank you!`},
{ id:'pluck', ch:'basics', tolShape:0.45, tol:1.5, title:'Pluck', concept:'VCA + ADSR', client:'Juniper Vale', role:'Folktronica songwriter',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1}, note:57, gate:1.0, dur:1.6,
  brief:`Every sound you've made so far just… sits there, droning. I want a plucked string, like a kalimba. A quick "plink" that fades away by itself. Soft tone.`,
  manual:`<h4>All four envelope stages</h4>
  <p>In Curtain Call you used SUSTAIN and RELEASE. A pluck needs the other two. Here are all four stages an envelope plays each note:</p>
  <ul><li><b>Attack</b>: how long to rise to full when the key goes down.</li><li><b>Decay</b>: how long to fall to the sustain level.</li><li><b>Sustain</b>: the level held while the key stays down (a level, not a time).</li><li><b>Release</b>: how long to fade out after the key is let go.</li></ul>
  <p>This time you build the whole thing: <code>OSC → VCA → OUTPUT</code>, then <code>ENV → VCA CV</code>. Remember, once the envelope is in CV, the VCA is silent unless the envelope opens it.</p>
  <div class="tip">A pluck has a near-instant ATTACK, a DECAY that falls all the way, and SUSTAIN at zero, so it dies away even while the key is held. Stuck? Press <b>Help</b>.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.003,d:0.35,s:0,r:0.25}}], cables:['o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Plink! Oh that's lovely. I wrote half a song just listening to it.`},
{ id:'vibrato', ch:'basics', tol:3, title:'Vibrato', concept:'LFO → pitch', client:'Rosa Belcanto', role:'Cabaret singer',
  unlock:['lfo','mod'], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:57, gate:1.8, dur:2.0,
  brief:`My accompanist quit. I need a little voice to sing with me: a sweet, soft tone with a gentle wobble in its pitch, the way a singer holds a long note.`,
  manual:`<h4>The LFO</h4>
  <p>An <b>LFO</b> (low-frequency oscillator) is an oscillator too slow to hear as a note. Instead of using it as sound, you use it to <b>move</b> other knobs in a repeating cycle.</p>
  <ul><li><b>RATE</b>: cycles per second. Vibrato is usually 4–7 Hz.</li><li>The <b>MOD AMT</b> on the destination sets the depth. For vibrato, a fraction of a semitone.</li></ul>
  <p>Patch <code>LFO → OSC PITCH</code> to make <b>vibrato</b>.</p>
  <div class="tip">Count the wobbles in the target per second to find the rate. Small depth goes a long way.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',oct:1,pitchAmt:40}},{id:'l',type:'lfo',p:{rate:5.5}}], cables:['o.out>out.in','l.out>o.pitch']},
  reply:`Bravissimo! We open Friday. Wear something sparkly.`},
/* ---------------- FILTERS ---------------- */
{ id:'squelch', ch:'filters', studio:'ladder', title:'Squelch', concept:'Resonance', client:'Acid Annie', role:'303 devotee, warehouse DJ',
  unlock:['res'], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`Darling, a plain filter is so polite. I need it to sing. That rubbery, wet, whistling peak right at the cutoff. Make it squelch.`,
  manual:`<h4>Resonance</h4>
  <p><b>Resonance</b> (also called <b>Q</b> or emphasis) feeds some of the filter's output back into itself, which <b>boosts the frequencies right at the cutoff</b>.</p>
  <ul><li>Low resonance: a smooth roll-off.</li><li>High resonance: a sharp peak that whistles. Sweeping it is the "acid" sound.</li></ul>
  <div class="tip">A resonant peak shows up as a bump on the spectrum plot. Its <b>position</b> is the cutoff, its <b>height</b> is the resonance. Match position first.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:900,res:0.78}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Mmm, squelchy. You've got good ears, sweetie. I'll be back.`},
{ id:'payphone', ch:'filters', title:'Payphone', concept:'Filter types', client:'The Payphones', role:'Garage band, three chords',
  unlock:['ftype'], palette:{osc:1,filter:1}, note:57, gate:1.2, dur:1.4,
  brief:`Our intro is supposed to sound like it's coming down an old telephone line. Thin and nasal: no deep bass, no fizzy top. Just the honky middle.`,
  manual:`<h4>Filter types</h4>
  <ul><li><b>LP (low-pass)</b>: keeps lows, cuts highs. Warm, dark.</li><li><b>HP (high-pass)</b>: keeps highs, cuts lows. Thin, airy.</li><li><b>BP (band-pass)</b>: keeps a band around the cutoff and cuts both sides. Nasal, telephone, radio.</li></ul>
  <p>On a band-pass, <b>RES</b> controls how narrow the band is. Narrower = more nasal.</p>
  <div class="tip">Look at the target spectrum: is it a ramp, a slope up, or a hill? That tells you the filter type.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:1300,res:0.3}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Hello? Is it me you're looking for? (Yes. It's you. That's perfect.)`},
{ id:'air', ch:'filters', title:'Thin Air', concept:'High-pass filter', client:'Sol Reyes', role:'Podcast producer',
  unlock:[], palette:{osc:1,filter:1}, note:57, gate:1.2, dur:1.4,
  brief:`My intro chime sits right on top of the host's voice and turns everything to mud. Keep the sparkle, lose the body. Make it thin, airy, up out of the way.`,
  manual:`<h4>High-pass: cutting the bottom</h4>
  <p>A <b>high-pass</b> filter is the mirror image of a low-pass: it lets the highs through and removes everything <b>below</b> the cutoff.</p>
  <ul><li>Use it to make room: voices, kick drums and bass live down low, so high-passing other sounds stops them fighting.</li><li>The higher the cutoff, the thinner and brighter the result.</li></ul>
  <p>Switch the filter's type to <b>HP</b>, then find the cutoff.</p>
  <div class="tip">On the spectrum, a high-pass makes the left side of the curve drop away. Match where the drop starts.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square',oct:1}},{id:'f',type:'filter',p:{type:'highpass',cutoff:1800,res:0.1}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Crisp! It floats over the voice now. Episode 1 goes up tonight.`},
{ id:'vowel', tol:1.6, ch:'filters', title:'Talk Box', concept:'Formants', client:'Vox Populi', role:'Robot-funk duo',
  unlock:[], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`We want the synth to <i>talk</i>. Not words, just a vowel. A big open "aaah" like a robot singing in the shower.`,
  manual:`<h4>Formants: why filters can sing</h4>
  <p>Your mouth is a filter. When you say different vowels you reshape it, boosting different bands of frequencies called <b>formants</b>.</p>
  <ul><li><b>"oo"</b> is dark: a band around 300 Hz.</li><li><b>"ah"</b> is open: a band around 800–1000 Hz.</li><li><b>"ee"</b> is bright: energy up around 2–3 kHz.</li></ul>
  <p>A <b>band-pass</b> filter with some resonance on a buzzy saw gets surprisingly vocal. Move the cutoff to change the vowel.</p>
  <div class="tip">Sweep the cutoff slowly while listening. You'll hear "oo → oh → ah → eh → ee" go by.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:950,res:0.5}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Aaaaah. The robot is HAPPY. We're calling the album "Shower Thoughts".`},
{ id:'notch', ch:'filters', title:'The Scoop', concept:'Notch filter', client:'Marisol Duarte', role:'Late-night radio host',
  unlock:['ftype'], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`My station ident sounds harsh right in the middle, like a kazoo in a tin can. I don't want it darker or thinner. Keep the lows, keep the sparkle, just scoop out that nasal middle.`,
  manual:`<h4>The notch filter</h4>
  <p>Low-pass, high-pass and band-pass all <i>keep</i> a region. A <b>notch</b> (NT) does the opposite: it removes one band and lets everything above and below through.</p>
  <ul><li><b>CUTOFF</b> picks the centre of the hole.</li><li><b>RES</b> narrows the hole. Low resonance gives a wide scoop, high resonance gives a thin slice.</li></ul>
  <div class="tip">Look for the dip in the target's spectrum. Line up your cutoff under it, then match its width.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'notch',cutoff:1100,res:0}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Smooth as late-night coffee. The kazoo has left the building.`},
{ id:'swell', ch:'filters', title:'Upside Down', concept:'Inverted envelope', client:'Dex Moreau', role:'Shoegaze guitarist',
  unlock:['mod'], palette:{osc:1,filter:1,env:1}, note:45, gate:1.3, dur:1.6,
  brief:`Every synth I hear opens up bright and then closes. I want the reverse. Hit the note and the tone ducks dark, then slowly blooms back open while I hold it.`,
  manual:`<h4>Negative modulation</h4>
  <p>The filter's <b>MOD AMT</b> knob goes both ways. Turn it right and an envelope pushes the cutoff <b>up</b>. Turn it left of centre and the same envelope pushes the cutoff <b>down</b>.</p>
  <ul><li>Set CUTOFF to where the sound should rest: fairly bright.</li><li>Patch an ENV into the filter's CUT jack and turn MOD AMT negative.</li><li>The envelope's attack is how fast it ducks. Its decay and sustain decide how far and how slowly it climbs back.</li></ul>
  <div class="tip">On the spectrum, the target dips at the start and recovers. That recovery is the envelope's decay.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:3000,res:0.3,cutAmt:-4200}},{id:'e',type:'env',p:{a:0.02,d:0.9,s:0.15,r:0.3}}],
    cables:['o.out>f.in','f.out>out.in','e.out>f.cut']},
  reply:`It breathes in before it sings. My pedalboard is jealous.`},
{ id:'acid', ch:'filters', studio:'ladder', challenge:true, tol:1.5, title:'Acid Test', concept:'Challenge', client:'Acid Annie', role:'Back for more squelch',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:45, gate:0.5, dur:0.8,
  brief:`Remember me, darling? Now I want the real thing: a short, snappy note where the resonant filter <i>bites</i> open and snaps shut every time. Rubbery. Wet. Rude.`,
  manual:`<h4>Challenge: the acid line</h4>
  <p>No parts list this time. Everything you need is in Filter Lab and Basics.</p>
  <ul><li>What makes it squelch? Resonance.</li><li>What makes it bite on each note? Something that moves the cutoff, fast.</li><li>What makes it short? Something that shapes the volume.</li></ul>
  <div class="tip">Build it in layers: first the raw tone, then the volume shape, then the filter movement. Check the score after each layer.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:400,res:0.82,cutAmt:3000}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.35,s:0.4,r:0.1}},{id:'e2',type:'env',p:{a:0.003,d:0.22,s:0,r:0.1}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','e2.out>f.cut']},
  reply:`Mmm, THAT'S acid. The warehouse will melt. You're on my speed dial forever.`},
/* ---------------- BASS ---------------- */
{ id:'sub', ch:'bass', title:'Sub Club', concept:'Sub bass', client:'Kofi Mensah', role:'Sound-system builder',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1}, note:40, gate:1.0, dur:1.4,
  brief:`I build speakers the size of fridges. I need a test bass: pure, round, low. No buzz, no click when it starts, and it should hold steady while the note's down.`,
  manual:`<h4>Sub bass</h4>
  <p>The deepest bass is often just a <b>sine wave</b>: pure fundamental, no harmonics, felt as much as heard. This one sits on low E, the same as the lowest string of a bass guitar.</p>
  <ul><li>Shape it with a VCA and envelope so it doesn't drone forever.</li><li>A few milliseconds of <b>attack</b> avoids a click at the start.</li><li>A high <b>sustain</b> keeps it solid while the key is held.</li></ul>
  <div class="tip">Phone speakers can't reproduce sub bass. Use headphones and trust the graphs.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine'}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.02,d:0.3,s:0.9,r:0.2}}], cables:['o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`The fridge-speakers are rattling the windows. Perfect. You can come to the first party.`},
{ id:'wow-bass', ch:'bass', title:'Wow Bass', concept:'Filter envelope', client:'The Lowkey Ladies', role:'Funk band, Thursday residency',
  unlock:['mod'], palette:{osc:1,filter:1,vca:1,env:2}, note:33, gate:0.9, dur:1.4,
  start:[{id:'p1',type:'osc',slot:0,locked:1,p:{wave:'sawtooth'}},{id:'p2',type:'vca',slot:2,locked:1,p:{level:0.85}},{id:'p3',type:'env',slot:3,locked:1,p:{a:0.004,d:0.5,s:0.75,r:0.15}}],
  startCables:['p1.out>p2.in','p2.out>out.in','p3.out>p2.gain'],
  presetNote:`Preset on your rack: a saw OSC → VCA → OUTPUT, with a volume envelope already shaping it. Your job is the <b>tone</b>: slot a FILTER between the OSC and the VCA, and give it its own envelope.`,
  brief:`We need a bass that goes "WOW." Starts bright and snappy, then the tone closes down while the note keeps going. Low and fat. You know the one.`,
  manual:`<h4>Modulation</h4>
  <p>An envelope can control <b>anything</b>, not just volume. Plug one into the filter's <b>CUT</b> jack and the cutoff rises and falls with each note.</p>
  <p>The filter's <b>MOD AMT</b> knob sets how far the envelope pushes the cutoff, in octaves above the CUTOFF knob. CUTOFF is where the envelope starts and ends.</p>
  <ul><li>Envelope #1 → VCA: shapes <b>loudness</b>.</li><li>Envelope #2 → FILTER CUT: shapes <b>brightness</b>.</li></ul>
  <div class="tip">"Wow" = a low cutoff, a strong mod amount, and a filter envelope that decays to a low sustain. Resonance makes the sweep vocal.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:180,res:0.55,cutAmt:3600}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.004,d:0.5,s:0.75,r:0.15}},{id:'e2',type:'env',p:{a:0.01,d:0.32,s:0.1,r:0.15}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','e2.out>f.cut']},
  reply:`WOW. Okay, the bassist just did a full spin. You're on the guest list forever.`},
{ id:'pluck-bass', ch:'bass', tol:1.5, title:'Pluck Bass', concept:'Filter envelope', client:'Tasha Grooves', role:'House producer',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:40, gate:0.6, dur:1.0,
  brief:`I need a tight, plucky bassline sound. A bright "dow" right at the start that goes dark fast, then the note fades. Groovy, not boomy.`,
  manual:`<h4>The pluck, without training wheels</h4>
  <p>Same idea as Wow Bass, but nothing is pre-built this time and everything is quicker.</p>
  <ul><li>Envelope → filter CUT: a <b>short decay</b> and <b>zero sustain</b> gives the "dow".</li><li>Envelope → VCA: the note's overall length and fade.</li><li>A little resonance adds snap.</li></ul>
  <div class="tip">Get the loudness shape right first (watch the loudness graph), then dial in the brightness with the filter.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:250,res:0.3,cutAmt:2600}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.002,d:0.45,s:0.3,r:0.12}},{id:'e2',type:'env',p:{a:0.002,d:0.16,s:0,r:0.1}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','e2.out>f.cut']},
  reply:`Dow-dow-dow. My bassline finally bounces. Sending you the stems!`},
{ id:'wobble', ch:'bass', studio:'ladder', tol:3, title:'Wobble', concept:'LFO → filter', client:'BRÖSTEP', role:'Producer, umlaut mandatory',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:33, gate:1.8, dur:2.0,
  brief:`YO. I need the WUB. Low, filthy bass where the filter opens and closes in rhythm. WUB WUB WUB. Same tempo as the reference. Don't let me down.`,
  manual:`<h4>Filter wobble</h4>
  <p>Point the LFO at the <b>filter cutoff</b> instead of pitch and the tone opens and closes rhythmically. That's the wobble bass.</p>
  <ul><li><b>LFO RATE</b>: how many wubs per second.</li><li><b>Filter MOD AMT</b>: how far it opens.</li><li><b>CUTOFF</b>: the centre point it swings around.</li><li><b>Resonance</b>: makes it talk.</li></ul>
  <div class="tip">Get the rate first. If yours drifts in and out of time with the target, the rate is close but not exact.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:420,res:0.6,cutAmt:2400}},{id:'l',type:'lfo',p:{rate:3,wave:'sine'}}], cables:['o.out>f.in','f.out>out.in','l.out>f.cut']},
  reply:`WUB. WUB. WUUUUB. You're a legend. I'm naming a track after you.`},
{ id:'reese', ch:'bass', challenge:true, tol:3, tolShape:1.2, title:'Reese', concept:'Challenge', client:'Night Shift', role:'Drum & bass crew',
  unlock:[], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:33, gate:1.6, dur:2.0,
  brief:`We need that dark, growling, slowly churning bass that sounds like two engines slightly out of sync. Low, wide, menacing. Hold it and let it churn.`,
  manual:`<h4>Challenge: the Reese</h4>
  <p>A classic drum & bass sound. No parts list. Think about what makes a sound "churn" by itself, without an LFO.</p>
  <ul><li>Two of something, slightly disagreeing.</li><li>Darker than raw.</li><li>Holds while the key is down.</li></ul>
  <div class="tip">The speed of the churn tells you how far apart things are. Listen to how fast it rolls.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth',fine:16}},{id:'o2',type:'osc',p:{wave:'sawtooth',fine:-16}},{id:'f',type:'filter',p:{cutoff:700,res:0.2}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.01,d:0.3,s:0.9,r:0.2}}],
    cables:['o.out>f.in','o2.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`That's the growl. The whole rave is going to feel that in their teeth.`},
/* ---------------- PADS ---------------- */
{ id:'slow-bloom', ch:'pads', title:'Slow Bloom', concept:'Pad envelopes', client:'Mira Glass', role:'Ambient composer',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1}, note:45, gate:1.6, dur:3.2,
  brief:`I score films about fog. I need a warm pad that swells in slowly, like a breath, holds, and then lingers after the note ends. Not too bright.`,
  manual:`<h4>Pads</h4>
  <p>A <b>pad</b> is a long, soft, sustained sound that fills space behind a song. The envelope does most of the work:</p>
  <ul><li><b>Slow attack</b> so it fades in instead of starting abruptly.</li><li><b>High sustain</b> so it holds while the key is down.</li><li><b>Long release</b> so it trails off after.</li></ul>
  <p>You'll need a filter too: pads are usually darker than a raw saw.</p>
  <div class="tip">Build the signal chain <code>OSC → FILTER → VCA → OUTPUT</code>. Get the tone right with the filter first, then shape loudness with the envelope.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1100,res:0.15}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.85,d:0.5,s:0.7,r:1.2}}], cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`It breathes. It actually breathes. The fog thanks you.`},
{ id:'glass', ch:'pads', title:'Glass Pad', concept:'Layering', client:'Hana Mori', role:'Meditation app designer',
  unlock:[], palette:{osc:2,filter:1,vca:1,env:1}, note:57, gate:1.4, dur:2.8,
  brief:`Our "breathe in" sound needs to feel like light through glass. Soft, clear, a little shimmer on top. It should fade in gently and float away after.`,
  manual:`<h4>Layering oscillators</h4>
  <p>Two oscillators patched into the same input get <b>mixed</b>. Stack different shapes or octaves and you get a new, richer timbre that neither has alone.</p>
  <ul><li>A soft wave for the body, plus a purer one an <b>octave up</b> for shimmer.</li><li>Feed both into one VCA so a single envelope shapes them together.</li></ul>
  <div class="tip">The spectrum shows layers clearly: an octave-up layer adds a peak at twice the frequency of the base note.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'o2',type:'osc',p:{wave:'sine',oct:1}},{id:'v',type:'vca',p:{level:0.7}},{id:'e',type:'env',p:{a:0.5,d:0.4,s:0.8,r:1.0}}],
    cables:['o.out>v.in','o2.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Breathe in… breathe out… it's gorgeous. Our users are going to fall asleep mid-session (that's a compliment).`},
{ id:'breathing', ch:'pads', tol:3, tolShape:1.2, title:'Breathing Pad', concept:'Slow LFO', client:'Mira Glass', role:'Ambient composer, back again',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1,lfo:1}, note:45, gate:2.4, dur:3.4,
  brief:`The fog film has a scene where the house itself is breathing. I need a pad whose tone slowly opens and closes, like air moving in and out. Slow. Patient.`,
  manual:`<h4>Slow modulation</h4>
  <p>An LFO doesn't have to be fast. At under 1 Hz it stops sounding like a wobble and starts sounding like <b>breathing</b>: one long swell every second or two.</p>
  <ul><li>Point the LFO at the filter's <b>CUT</b> jack.</li><li>A <b>triangle</b> LFO rises and falls evenly, like a breath.</li><li>The filter's MOD AMT sets how far each breath opens.</li></ul>
  <div class="tip">Count the swells in the target across the whole note. That tells you the rate.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:600,res:0.3,cutAmt:1800}},{id:'l',type:'lfo',p:{wave:'triangle',rate:0.5}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.6,d:0.3,s:0.9,r:1.0}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','l.out>f.cut']},
  reply:`The house breathes. The director cried. I may have also cried.`},
{ id:'strings', ch:'pads', challenge:true, tol:3, tolShape:1.2, title:'String Section', concept:'Challenge', client:'Old Town Orchestra', role:'Budget edition',
  unlock:[], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:45, gate:1.8, dur:2.8,
  brief:`Our string players are all on vacation. We need a lush, warm string section: wide like many players, bowed in softly, warm not fizzy, and a gentle tail.`,
  manual:`<h4>Challenge: synth strings</h4>
  <p>No parts list. Think about what "many players" sounds like, versus one.</p>
  <ul><li>Many players are never perfectly in tune with each other.</li><li>Real strings are bright, but recordings of them are warm.</li><li>Bows don't start instantly.</li></ul>
  <div class="tip">You've already built every piece of this somewhere else. Combine them.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth',fine:7}},{id:'o2',type:'osc',p:{wave:'sawtooth',fine:-7}},{id:'f',type:'filter',p:{cutoff:2000,res:0.1}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.35,d:0.5,s:0.85,r:0.7}}],
    cables:['o.out>f.in','o2.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Lush! The conductor didn't notice. Please don't tell the conductor.`},
/* ---------------- LEADS ---------------- */
{ id:'brass', ch:'leads', title:'Brass Stab', concept:'Filter attack', client:'The Horn Section That Isn\'t', role:'Funk band, zero horn players',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2}, note:57, gate:1.0, dur:1.4,
  brief:`We can't afford a horn section, so you're it. Brassy, punchy. It should "blat" open a split second after the note starts, then settle a bit.`,
  manual:`<h4>Brass: the filter blooms</h4>
  <p>When a trumpeter blows, the tone gets <b>brighter</b> as the note starts, not instantly but over a few tens of milliseconds. Synth brass copies that with a filter envelope that has a <b>short attack</b>.</p>
  <ul><li>Filter envelope: a little <b>attack</b>, a decay to a mid <b>sustain</b>.</li><li>Volume envelope: quick attack, high sustain.</li><li>A saw has the bright harmonics brass needs.</li></ul>
  <div class="tip">Compare this with a pluck: same parts, different envelope shapes. That's the whole difference between a pluck and a horn.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:500,res:0.15,cutAmt:2700}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.03,d:0.3,s:0.8,r:0.2}},{id:'e2',type:'env',p:{a:0.06,d:0.35,s:0.45,r:0.2}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','e2.out>f.cut']},
  reply:`BLAT! BLAT-BLAT! The crowd thinks we hired horns. We are never hiring horns.`},
{ id:'supersaw', ch:'leads', tol:3, title:'Neon Avenue', concept:'Detune', client:'Neon Avenue', role:'Synthwave duo, sunglasses indoors',
  unlock:['fine'], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:45, gate:1.8, dur:2.0,
  brief:`Our lead needs to be BIG. Wide, shimmering, like two synths playing at once. One oscillator sounds thin next to the reference.`,
  manual:`<h4>Detuning</h4>
  <p>Two oscillators on the same note sound like one louder oscillator. Pull them slightly apart with <b>FINE</b> tuning (in cents, 1/100 of a semitone) and they drift in and out of phase. You hear a slow shimmer called <b>beating</b>.</p>
  <ul><li>A few cents apart: gentle chorus.</li><li>10–20 cents apart: thick and wide, the "supersaw."</li><li>Way more: sounds out of tune.</li></ul>
  <p>Patch both oscillators into the same input. Signals patched into one jack get <b>mixed</b> together.</p>
  <div class="tip">The speed of the beating tells you the total detune. Detune one oscillator up and the other down by the same amount.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth',fine:9}},{id:'o2',type:'osc',p:{wave:'sawtooth',fine:-9}},{id:'f',type:'filter',p:{cutoff:2600,res:0.1}}], cables:['o.out>f.in','o2.out>f.in','f.out>out.in']},
  reply:`We put on our sunglasses. Then we put on another pair. Incredible.`},
{ id:'flute', ch:'leads', tol:3, tolShape:1.2, title:'Night Flute', concept:'Expressive lead', client:'Pan Pipes Pete', role:'Busker, subway platform 4',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1,lfo:1}, note:57, gate:1.6, dur:2.0,
  brief:`My flute got stolen. I need something soft and airy up high, that breathes in gently and has a little singer's wobble on long notes. Make the commuters stop and listen.`,
  manual:`<h4>Making a lead expressive</h4>
  <p>Lead sounds carry the melody, so small human details matter:</p>
  <ul><li>A soft <b>attack</b>, like breath building up.</li><li>Gentle <b>vibrato</b> from an LFO on pitch, a fraction of a semitone.</li><li>A pure-ish wave (triangle) with the top end softened.</li></ul>
  <div class="tip">Vibrato depth is subtle here. Get the rate first, then raise the depth until the wobble matches.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',oct:1,pitchAmt:25}},{id:'l',type:'lfo',p:{wave:'sine',rate:5}},{id:'f',type:'filter',p:{cutoff:2500,res:0.1}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.12,d:0.2,s:0.85,r:0.2}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','l.out>o.pitch']},
  reply:`Three people missed their train listening. I made forty bucks. Here's twenty.`},
{ id:'stadium', ch:'leads', challenge:true, tol:3, tolShape:1.2, title:'Stadium Lead', concept:'Challenge', client:'Neon Avenue', role:'Back for the encore',
  unlock:[], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:57, gate:1.6, dur:2.0,
  brief:`Encore time. We want a lead that fills a stadium: two different voices stacked an octave apart, a touch of chorus, singing vibrato, and a warm top. Big!`,
  manual:`<h4>Challenge: the big lead</h4>
  <p>No parts list. Everything here you've done before, just all at once:</p>
  <ul><li>Two layers with <i>different</i> shapes, an octave apart.</li><li>A tiny bit of detune between them.</li><li>Vibrato on both (one LFO can feed two pitch jacks).</li><li>A filter to tame the top, and a volume shape.</li></ul>
  <div class="tip">Use the oscilloscope: two different wave shapes added together make a distinctive combined shape.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth',fine:5,pitchAmt:18}},{id:'o2',type:'osc',p:{wave:'square',oct:1,fine:-5,pitchAmt:18}},{id:'l',type:'lfo',p:{wave:'sine',rate:5.5}},{id:'f',type:'filter',p:{cutoff:2400,res:0.2}},{id:'v',type:'vca',p:{level:0.75}},{id:'e',type:'env',p:{a:0.02,d:0.4,s:0.8,r:0.3}}],
    cables:['o.out>f.in','o2.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','l.out>o.pitch','l.out>o2.pitch']},
  reply:`Twenty thousand phone lights in the air. That was YOUR sound. Thank you, friend.`},
/* ---------------- PERC ---------------- */
{ id:'kick', ch:'perc', tol:1.5, title:'Kick It', concept:'Pitch envelope', client:'MC Thump', role:'Rapper, needs drums yesterday',
  unlock:[], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:33, gate:0.4, dur:0.9,
  start:[{id:'p1',type:'osc',slot:0,locked:1,p:{wave:'sine'}},{id:'p2',type:'vca',slot:1,locked:1,p:{level:1}},{id:'p3',type:'env',slot:3,locked:1,p:{a:0.001,d:0.42,s:0,r:0.1}}],
  startCables:['p1.out>p2.in','p2.out>out.in','p3.out>p2.gain'],
  presetNote:`Preset on your rack: a sine OSC → VCA → OUTPUT with a short volume envelope. Right now it's just a dull "boom". Add the pitch drop that makes it punch.`,
  brief:`My drum machine got stolen. I need a kick drum. Deep boom, with that punchy "dooom" drop at the start. Can a synth even do drums?`,
  manual:`<h4>Drums from scratch</h4>
  <p>A kick drum is mostly a <b>sine wave whose pitch drops fast</b>. Point an envelope at the oscillator's <b>PITCH</b> jack:</p>
  <ul><li>The OSC's <b>MOD AMT</b> sets how high the pitch starts (in semitones above the note).</li><li>A very short <b>decay</b> with zero sustain makes the pitch fall quickly to the base note.</li><li>A second envelope on a VCA gives the boom a short, punchy fade.</li></ul>
  <div class="tip">Synth drums are all envelopes. Fast attack, no sustain, and the decay times do the work.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine',pitchAmt:3000}},{id:'v',type:'vca',p:{level:1}},{id:'e',type:'env',p:{a:0.001,d:0.42,s:0,r:0.1}},{id:'e2',type:'env',p:{a:0.001,d:0.07,s:0,r:0.05}}],
    cables:['o.out>v.in','v.out>out.in','e.out>v.gain','e2.out>o.pitch']},
  reply:`BOOM. Okay. Okay okay okay. Synth drums are real. I owe you a verse.`},
{ id:'tom', ch:'perc', tol:1.5, title:'Floor Tom', concept:'Tuning drums', client:'MC Thump', role:'Back for more drums',
  unlock:[], palette:{osc:1,noise:1,filter:1,vca:1,env:2}, note:43, gate:0.5, dur:1.0,
  brief:`The kick slaps. Now I need a tom for fills: a higher "dum" with a shorter little pitch drop and a longer ring than the kick. Tuned to G.`,
  manual:`<h4>Drums have pitch too</h4>
  <p>A tom is built just like a kick (sine, pitch envelope, volume envelope) but <b>tuned higher</b>, with a <b>smaller pitch drop</b> and a <b>longer ring</b>.</p>
  <ul><li>OSC MOD AMT sets how far above the note the drop starts.</li><li>Pitch envelope: very fast decay, zero sustain.</li><li>Volume envelope: longer decay than a kick.</li></ul>
  <div class="tip">No presets this time. You're building the whole drum yourself.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine',pitchAmt:900}},{id:'v',type:'vca',p:{level:1}},{id:'e',type:'env',p:{a:0.001,d:0.55,s:0,r:0.15}},{id:'e2',type:'env',p:{a:0.001,d:0.12,s:0,r:0.05}}],
    cables:['o.out>v.in','v.out>out.in','e.out>v.gain','e2.out>o.pitch']},
  reply:`Ba-dum-dum-dum TSSS. Okay I need a cymbal now. Kidding. (Not kidding.)`},
{ id:'snare', ch:'perc', tol:1.5, title:'Snare Crack', concept:'Noise', client:'Rimshot Rita', role:'Session drummer, broken wrist',
  unlock:['noise'], palette:{osc:2,noise:1,filter:1,vca:1,env:2,lfo:1}, note:50, gate:0.3, dur:0.7,
  brief:`I can't play for six weeks and I've got a session Monday. I need a snare: a tight, bright crack of hiss with a little body tone underneath. Short!`,
  manual:`<h4>Noise</h4>
  <p>A <b>noise</b> source outputs random values: every frequency at once, no pitch. It's the raw material for snares, hi-hats, wind, breath and static.</p>
  <ul><li>Filter noise to shape it: <b>high-pass</b> for crisp hats and snare sizzle, <b>low-pass</b> for rumble.</li><li>Mix in a short <b>tone</b> for the drum's body.</li><li>One envelope on one VCA can shape both at once if you patch them both into the VCA.</li></ul>
  <div class="tip">Final exam: combine everything. The spectrum shows the tone as a spike and the noise as a wide plateau.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'f',type:'filter',p:{type:'highpass',cutoff:1400,res:0.1}},{id:'o',type:'osc',p:{wave:'triangle'}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.001,d:0.16,s:0,r:0.08}}],
    cables:['n.out>f.in','f.out>v.in','o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`CRACK. That'll fool the producer for sure. Studio's yours whenever you want it. You're not struggling anymore, kid. You're a sound designer.`},
{ id:'hat', ch:'perc', tol:1.5, title:'Hi-Hat', concept:'Short envelopes', client:'Rimshot Rita', role:'Session drummer, wrist healing',
  unlock:[], palette:{osc:1,noise:1,filter:1,vca:1,env:1}, note:50, gate:0.25, dur:0.4,
  brief:`The snare saved my session. Now the hi-hat: a tiny, tight "tss". Super short, super bright, no body at all.`,
  manual:`<h4>Hi-hats: noise, bright and brief</h4>
  <p>A closed hi-hat is mostly <b>very high noise</b> for a <b>very short time</b>.</p>
  <ul><li>High-pass the noise hard: only the fizz should remain.</li><li>The volume envelope's decay is tiny, tens of milliseconds.</li><li>A longer decay turns it into an <b>open</b> hat.</li></ul>
  <div class="tip">On the loudness graph a closed hat is a thin spike. Make yours as thin as the target's.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'f',type:'filter',p:{type:'highpass',cutoff:7000,res:0.1}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.001,d:0.05,s:0,r:0.04}}],
    cables:['n.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Tss-tss-tss. Crisp as a fresh chip. My producer is none the wiser.`},
{ id:'cowbell', ch:'perc', challenge:true, tol:1.5, title:'Cowbell', concept:'Challenge', client:'Bo Vine', role:'Percussionist, very serious about cowbell',
  unlock:[], palette:{osc:2,noise:1,filter:1,vca:1,env:2,lfo:1}, note:73, gate:0.3, dur:0.6,
  brief:`The classic drum-machine cowbell. Metallic, a little hollow, clangy, and short. Two tones that don't quite belong together. The world needs it.`,
  manual:`<h4>Challenge: metal from squares</h4>
  <p>No parts list. Metallic sounds come from tones that <b>aren't</b> neat harmonics of each other.</p>
  <ul><li>Two hollow-sounding oscillators about a fifth apart.</li><li>A band-pass to focus the clang.</li><li>A short, percussive volume shape.</li></ul>
  <div class="tip">The spectrum shows two families of peaks. Find the second tone's interval from where its peaks sit.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square'}},{id:'o2',type:'osc',p:{wave:'square',semi:7}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:1600,res:0.2}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.001,d:0.25,s:0,r:0.05}}],
    cables:['o.out>f.in','o2.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`CLONK. Exquisite. I will be playing this on every single track. Every one.`},
/* ---------------- FX ---------------- */
{ id:'laser', tol:2.5, tolShape:1.5, ch:'fx', title:'Laser Zap', concept:'Pitch sweeps', client:'Bitcrush Bros.', role:'Back with a space level',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:57, gate:0.35, dur:0.6,
  brief:`Space level! Our ship's blaster needs a "pew": starts way up high, dives down fast, gone in a blink. Retro, buzzy.`,
  manual:`<h4>Sweeping pitch</h4>
  <p>The kick drum used a pitch envelope to make a thump. Push it much further and much higher and the same trick becomes a <b>laser</b>.</p>
  <ul><li>Big OSC MOD AMT: start several octaves above the note.</li><li>Pitch envelope: fast decay, zero sustain.</li><li>Volume envelope: short.</li><li>A square or saw keeps it buzzy and retro.</li></ul>
  <div class="tip">On the scope a laser looks like a squeezed wave. Match the drop speed using the spectrum and the loudness length.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square',oct:1,pitchAmt:3600}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.001,d:0.3,s:0,r:0.05}},{id:'e2',type:'env',p:{a:0.001,d:0.22,s:0,r:0.05}}],
    cables:['o.out>v.in','v.out>out.in','e.out>v.gain','e2.out>o.pitch']},
  reply:`PEW PEW PEW. We've been firing it for an hour. Nobody is working.`},
{ id:'siren', tol:5, tolShape:1.2, ch:'fx', title:'Siren', concept:'Square LFO', client:'Fire Hall 9', role:'Charity haunted house',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1,lfo:1}, note:57, gate:2.2, dur:2.4,
  brief:`Our haunted house needs an old-school alarm: two notes jumping back and forth, "wee-woo wee-woo". Loud, steady, a bit unnerving.`,
  manual:`<h4>LFO shapes matter</h4>
  <p>A <b>sine</b> LFO glides smoothly. A <b>square</b> LFO <b>jumps</b> between two values, so on pitch it flips between two notes.</p>
  <ul><li>LFO RATE: how many flips per second.</li><li>OSC MOD AMT: how far apart the two notes are (the LFO swings up and down from the base pitch).</li></ul>
  <div class="tip">Listen for the interval between the two notes. MOD AMT is how far each one sits from the base note, so the distance between them is twice that.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',oct:1,pitchAmt:500}},{id:'l',type:'lfo',p:{wave:'square',rate:1.5}}], cables:['o.out>out.in','l.out>o.pitch']},
  reply:`Wee-woo! Three volunteers screamed during the test. Ten out of ten.`},
{ id:'wind', ch:'fx', tol:3, tolShape:1.2, title:'Wind', concept:'Filtered noise', client:'Mira Glass', role:'Ambient composer, fog film part III',
  unlock:[], palette:{osc:1,noise:1,filter:1,vca:1,env:1,lfo:1}, note:45, gate:2.6, dur:3.4,
  brief:`Last one for the fog film: wind. Not a storm, a lonely gust that rises and whistles and falls, swelling in and fading out.`,
  manual:`<h4>Sculpting noise</h4>
  <p>Noise is every frequency at once. A <b>resonant band-pass</b> picks a slice of it and makes it whistle. Move that slice slowly and you get wind.</p>
  <ul><li>NOISE → band-pass FILTER with some resonance.</li><li>A slow LFO on the filter's CUT jack makes the gust rise and fall.</li><li>A slow volume envelope fades it in and out.</li></ul>
  <div class="tip">The spectrum shows a hump of noise. Match its centre with the cutoff and its width with resonance.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:700,res:0.5,cutAmt:1800}},{id:'l',type:'lfo',p:{wave:'sine',rate:0.4}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.6,d:0.3,s:0.9,r:0.8}}],
    cables:['n.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','l.out>f.cut']},
  reply:`I closed my eyes and felt cold. That's the sound. The film is finished. Thank you.`},
{ id:'ufo', tol:5, tolShape:1.2, ch:'fx', challenge:true, title:'Close Encounter', concept:'Challenge', client:'Space Cadet Comics', role:'Sci-fi podcast',
  unlock:[], palette:{osc:2,noise:1,filter:1,vca:1,env:2,lfo:1}, note:57, gate:2.0, dur:2.8,
  brief:`Our UFO lands at the start of every episode. A high, warbling, slightly muffled hum that fades in as it descends and hangs in the air. Eerie, not scary.`,
  manual:`<h4>Challenge: the flying saucer</h4>
  <p>No parts list. Break the brief into pieces:</p>
  <ul><li>"Warbling": fast, wide pitch movement.</li><li>"High hum": a soft wave, up an octave.</li><li>"Slightly muffled": something takes the edge off.</li><li>"Fades in, hangs": a volume shape.</li></ul>
  <div class="tip">A warble is faster and wider than vibrato. Count the cycles on the scope and in the spectrum's smear.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',oct:1,pitchAmt:400}},{id:'l',type:'lfo',p:{wave:'triangle',rate:7}},{id:'f',type:'filter',p:{cutoff:1500,res:0.4}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.5,d:0.3,s:0.9,r:0.6}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','l.out>o.pitch']},
  reply:`Our listeners say it gives them goosebumps. Great, goosebumps are the brand.`},
/* ---------------- MIX DESK ---------------- */
{ id:'sub-layer', ch:'mix', title:'Sub Layer', concept:'Mixing sources', client:'Tamsin Okafor', role:'Bedroom pop producer',
  unlock:[], palette:{osc:2,mixer:1}, note:45, gate:1.2, dur:1.4,
  brief:`My saw bass sounds fizzy on laptop speakers and thin on the club system. Can you put a clean sine an octave below it, so it's got weight underneath? The saw should still be the star, just quieter.`,
  manual:`<h4>The mixer</h4>
  <p>Until now one cable carried one sound. A <b>MIXER</b> takes up to three signals and adds them together, each with its own <b>LEVEL</b> knob.</p>
  <ul><li>Two oscillators into IN 1 and IN 2, then the mixer's OUT to OUTPUT.</li><li>A sine one octave down (OCT −1) is called a <b>sub</b>. It adds weight without adding buzz.</li><li>The level knobs set the <i>balance</i>. Listen for which layer is in front.</li></ul>
  <div class="tip">In the spectrum, the sub is the lone peak to the left of the saw's comb. Match its height with that channel's level.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'s',type:'osc',p:{wave:'sine',oct:-1}},{id:'m',type:'mixer',p:{l1:0.45,l2:0.9,l3:0.8}}],
    cables:['o.out>m.in1','s.out>m.in2','m.out>out.in']},
  reply:`It finally sounds the same in my headphones and in the car. Witchcraft.`},
{ id:'breath', ch:'mix', title:'Breath & Tone', concept:'Mixing noise', client:'Ana Lucía Ríos', role:'Ambient flautist',
  unlock:['ftype'], palette:{osc:1,noise:1,filter:1,mixer:1}, note:69, gate:1.2, dur:1.4,
  brief:`A real flute isn't a pure tone. There's air in it, a little hiss riding on top of the note. Give me a soft, pure tone with a thin breath of high air mixed underneath it.`,
  manual:`<h4>Mixing noise with a tone</h4>
  <p>Acoustic instruments are rarely one clean wave. A flute is a near-sine plus <b>breath noise</b>, and that noise is part of what makes it sound real.</p>
  <ul><li>A soft wave for the tone.</li><li>NOISE through a <b>high-pass</b> FILTER keeps only the airy top end.</li><li>Mix them, with the breath much quieter than the tone.</li></ul>
  <div class="tip">Start with the breath level at zero, match the tone, then bring the breath up until the spectrum's high hiss matches.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'n',type:'noise',p:{}},{id:'f',type:'filter',p:{type:'highpass',cutoff:3500,res:0.1}},{id:'m',type:'mixer',p:{l1:0.85,l2:0.18,l3:0.8}}],
    cables:['o.out>m.in1','n.out>f.in','f.out>m.in2','m.out>out.in']},
  reply:`I can hear the room in it. Recording the whole album this way.`},
{ id:'layer-cake', ch:'mix', challenge:true, tol:3, tolShape:1.2, title:'Layer Cake', concept:'Challenge', client:'Tamsin Okafor', role:'Back with a bigger budget',
  unlock:[], palette:{osc:3,mixer:1,filter:1,vca:1,env:1}, note:45, gate:0.9, dur:1.3,
  brief:`Remember my sub trick? Now I want the whole cake. Two bright layers slightly out of tune with each other, a sub underneath, all of it softened a little and shaped into a punchy note that holds.`,
  manual:`<h4>Challenge: build a layered voice</h4>
  <p>No parts list. Things to listen for:</p>
  <ul><li>How many layers? Which one is the sub?</li><li>"Slightly out of tune": a slow beating between the bright layers.</li><li>"Softened": the top end is rolled off <i>after</i> the layers meet.</li><li>"Punchy, holds": a volume shape.</li></ul>
  <div class="tip">Mix first, then process the mix. One filter after the mixer treats every layer the same way.</div>`,
  target:{mods:[{id:'a',type:'osc',p:{wave:'sawtooth',fine:-9}},{id:'b',type:'osc',p:{wave:'sawtooth',fine:9}},{id:'s',type:'osc',p:{wave:'sine',oct:-1}},{id:'m',type:'mixer',p:{l1:0.5,l2:0.5,l3:0.85}},
      {id:'f',type:'filter',p:{cutoff:1300,res:0.15}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.3,s:0.65,r:0.2}}],
    cables:['a.out>m.in1','b.out>m.in2','s.out>m.in3','m.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Three layers, one voice. The label wants to know who my new sound designer is.`},
/* ---------------- HARMONICS LAB ---------------- */
{ id:'octave-up', ch:'harm', tol:0.7, title:'Octave Up', concept:'Harmonics', client:'Prof. Ingrid Halvorsen', role:'Acoustics lecturer',
  unlock:[], palette:{harm:1}, note:57, gate:1.2, dur:1.4,
  brief:`I'm teaching first-years what a harmonic is. I need a pure tone, then the same tone with its second harmonic added at half strength, so they can hear the colour change without the pitch changing.`,
  manual:`<h4>What a harmonic is</h4>
  <p>Every pitched sound is a stack of sine waves. The lowest is the <b>fundamental</b> (H1), which is the note you hear. Above it sit <b>harmonics</b> at 2×, 3×, 4×… the frequency.</p>
  <p>The <b>HARMONIC</b> oscillator gives you six drawbars, one per harmonic. Pull a bar up to add that sine.</p>
  <ul><li>H2 is one octave above the note. H4 is two octaves up.</li><li>Adding harmonics changes the <b>timbre</b> (colour), not the pitch.</li></ul>
  <div class="tip">Each bar is one peak in the spectrum. Match the heights of the peaks.</div>`,
  target:{mods:[{id:'h',type:'harm',p:{h1:1,h2:0.5,h3:0,h4:0,h5:0,h6:0}}], cables:['h.out>out.in']},
  reply:`Thirty students just said "ohhh" at the same time. Best lecture of the year.`},
{ id:'build-square', ch:'harm', tol:0.7, title:'Build a Square', concept:'Odd harmonics', client:'Prof. Ingrid Halvorsen', role:'Acoustics lecturer, week 2',
  unlock:[], palette:{harm:1}, note:57, gate:1.2, dur:1.4,
  brief:`This week: why a square wave sounds hollow. Build me something square-ish from sines, using only the odd harmonics and letting each one get quieter as you go up.`,
  manual:`<h4>Odd harmonics</h4>
  <p>A square wave contains <b>only the odd harmonics</b>, H1, H3, H5…, and each one is quieter than the last: H3 at 1/3 strength, H5 at 1/5.</p>
  <ul><li>H1 full, H3 about 33%, H5 about 20%.</li><li>Leave the even bars (H2, H4, H6) at zero.</li><li>Missing even harmonics are what makes a square sound <b>hollow</b> or woody, like a clarinet.</li></ul>
  <div class="tip">Watch the scope as you add H3 and H5. The sine starts to flatten into a square.</div>`,
  target:{mods:[{id:'h',type:'harm',p:{h1:1,h2:0,h3:0.33,h4:0,h5:0.2,h6:0}}], cables:['h.out>out.in']},
  reply:`They saw the square appear on the scope. One student is now changing majors.`},
{ id:'build-saw', ch:'harm', tol:0.7, title:'Build a Saw', concept:'Additive synthesis', client:'Prof. Ingrid Halvorsen', role:'Acoustics lecturer, week 3',
  unlock:[], palette:{harm:1}, note:57, gate:1.2, dur:1.4,
  brief:`Final lecture. Now use <i>every</i> harmonic, each one weaker than the last, and build the bright, buzzy one. The class will compare it to the real thing.`,
  manual:`<h4>Additive synthesis</h4>
  <p>A sawtooth contains <b>every</b> harmonic, each at 1/n strength: H2 at 1/2, H3 at 1/3, and so on. Building sounds by stacking sines like this is called <b>additive synthesis</b>.</p>
  <ul><li>H1 100%, H2 50%, H3 33%, H4 25%, H5 20%, H6 17%.</li><li>Six bars is only the start of a saw. A real one keeps going forever, so yours will sound a little softer.</li></ul>
  <div class="tip">So far you've started with a bright wave and filtered harmonics away. That's subtractive synthesis. This lab builds the sound up instead.</div>`,
  target:{mods:[{id:'h',type:'harm',p:{h1:1,h2:0.5,h3:0.33,h4:0.25,h5:0.2,h6:0.17}}], cables:['h.out>out.in']},
  reply:`Course evaluations are in: "would build a saw again." Thank you.`},
{ id:'drawbar', ch:'harm', challenge:true, title:'Drawbar Organ', concept:'Challenge', client:'Rev. Clement Ashby', role:'Gospel organist',
  unlock:[], palette:{harm:1,vca:1,env:1,reverb:1}, note:57, gate:1.1, dur:1.5,
  brief:`Our old organ died on Sunday. I need its voice: strong fundamental, a lot of the octave above it, a hint of the bright stuff on top. It speaks instantly and stops the moment you let go.`,
  manual:`<h4>Challenge: the organ</h4>
  <p>No parts list. An organ is additive synthesis in a wooden box. Each drawbar is a pipe at a harmonic of the note.</p>
  <ul><li>Read the spectrum peak by peak. Which harmonics are there, and how loud?</li><li>"Speaks instantly, stops the moment you let go": what volume shape is that?</li></ul>
  <div class="tip">The loudness graph is a flat-topped box. That's your envelope.</div>`,
  target:{mods:[{id:'h',type:'harm',p:{h1:0.9,h2:0.75,h3:0.2,h4:0.5,h5:0,h6:0.3}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.004,d:0.1,s:1,r:0.03}}],
    cables:['h.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`The choir didn't notice the organ had changed. Highest compliment I can give.`},
/* ---------------- FM STUDIO ---------------- */
{ id:'metal-ring', ch:'fm', title:'Metal Ring', concept:'Frequency modulation', client:'Juno Takahashi', role:'Industrial percussionist',
  unlock:['fm'], palette:{osc:2}, note:57, gate:1.2, dur:1.4,
  brief:`I hit sheet metal for a living. I need a synth sound that's clangy and inharmonic like that, but steady. A metallic drone I can play over.`,
  manual:`<h4>FM: one oscillator wobbling another</h4>
  <p>An LFO on the PITCH jack gives vibrato, a slow wobble. Plug an <b>audio-rate</b> oscillator into another oscillator's <b>FM</b> jack and the wobble is so fast you hear it as new tones called <b>sidebands</b>.</p>
  <ul><li>The oscillator you hear is the <b>carrier</b>. The one plugged into its FM jack is the <b>modulator</b>.</li><li><b>FM AMT</b> on the carrier sets how hard it's wobbled. More gives more sidebands and more brightness.</li><li>The <b>ratio</b> of their pitches decides the flavour. Whole-number ratios sound musical. Odd ratios like +6 semitones sound metallic.</li></ul>
  <div class="tip">Both are sines. All the complexity comes from the modulation.</div>`,
  target:{mods:[{id:'c',type:'osc',p:{wave:'sine',fmAmt:350}},{id:'m',type:'osc',p:{wave:'sine',semi:6}}], cables:['m.out>c.fm','c.out>out.in']},
  reply:`It sounds like a bridge humming in the wind. I'm building a whole set around it.`},
{ id:'fm-bell', ch:'fm', title:'Bell Tower', concept:'FM bells', client:'Sister Perpetua', role:'Carillon restoration fund',
  unlock:[], palette:{osc:2,vca:1,env:1}, note:69, gate:0.15, dur:2.4,
  brief:`Our bells are being repaired for a year and the village misses them. We need a bell for the recordings: a bright metallic strike that rings out and fades slowly.`,
  manual:`<h4>FM bells</h4>
  <p>Bells have <b>inharmonic</b> overtones that don't line up with the note. FM makes these easily: use a modulator at a non-whole-number ratio above the carrier.</p>
  <ul><li>Carrier: a sine at the note. Modulator: a sine well above it. Try +1 octave plus some semitones.</li><li>A VCA and envelope give the strike: instant attack, long decay, no sustain.</li></ul>
  <div class="tip">Short gate, long ring. The decay and release do all the work after the strike.</div>`,
  target:{mods:[{id:'c',type:'osc',p:{wave:'sine',fmAmt:700}},{id:'m',type:'osc',p:{wave:'sine',oct:1,semi:10}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.002,d:2.2,s:0,r:2.2}}],
    cables:['m.out>c.fm','c.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Old Mrs. Kowalski cried at the first strike. In a good way. We think.`},
{ id:'epiano', ch:'fm', title:'Electric Piano', concept:'Modulation envelope', client:'Luther Banks', role:'Soul keys player',
  unlock:['mod'], palette:{osc:2,vca:2,env:2}, note:57, gate:0.9, dur:1.6,
  brief:`I need that glassy electric piano from 80s ballads. Bright and bell-like when you hit the key, then it mellows into a soft round tone as it rings.`,
  manual:`<h4>Brightness that changes over time</h4>
  <p>FM AMT is fixed. To make the brightness <b>move</b>, put a VCA between the modulator and the carrier's FM jack and drive that VCA with an envelope.</p>
  <ul><li>The modulator at the same pitch as the carrier (ratio 1:1) gives a warm, harmonic tone.</li><li><b>Modulation envelope</b>: fast decay to zero, so the bright "tine" only happens on the strike.</li><li><b>Volume envelope</b>: a longer decay on the carrier's own VCA.</li></ul>
  <div class="tip">Two envelopes, two jobs. Get the volume right first, then add the strike.</div>`,
  target:{mods:[{id:'c',type:'osc',p:{wave:'sine',fmAmt:900}},{id:'m',type:'osc',p:{wave:'sine'}},{id:'mv',type:'vca',p:{level:1}},{id:'me',type:'env',p:{a:0.002,d:0.35,s:0,r:0.2}},
      {id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:1.4,s:0.25,r:0.35}}],
    cables:['m.out>mv.in','mv.out>c.fm','me.out>mv.gain','c.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Lights down, lighters up. That's the ballad sound. Thank you, friend.`},
{ id:'gong', ch:'fm', challenge:true, tol:1.5, tolShape:1.2, title:'Temple Gong', concept:'Challenge', client:'Meridian Yoga', role:'Sound bath studio',
  unlock:[], palette:{osc:2,vca:2,env:2}, note:40, gate:0.3, dur:2.8,
  brief:`We open every class with a gong. Ours got stolen. I need one that's deep and metallic, and the shimmer should <i>swell</i> after the hit before it all fades away.`,
  manual:`<h4>Challenge: the gong</h4>
  <p>No parts list. You've built every piece of this in FM Studio.</p>
  <ul><li>"Deep and metallic": what pitch, and what ratio?</li><li>"The shimmer swells after the hit": the brightness rises after the strike. Which envelope controls brightness, and what would make it rise slowly?</li><li>"Fades away": a long volume decay.</li></ul>
  <div class="tip">Watch the spectrum: the target gets <i>brighter</i> for a moment after the strike. That's your clue.</div>`,
  target:{mods:[{id:'c',type:'osc',p:{wave:'sine',fmAmt:500}},{id:'m',type:'osc',p:{wave:'sine',semi:6}},{id:'mv',type:'vca',p:{level:1}},{id:'me',type:'env',p:{a:0.5,d:1.5,s:0.2,r:1.5}},
      {id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.004,d:2.5,s:0,r:2.5}}],
    cables:['m.out>mv.in','mv.out>c.fm','me.out>mv.gain','c.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Thirty people breathed out at once. Namaste, and thank you.`},
/* ---------------- EFFECTS RACK ---------------- */
{ id:'slapback', ch:'fxrack', title:'Slapback', concept:'Delay', client:'Rusty Delgado', role:'Rockabilly revival',
  unlock:[], palette:{osc:1,vca:1,env:1,delay:1}, note:52, gate:0.2, dur:1.1,
  start:[{id:'o',type:'osc',slot:0,locked:1,p:{wave:'square'}},{id:'v',type:'vca',slot:1,locked:1,p:{level:0.85}},{id:'e',type:'env',slot:4,locked:1,p:{a:0.003,d:0.18,s:0,r:0.1}}],
  startCables:['o.out>v.in','v.out>out.in','e.out>v.gain'],
  presetNote:`Preset on your rack: a short plucked note. Your job is the <b>echo</b>: put a DELAY between the VCA and OUTPUT.`,
  brief:`Fifties records had that quick single echo, like the note's bouncing off the back of a tiny room. Give my pluck one fast echo, right behind it.`,
  manual:`<h4>Delay</h4>
  <p>A <b>DELAY</b> records what comes in and plays it back a moment later.</p>
  <ul><li><b>TIME</b>: how long until the echo. Around 100 ms is a quick "slap".</li><li><b>FDBK</b> (feedback): how much of the echo goes back in to echo again. Low means one echo.</li><li><b>MIX</b>: how loud the echoes are against the original (dry) sound.</li><li><b>TONE</b>: darkens each repeat.</li></ul>
  <div class="tip">On the loudness graph each echo is its own bump. Measure the gap between bumps to find TIME.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square'}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.18,s:0,r:0.1}},{id:'d',type:'delay',p:{time:0.11,fb:0.05,mix:0.45,tone:6000}}],
    cables:['o.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain']},
  reply:`Hot dang, that's the sound of a jukebox in 1956.`},
{ id:'canyon', ch:'fxrack', title:'Canyon Echo', concept:'Feedback', client:'Wren Calloway', role:'Desert folk singer',
  unlock:[], palette:{osc:1,vca:1,env:1,delay:1}, note:57, gate:0.15, dur:2.4,
  brief:`I want a pluck that echoes like I'm calling across a canyon: a slow series of repeats, each one quieter and a little duller than the last.`,
  manual:`<h4>Feedback and tone</h4>
  <p>Raise <b>FDBK</b> and each echo feeds back into the delay to make another. The higher it goes, the more repeats you get. Near 100% they'd go on forever.</p>
  <ul><li>Long TIME spaces the repeats out.</li><li>Lower <b>TONE</b> rolls off highs on every pass, so later echoes are darker, like sound fading through air.</li></ul>
  <div class="tip">Count the repeats on the loudness graph to get the feedback, then match the spacing for TIME.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.15,s:0,r:0.08}},{id:'d',type:'delay',p:{time:0.32,fb:0.6,mix:0.5,tone:2000}}],
    cables:['o.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain']},
  reply:`Hello... hello... hello... That's the one. That's the album opener.`},
{ id:'big-room', ch:'fxrack', title:'Big Room', concept:'Reverb', client:'Father Dominic Reyes', role:'Cathedral choir director',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1,reverb:1}, note:57, gate:0.25, dur:2.6,
  brief:`I want our synth parts to sound like they belong in the cathedral: a soft, short note that blooms into the stone and hangs in the air long after it's played.`,
  manual:`<h4>Reverb</h4>
  <p>In a real room, sound bounces off every surface thousands of times. Those reflections blur into a smooth tail: <b>reverb</b>.</p>
  <ul><li><b>SIZE</b>: how long the tail lasts. A small room is under a second. A cathedral is several seconds.</li><li><b>MIX</b>: how much room you hear compared to the dry note.</li></ul>
  <div class="tip">Get the dry note right first (MIX at 0), then match the tail on the loudness graph.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1400,res:0.1}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.25,s:0,r:0.1}},{id:'r',type:'reverb',p:{size:3.5,mix:0.55}}],
    cables:['o.out>f.in','f.out>v.in','v.out>r.in','r.out>out.in','e.out>v.gain']},
  reply:`It sounds like we built it into the walls. Bless you.`},
{ id:'chorus', ch:'fxrack', tol:3, title:'Chorus', concept:'Modulated delay', client:'Indigo Park', role:'Dream-pop duo',
  unlock:['mod'], palette:{osc:1,delay:1,lfo:1}, note:57, gate:1.6, dur:1.8,
  brief:`I want our synth to shimmer, like two players on the same part who aren't quite in sync. Wide, wobbly, watery. Not an echo.`,
  manual:`<h4>Chorus: a very short, moving delay</h4>
  <p>Set the delay <b>very</b> short, around 10–20 ms, and you no longer hear an echo. Then slowly move the delay time with an LFO. The copy's pitch drifts a little sharp, then a little flat, and beats against the original.</p>
  <ul><li>Feedback at zero, MIX around half.</li><li>Patch an LFO into the delay's <b>TIME</b> jack. The delay's <b>MOD</b> knob sets how far the time moves.</li><li>A slow LFO, around one cycle per second.</li></ul>
  <div class="tip">The spectrum's peaks will shimmer and smear. That smear is the chorus.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'d',type:'delay',p:{time:0.015,fb:0,mix:0.5,tone:12000,modAmt:0.008}},{id:'l',type:'lfo',p:{wave:'sine',rate:1.5}}],
    cables:['o.out>d.in','d.out>out.in','l.out>d.mod']},
  reply:`It's like swimming in it. We're naming the next EP after this patch.`},
{ id:'fuzz', ch:'fxrack', title:'Fuzz Box', concept:'Distortion', client:'Bettie Krause', role:'Garage-punk bassist',
  unlock:[], palette:{osc:1,drive:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`Your synth sounds too polite. Take a plain, smooth tone and make it FUZZY. Crunchy, square-edged, angry. But not so fizzy it hurts.`,
  manual:`<h4>Drive: making new harmonics</h4>
  <p>Filters can only <i>remove</i> harmonics. <b>Distortion</b> creates new ones. DRIVE turns the signal up into a ceiling so the peaks get squashed flat.</p>
  <ul><li>A sine pushed hard clips into something like a square: odd harmonics appear out of nowhere.</li><li><b>DRIVE</b> sets how hard it's pushed. <b>LEVEL</b> brings the volume back down.</li><li>A low-pass after the drive tames the fizz.</li></ul>
  <div class="tip">Watch the scope while you raise DRIVE. The round sine flattens at the top and bottom.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine'}},{id:'d',type:'drive',p:{drive:18,level:0.7}},{id:'f',type:'filter',p:{cutoff:1100,res:0.2}}],
    cables:['o.out>d.in','d.out>f.in','f.out>out.in']},
  reply:`My amp is scared of this patch. PERFECT.`},
{ id:'dub-stab', ch:'fxrack', challenge:true, tolShape:1.2, title:'Dub Stab', concept:'Challenge', client:'Selector Marcia', role:'Dub sound-system operator',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1,delay:1,reverb:1}, note:57, gate:0.12, dur:2.6,
  brief:`One short chord stab, honky and nasal, then it echoes off into space, each repeat darker, all of it sitting in a big wet room. You know the sound. Make it.`,
  manual:`<h4>Challenge: the dub stab</h4>
  <p>No parts list. Listen for the layers:</p>
  <ul><li>"Honky and nasal": a narrow slice of a bright wave.</li><li>"Short stab": a volume shape.</li><li>"Echoes off, each repeat darker": which effect, and which knob darkens it?</li><li>"Big wet room": one more effect at the end of the chain.</li></ul>
  <div class="tip">Order matters. The echoes should be in the room too, so the room goes last.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:900,res:0.45}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.003,d:0.12,s:0,r:0.06}},
      {id:'d',type:'delay',p:{time:0.375,fb:0.6,mix:0.45,tone:1500}},{id:'r',type:'reverb',p:{size:2.5,mix:0.3}}],
    cables:['o.out>f.in','f.out>v.in','v.out>d.in','d.out>r.in','r.out>out.in','e.out>v.gain']},
  reply:`Big up yourself. The bass bins are smiling.`},
/* ---------------- STRINGS & PLUCKS ---------------- */
{ id:'ks-string', ch:'strings', title:'Plucked String', concept:'Karplus–Strong', client:'Mirela Vasić', role:'Instrument maker',
  unlock:[], palette:{noise:1,vca:1,env:1,delay:1}, note:48, gate:0.05, dur:1.6,
  start:[{id:'n',type:'noise',slot:0,locked:1},{id:'v',type:'vca',slot:1,locked:1,p:{level:1}},{id:'e',type:'env',slot:4,locked:1,p:{a:0.001,d:0.02,s:0,r:0.01}}],
  startCables:['n.out>v.in','e.out>v.gain'],
  presetNote:`Preset on your rack: a tiny burst of noise, just a click. Run it through a DELAY tuned to the note and into OUTPUT, and it becomes a string.`,
  brief:`I build guitars by hand, and I want to show my students that a string is just energy bouncing back and forth. Can you make a plucked string out of nothing but a click?`,
  manual:`<h4>A string from a delay</h4>
  <p>Pluck a string and a wave races to the end, bounces back, and does it again, hundreds of times a second. A <b>very short delay with high feedback</b> does the same thing.</p>
  <ul><li>Set the DELAY to <b>NOTE</b>: its time becomes one cycle of the played note, so the echoes repeat fast enough to become a pitch.</li><li><b>FDBK</b> near the top keeps it ringing. That's the string's sustain.</li><li><b>TONE</b> darkens it on every pass, just as a real string loses its highs first.</li><li>MIX all the way up, so you hear only the string, not the click.</li></ul>
  <div class="tip">This trick is decades old and still one of the best plucks in synthesis. Matching feedback sets the decay. Matching tone sets the brightness.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'v',type:'vca',p:{level:1}},{id:'e',type:'env',p:{a:0.001,d:0.02,s:0,r:0.01}},{id:'d',type:'delay',p:{sync:'note',fb:0.97,mix:1,tone:6000}}],
    cables:['n.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain']},
  reply:`My students went silent, then all tried to pluck the screen. Thank you.`},
{ id:'nylon', ch:'strings', title:'Nylon', concept:'Damping', client:'Mirela Vasić', role:'Instrument maker, classical guitars',
  unlock:[], palette:{noise:1,vca:1,env:1,delay:1}, note:45, gate:0.05, dur:2.0,
  brief:`Steel strings are bright and quick. Nylon is warm and round, and it rings a little longer. Build me the nylon string from scratch this time.`,
  manual:`<h4>Damping</h4>
  <p>What a string is made of changes how fast its high harmonics die away. That's called <b>damping</b>.</p>
  <ul><li><b>TONE</b> is the damping. Lower means a warmer, softer string.</li><li><b>FDBK</b> is how long the string rings.</li><li>The burst still has to be short. A longer burst sounds like a strum or a scrape.</li></ul>
  <div class="tip">Same parts as last time, no presets. Build the click first, then the string.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'v',type:'vca',p:{level:1}},{id:'e',type:'env',p:{a:0.001,d:0.02,s:0,r:0.01}},{id:'d',type:'delay',p:{sync:'note',fb:0.985,mix:1,tone:1800}}],
    cables:['n.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain']},
  reply:`Warm as a fireplace. I'm putting this on the shop's website.`},
{ id:'harp', ch:'strings', challenge:true, tol:1.5, title:'Harp', concept:'Challenge', client:'Seren Pryce', role:'Fantasy game composer',
  unlock:[], palette:{noise:1,vca:1,env:1,delay:1,reverb:1}, note:50, gate:0.05, dur:2.4,
  brief:`I need a harp for a fairy-forest scene. Bright but gentle strings that ring for ages, softly echoing around a big, magical space.`,
  manual:`<h4>Challenge: the harp</h4>
  <p>No parts list. A harp is a plucked string with:</p>
  <ul><li>Long sustain: how much feedback?</li><li>"Bright but gentle": where does the damping sit?</li><li>"A big, magical space": one more effect after the string.</li></ul>
  <div class="tip">Build the string first and match it with the room effect off. Then add the space.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'v',type:'vca',p:{level:1}},{id:'e',type:'env',p:{a:0.001,d:0.02,s:0,r:0.01}},{id:'d',type:'delay',p:{sync:'note',fb:0.99,mix:1,tone:3500}},{id:'r',type:'reverb',p:{size:3,mix:0.35}}],
    cables:['n.out>v.in','v.out>d.in','d.out>r.in','r.out>out.in','e.out>v.gain']},
  reply:`The fairies approve. So does my producer, which is rarer.`},
/* ---------------- RANDOM & GENERATIVE ---------------- */
{ id:'bleeps', ch:'random', tol:5, title:'Computer Bleeps', concept:'Sample & hold', client:'Dr. Felix Moreau', role:'Retro sci-fi film restorer',
  unlock:['mod'], palette:{osc:1,sh:1}, note:69, gate:2.0, dur:2.0,
  brief:`The computer in our 1970s film was supposed to beep and burble randomly, but the original tape is lost. Make it think out loud: random notes, a steady patter.`,
  manual:`<h4>Sample & hold</h4>
  <p>An LFO moves smoothly. A <b>S&amp;H</b> (sample and hold) jumps to a <b>new random value</b> at every tick and holds it until the next one.</p>
  <ul><li>Patch it into the OSC's PITCH jack for random notes.</li><li><b>RATE</b>: how many new values per second.</li><li>The OSC's <b>MOD AMT</b>: how wide the random notes spread.</li></ul>
  <div class="tip">The S&amp;H here uses the same random sequence every time, so the target is repeatable. Count the steps per second on the spectrum.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square',pitchAmt:1200}},{id:'s',type:'sh',p:{rate:8}}], cables:['s.out>o.pitch','o.out>out.in']},
  reply:`BEEP BOOP. The computer lives again. Film festival in March!`},
{ id:'rand-filter', ch:'random', studio:'ladder', tol:5, title:'Random Filter', concept:'Random modulation', client:'Kit Sørensen', role:'Modular synth streamer',
  unlock:['mod','res'], palette:{osc:1,filter:1,sh:1}, note:45, gate:2.0, dur:2.0,
  brief:`My chat loves the "random filter" sound. Same note held, but the filter jumps somewhere new at every step: squelchy, bubbly, never the same twice. Well, the same twice for you, so you can match it.`,
  manual:`<h4>Random modulation</h4>
  <p>S&amp;H can drive anything an LFO can. Into a resonant filter's CUT jack, it makes the classic bubbling sound.</p>
  <ul><li>Resonance makes each new cutoff "ping".</li><li>The filter's MOD AMT sets how far the random jumps reach.</li><li>The S&amp;H RATE sets the tempo of the bubbles.</li></ul>
  <div class="tip">Same note, changing tone. The pitch line in the spectrum stays put while the bright region jumps around.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:700,res:0.7,cutAmt:3000}},{id:'s',type:'sh',p:{rate:6}}],
    cables:['o.out>f.in','f.out>out.in','s.out>f.cut']},
  reply:`Chat is spamming bubble emojis. You've made it.`},
{ id:'robot', ch:'random', challenge:true, tol:5, tolShape:1.2, title:'Robot Babble', concept:'Challenge', client:'Gadget & Gizmo', role:'Kids\' cartoon studio',
  unlock:[], palette:{osc:1,filter:1,sh:1,vca:1,env:1}, note:52, gate:1.6, dur:2.0,
  brief:`Our robot character "talks" in babble. Same buzzy voice pitch, but the vowels keep changing randomly, like nonsense words. It should start and stop like a sentence.`,
  manual:`<h4>Challenge: robot speech</h4>
  <p>No parts list. You've learned the pieces:</p>
  <ul><li>Vowels are formants: a resonant band of frequencies. Which filter type?</li><li>"Vowels keep changing randomly": what moves that band, and how fast?</li><li>"Starts and stops like a sentence": a volume shape.</li></ul>
  <div class="tip">The voice's pitch stays put. Only the vowel jumps around.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:900,res:0.55,cutAmt:2400}},{id:'s',type:'sh',p:{rate:9}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.03,d:0.2,s:0.85,r:0.15}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','s.out>f.cut']},
  reply:`Blip-blorp-bleep means "thank you" in Robot. We checked.`},
/* ---------------- STEP SEQUENCER ---------------- */
{ id:'first-steps', ch:'seqlab', title:'First Steps', concept:'Step sequencer', client:'Noor Haddad', role:'Chiptune composer',
  unlock:[], palette:{seq:1,osc:1,vca:1}, note:45, gate:2.0, dur:2.1,
  brief:`I need a little looping riff for a game's title screen: four notes going round and round. Root, fifth, octave, fifth. Short and bouncy.`,
  manual:`<h4>The step sequencer</h4>
  <p>So far every gig has been one held note. A <b>SEQ</b> plays a <b>pattern</b> by itself, one step every 16th note, looping while the key is held.</p>
  <ul><li>Each numbered bar is one step's note, in semitones from the key you play: +7 is a fifth up, +12 an octave.</li><li><b>STEPS</b> is how many steps loop. <b>BPM</b> is the tempo.</li><li><b>PITCH</b> out → the OSC's PITCH jack. The oscillator follows it exactly (MOD AMT doesn't apply to the sequencer).</li><li><b>GATE</b> out is on for part of each step (the <b>GATE</b> knob). Into a VCA's CV, it chops the sound into notes.</li></ul>
  <div class="tip">This riff: STEPS 4, notes 0, +7, +12, +7, at 120 BPM.</div>`,
  target:{mods:[{id:'q',type:'seq',p:{s1:0,s2:7,s3:12,s4:7,s5:0,s6:0,s7:0,s8:0,len:4,bpm:120,gate:0.5,glide:0}},{id:'o',type:'osc',p:{wave:'square'}},{id:'v',type:'vca',p:{level:0.85}}],
    cables:['q.pitch>o.pitch','o.out>v.in','v.out>out.in','q.gate>v.gain']},
  reply:`Press START. That loop is going to live in people's heads for decades.`},
{ id:'step-pluck', ch:'seqlab', title:'Pluck Every Step', concept:'Retriggered envelopes', client:'Noor Haddad', role:'Chiptune composer, level 2',
  unlock:[], palette:{seq:1,osc:1,vca:1,env:1}, note:45, gate:2.0, dur:2.2,
  brief:`The title riff is great. For level 2 I want eight notes, and each one should be a quick pluck, not a hard on/off chop.`,
  manual:`<h4>One envelope per step</h4>
  <p>A gate straight into a VCA is just on/off. To give every step a <b>shape</b>, patch the SEQ's GATE into an ENV's <b>TRIG</b> jack. The envelope then restarts on every step.</p>
  <ul><li>ENV → VCA CV, as usual.</li><li>A fast attack and a short decay with no sustain make each step a pluck.</li><li>The steps this time: 0, 0, +12, 0, +10, 0, +7, +5.</li></ul>
  <div class="tip">On the loudness graph every step is a little spike. Match the spike's shape with the envelope.</div>`,
  target:{mods:[{id:'q',type:'seq',p:{s1:0,s2:0,s3:12,s4:0,s5:10,s6:0,s7:7,s8:5,len:8,bpm:120,gate:0.5,glide:0}},{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.12,s:0,r:0.05}}],
    cables:['q.pitch>o.pitch','o.out>v.in','v.out>out.in','e.out>v.gain','q.gate>e.trig']},
  reply:`Level 2 approved. The boss music is next, I'll be back.`},
{ id:'slide', ch:'seqlab', title:'Slide', concept:'Glide', client:'Moss Delacroix', role:'Deep house producer',
  unlock:['res'], palette:{seq:1,osc:1,filter:1,vca:1}, note:45, gate:2.0, dur:2.2,
  brief:`My bassline steps from note to note. I want it to <i>slide</i>, so every note bends smoothly into the next one, rubbery and connected.`,
  manual:`<h4>Glide (portamento)</h4>
  <p><b>GLIDE</b> on the SEQ makes the pitch slide to each new step instead of jumping. Longer glide, slower slide.</p>
  <ul><li>Set GATE near 100% so the notes run into each other (legato). Gaps between notes break the slide's effect.</li><li>A warm low-pass on a saw keeps it bassy.</li><li>The steps: 0, +12, 0, +12, +7, +5, +3, 0.</li></ul>
  <div class="tip">On the spectrum, the pitch line bends between steps instead of jumping. The steeper the bend, the shorter the glide.</div>`,
  target:{mods:[{id:'q',type:'seq',p:{s1:0,s2:12,s3:0,s4:12,s5:7,s6:5,s7:3,s8:0,len:8,bpm:110,gate:1,glide:0.08}},{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:900,res:0.3}},{id:'v',type:'vca',p:{level:0.85}}],
    cables:['q.pitch>o.pitch','o.out>f.in','f.out>v.in','v.out>out.in','q.gate>v.gain']},
  reply:`It's like the bassline is skating. Smooth. Thank you.`},
{ id:'warehouse', ch:'seqlab', studio:'ladder', challenge:true, tol:1.5, title:'Warehouse Line', concept:'Challenge', client:'DJ Ferrite', role:'Acid house night promoter',
  unlock:['res','mod'], palette:{seq:1,osc:1,filter:1,env:1,vca:1,lfo:1}, note:33, gate:2.0, dur:2.2,
  brief:`The classic squelchy acid bassline. A fast eight-step loop at 128, rubbery slides between some notes, and every step "yowps" through a screaming resonant filter. Low and nasty.`,
  manual:`<h4>Challenge: the acid line</h4>
  <p>No parts list. You know every piece:</p>
  <ul><li>The notes: listen, or read the pitch line on the spectrum. The loop uses the root, an octave, and a couple of notes in between.</li><li>"Yowp" on every step: what restarts on each step, and what does it move?</li><li>"Slides": a SEQ knob.</li><li>The gate does two jobs at once. One output can feed two jacks.</li></ul>
  <div class="tip">Build the loop first (pitch, gate, tempo), then the squelch.</div>`,
  target:{mods:[{id:'q',type:'seq',p:{s1:0,s2:0,s3:12,s4:0,s5:10,s6:0,s7:0,s8:3,len:8,bpm:128,gate:0.5,glide:0.04}},{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:350,res:0.75,cutAmt:3600}},
      {id:'e',type:'env',p:{a:0.003,d:0.16,s:0,r:0.05}},{id:'v',type:'vca',p:{level:0.9}}],
    cables:['q.pitch>o.pitch','o.out>f.in','f.out>v.in','v.out>out.in','q.gate>v.gain','q.gate>e.trig','e.out>f.cut']},
  reply:`The warehouse is shaking and somebody just yelled "ACIEEED". Booked for next month.`},
/* ---------------- REPAIR SHOP ---------------- */
{ id:'no-signal', ch:'repair', title:'No Signal', concept:'Signal flow', client:'Hank Pruitt', role:'Pawn shop owner',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1}, note:45, gate:0.6, dur:1.0,
  start:[{id:'o',type:'osc',slot:0,p:{wave:'sawtooth'}},{id:'f',type:'filter',slot:1,p:{cutoff:1800,res:0.2}},{id:'v',type:'vca',slot:2,p:{level:0}},{id:'e',type:'env',slot:4,p:{a:0.005,d:0.3,s:0.5,r:0.2}}],
  startCables:['o.out>f.in','f.out>v.in','e.out>v.gain'],
  presetNote:`Someone traded in this patch. It's all there, but it makes no sound. Find the <b>two</b> faults.`,
  brief:`Fella traded this synth patch in and swore it worked. I hear nothing. Supposed to be a plain buzzy note with a bit of shape to it. Can you get it going so I can sell it?`,
  manual:`<h4>Repair: follow the signal</h4>
  <p>When a patch is silent, trace the sound from where it starts to the speaker, one module at a time.</p>
  <ul><li>Is every module connected to the next one?</li><li>Does the chain actually reach OUTPUT?</li><li>Is any level or amount turned all the way down?</li></ul>
  <div class="tip">Press ▶ Yours after each fix. Silence to sound is the first clue you're on the right track.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1800,res:0.2}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.3,s:0.5,r:0.2}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`It sings! Sold it in ten minutes. Here's your cut.`},
{ id:'muffled', ch:'repair', title:'Muffled Mess', concept:'Diagnosing tone', client:'Hank Pruitt', role:'Pawn shop owner, again',
  unlock:['res'], palette:{osc:1,filter:1,vca:1,env:1}, note:45, gate:0.6, dur:1.0,
  start:[{id:'o',type:'osc',slot:0,p:{wave:'sawtooth'}},{id:'f',type:'filter',slot:1,p:{cutoff:120,res:0.9}},{id:'v',type:'vca',slot:2,p:{level:0.85}},{id:'e',type:'env',slot:4,p:{a:0.005,d:0.3,s:0.5,r:0.2}}],
  startCables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain'],
  presetNote:`This one makes a sound, but it's all wrong: a dull, boomy whistle. Compare it with the target and fix what's off.`,
  brief:`Another one. This one works, but it sounds like it's under a pillow and whistling. The fella said it's meant to be the same as the last one: bright and buzzy.`,
  manual:`<h4>Repair: read the difference</h4>
  <p>When a patch sounds <i>wrong</i> rather than silent, compare the graphs.</p>
  <ul><li>Target has highs that yours doesn't? Something is cutting them.</li><li>A sharp peak that the target doesn't have? Something is resonating.</li></ul>
  <div class="tip">Change one thing at a time and check the match after each change.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1800,res:0.2}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.3,s:0.5,r:0.2}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Clear as a bell. You're cheaper than the repair guy across the street.`},
{ id:'wrong-jack', ch:'repair', title:'Wrong Jack', concept:'Audio vs. control', client:'Hank Pruitt', role:'Pawn shop owner, getting suspicious',
  unlock:['mod'], palette:{osc:1,filter:1,vca:1,env:1}, note:45, gate:0.4, dur:1.0,
  start:[{id:'o',type:'osc',slot:0,p:{wave:'sawtooth'}},{id:'f',type:'filter',slot:1,p:{cutoff:1200,res:0.2,cutAmt:2400}},{id:'v',type:'vca',slot:2,p:{level:0.85}},{id:'e',type:'env',slot:4,p:{a:0.003,d:0.2,s:0,r:0.1}}],
  startCables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>f.cut'],
  presetNote:`It makes a sound, but it drones on forever. The envelope is doing <i>something</i>, just not the right job.`,
  brief:`This one's supposed to be a short pluck. Instead it hums forever and goes "wow" at the start. Same parts as a working one, I swear.`,
  manual:`<h4>Repair: control goes where?</h4>
  <p>An envelope does whatever its jack tells it to. Plugged into the filter's CUT, it moves the tone. Plugged into the VCA's CV, it shapes the volume.</p>
  <ul><li>Does the target stop on its own? Then something is shaping its volume.</li><li>Does the target's tone sweep? If not, the filter doesn't need the envelope.</li></ul>
  <div class="tip">Tap a cable's end to unplug it, then drag it to a new jack.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1200,res:0.2}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.2,s:0,r:0.1}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Plink. That's a pluck. You're on retainer now.`},
{ id:'seasick', ch:'repair', tol:3, title:'Seasick', concept:'Modulation depth', client:'Hank Pruitt', role:'Pawn shop owner, feeling queasy',
  unlock:['mod'], palette:{osc:1,lfo:1,vca:1,env:1}, note:57, gate:1.4, dur:1.6,
  start:[{id:'o',type:'osc',slot:0,p:{wave:'triangle',pitchAmt:900}},{id:'l',type:'lfo',slot:4,p:{wave:'sine',rate:1.2}},{id:'v',type:'vca',slot:1,p:{level:0.85}},{id:'e',type:'env',slot:5,p:{a:0.35,d:0.4,s:0.55,r:0.35}}],
  startCables:['o.out>v.in','v.out>out.in','e.out>v.gain','l.out>o.pitch'],
  presetNote:`It's meant to be a gentle vibrato lead. Right now it lurches up and down like a ship. Tame the wobble.`,
  brief:`This one makes me seasick. It's supposed to be a sweet little lead with a gentle vibrato, like a singer. Right now it's like a siren after three beers.`,
  manual:`<h4>Repair: how much, how fast</h4>
  <p>Every modulation has two questions: <b>how far</b> (the amount knob at the destination) and <b>how fast</b> (the source's rate).</p>
  <ul><li>Vibrato is narrow: a fraction of a semitone.</li><li>Vibrato is quick: around five or six wobbles per second.</li></ul>
  <div class="tip">The pitch line in the spectrum shows how wide the wobble is. The scope's movement shows how fast.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',pitchAmt:35}},{id:'l',type:'lfo',p:{wave:'sine',rate:5.5}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.35,d:0.4,s:0.55,r:0.35}}],
    cables:['o.out>v.in','v.out>out.in','e.out>v.gain','l.out>o.pitch']},
  reply:`My stomach thanks you. So does the customer who bought it.`},
{ id:'total-wreck', ch:'repair', studio:'ladder', challenge:true, tolShape:1.2, title:'Total Wreck', concept:'Challenge', client:'Hank Pruitt', role:'Pawn shop owner, final boss',
  unlock:['ftype','res','mod'], palette:{osc:1,filter:1,vca:1,env:2,delay:1}, note:45, gate:0.35, dur:1.8,
  start:[{id:'o',type:'osc',slot:0,p:{wave:'sine'}},{id:'f',type:'filter',slot:1,p:{type:'highpass',cutoff:600,res:0.6,cutAmt:2400}},{id:'v',type:'vca',slot:2,p:{level:0.85}},{id:'e',type:'env',slot:4,p:{a:1.2,d:0.25,s:0.3,r:0.15}},
    {id:'e2',type:'env',slot:5,p:{a:0.003,d:0.2,s:0,r:0.1}},{id:'d',type:'delay',slot:3,p:{time:0.3,fb:0.92,mix:0.3,tone:3000}}],
  startCables:['o.out>f.in','f.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain'],
  presetNote:`An acid pluck with an echo, run through a blender. Several things are broken. You find them.`,
  brief:`Last one, I promise. Guy said it was an acid pluck with an echo. Now it fades in slow, sounds thin, never stops echoing and the squelch is gone. It's a wreck. Fix it all.`,
  manual:`<h4>Challenge: everything's broken</h4>
  <p>No list of faults. Work through the patch the way a tech would:</p>
  <ul><li>Source: is the raw wave right?</li><li>Filter: right type? Is anything moving it?</li><li>Volume shape: does the note start when it should?</li><li>Effect: do the echoes die away like the target's?</li></ul>
  <div class="tip">Fix the biggest problem first. The score jumps the most when you fix the fault that matters most.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:600,res:0.6,cutAmt:2400}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.003,d:0.25,s:0.3,r:0.15}},
      {id:'e2',type:'env',p:{a:0.003,d:0.2,s:0,r:0.1}},{id:'d',type:'delay',p:{time:0.3,fb:0.4,mix:0.3,tone:3000}}],
    cables:['o.out>f.in','f.out>v.in','v.out>d.in','d.out>out.in','e.out>v.gain','e2.out>f.cut']},
  reply:`You fixed it ALL? I'm giving you the shop keys. Kidding. Mostly.`},
/* ---------------- SYNC & RING (advanced) ---------------- */
{ id:'torn-edge', ch:'sync', tol:2, title:'Torn Edge', concept:'Hard sync', client:'Vesna Kralj', role:'Industrial techno producer',
  unlock:[], palette:{sync:1}, note:45, gate:1.2, dur:1.4,
  brief:`Saws are too polite. I want a tone with a <i>torn</i> edge: hard, nasal and metallic, but still sitting firmly on the note.`,
  manual:`<h4>Hard sync</h4>
  <p>A <b>SYNC OSC</b> holds two oscillators. One plays the note. The other runs faster, by the <b>RATIO</b>, but every time the note's cycle starts again, it is forced to restart too.</p>
  <ul><li>The restart chops the fast wave off mid-cycle. That jagged edge is the sync sound.</li><li>The pitch you hear stays on the note, because the chop happens once per note cycle.</li><li>RATIO changes the <b>tone</b>, not the pitch. Whole numbers sound smooth. In-between values tear.</li></ul>
  <div class="tip">Watch the scope: one cycle of the note, with a fast wave inside it that gets cut off at the end.</div>`,
  target:{mods:[{id:'s',type:'sync',p:{wave:'sawtooth',ratio:2.6}}], cables:['s.out>out.in']},
  reply:`That's the sound of a warehouse at 4am. Perfect.`},
{ id:'sync-sweep', ch:'sync', tol:2, title:'Sync Sweep', concept:'Sweeping the ratio', client:'Vesna Kralj', role:'Industrial techno producer',
  unlock:['mod'], palette:{sync:1,env:1}, note:45, gate:1.0, dur:1.3,
  brief:`Now make it <i>move</i>. Every note should start with a scream that sweeps down and settles into a growl.`,
  manual:`<h4>Sync sweeps</h4>
  <p>Sync sounds best when the ratio is <b>moving</b>. Patch an ENV into the SYNC OSC's <b>SWEEP</b> jack and the ratio rises with the envelope, then falls back.</p>
  <ul><li>RATIO is where the sweep ends up (the resting tone).</li><li>SWEEP is how far above it the envelope pushes.</li><li>The envelope's decay is how long the sweep takes.</li></ul>
  <div class="tip">The spectrum shows a bright band sliding down over the first half second. Match the start with SWEEP and the end with RATIO.</div>`,
  target:{mods:[{id:'s',type:'sync',p:{wave:'sawtooth',ratio:1.3,sweepAmt:4}},{id:'e',type:'env',p:{a:0.005,d:0.6,s:0.15,r:0.2}}],
    cables:['s.out>out.in','e.out>s.sweep']},
  reply:`Every kick-drum in Berlin just turned to look.`},
{ id:'robot-voice', ch:'sync', title:'Robot Voice', concept:'Ring modulation', client:'Theo Achterberg', role:'Radio drama sound designer',
  unlock:['wave'], palette:{osc:2,ring:1}, note:45, gate:1.2, dur:1.4,
  brief:`Our villain is a broken robot. Its voice should be buzzy and clangy, with tones that don't quite belong to the note.`,
  manual:`<h4>Ring modulation</h4>
  <p>A <b>RING MOD</b> multiplies two signals. Instead of the two notes, you hear new tones at their <b>sum</b> and <b>difference</b>.</p>
  <ul><li>Feed one oscillator into A and another into B. It needs both: with nothing in B, it's silent.</li><li>Change the interval between them (SEMI) and the new tones move in odd, inharmonic ways.</li><li>Like FM, this is a quick way to get metallic sounds.</li></ul>
  <div class="tip">The original notes mostly vanish. Look for pairs of peaks either side of where they would be.</div>`,
  target:{mods:[{id:'a',type:'osc',p:{wave:'sawtooth'}},{id:'b',type:'osc',p:{wave:'sine',semi:7}},{id:'r',type:'ring',p:{level:0.9}}],
    cables:['a.out>r.a','b.out>r.b','r.out>out.in']},
  reply:`The cast flinched at the read-through. It's perfectly horrible. Thank you.`},
{ id:'screamer', ch:'sync', challenge:true, tol:2, tolShape:1.2, title:'Screamer', concept:'Challenge', client:'Ash Valentine', role:'Synthwave lead player',
  unlock:['mod'], palette:{sync:1,env:2,filter:1,vca:1,ring:1}, note:57, gate:0.9, dur:1.3,
  brief:`I need THE lead. Every note bites with a screaming sweep, the top end is just a little tamed, and it holds while I hold the key, then lets go quickly.`,
  manual:`<h4>Challenge: the sync lead</h4>
  <p>No parts list. Things to listen for:</p>
  <ul><li>"Screaming sweep": what moves, and what moves it?</li><li>"A little tamed": something rolls off the very top.</li><li>"Holds while I hold, lets go quickly": a volume shape of its own.</li></ul>
  <div class="tip">Two different envelopes doing two different jobs. Get the volume shape right first.</div>`,
  target:{mods:[{id:'s',type:'sync',p:{wave:'sawtooth',ratio:1.5,sweepAmt:5}},{id:'se',type:'env',p:{a:0.003,d:0.45,s:0.25,r:0.2}},{id:'f',type:'filter',p:{cutoff:3500,res:0.2}},
      {id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.3,s:0.8,r:0.12}}],
    cables:['s.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain','se.out>s.sweep']},
  reply:`Neon, palm trees, a car with no roof. That's the sound. You legend.`},
/* ---------------- MODULATION DEEP DIVE (advanced) ---------------- */
{ id:'strike-once', ch:'modlab', title:'Strike Once', concept:'Function generator', client:'Odile Fontaine', role:'Experimental percussionist',
  unlock:[], palette:{osc:1,vca:1,func:1}, note:57, gate:1.5, dur:1.6,
  brief:`I'm triggering this from a pad that holds the note for ages. I want a ping that dies away on its own, no matter how long the note is held.`,
  manual:`<h4>The function generator</h4>
  <p><b>FUNC</b> draws one simple shape: <b>RISE</b> up to full, then <b>FALL</b> back to zero.</p>
  <ul><li>In <b>ONCE</b> mode it runs one time per note and <i>ignores how long you hold</i>. An ADSR waits for you to let go; FUNC doesn't.</li><li>A fast rise and a longer fall make a strike.</li><li>Patch it into a VCA's CV, just like an envelope.</li></ul>
  <div class="tip">The target note is held for 1.5 seconds, but the sound is gone well before that. That's your clue that it doesn't wait for release.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'v',type:'vca',p:{level:0.9}},{id:'f',type:'func',p:{loop:'once',rise:0.005,fall:0.7}}],
    cables:['o.out>v.in','v.out>out.in','f.out>v.gain']},
  reply:`I held the pad for a full minute. One perfect ping. Bravo.`},
{ id:'pump', ch:'modlab', tol:3, title:'Pump', concept:'Looping shapes', client:'Kai Nakamura', role:'House music DJ',
  unlock:['mod','res'], palette:{osc:1,filter:1,func:1,lfo:1}, note:45, gate:2.0, dur:2.0,
  brief:`I want that pumping house chord, but on one held note. The filter snaps open, then slowly closes, over and over. A plain wobble doesn't cut it: it needs the snap.`,
  manual:`<h4>Shapes an LFO can't make</h4>
  <p>An LFO only has a few waveforms. Put FUNC in <b>LOOP</b> mode and it repeats its rise and fall forever. It's an LFO you draw yourself.</p>
  <ul><li>A fast rise and a slow fall gives a "snap, then sag" rhythm.</li><li>RISE + FALL together set the speed: 0.02 s + 0.3 s ≈ three pumps per second.</li><li>Patch it into the filter's CUT jack with some MOD AMT.</li></ul>
  <div class="tip">The spectrum brightens suddenly, then fades, in a steady rhythm. Time one cycle from flash to flash.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:300,res:0.3,cutAmt:3600}},{id:'u',type:'func',p:{loop:'loop',rise:0.02,fall:0.3}}],
    cables:['o.out>f.in','f.out>out.in','u.out>f.cut']},
  reply:`The dance floor is breathing in time. You get it.`},
{ id:'late-vibrato', ch:'modlab', tol:2, title:'Late Vibrato', concept:'Modulating modulation', client:'Giulia Brandt', role:'Opera singer, synth side project',
  unlock:['mod'], palette:{osc:1,lfo:1,modvca:1,env:1}, note:57, gate:2.2, dur:2.4,
  brief:`Singers don't wobble straight away. We start the note pure and let the vibrato bloom in after a moment. Give me that.`,
  manual:`<h4>Modulation that's modulated</h4>
  <p>An LFO into PITCH gives vibrato from the first instant. To make it <b>fade in</b>, the vibrato's <i>depth</i> has to change over time.</p>
  <ul><li>A <b>MOD VCA</b> is a VCA for control signals. The LFO goes into its IN, and its OUT goes to the oscillator's PITCH.</li><li>An ENV into the MOD VCA's <b>CV</b> sets how much LFO gets through: a slow attack makes the vibrato swell in.</li><li>The oscillator's MOD AMT is the full vibrato width.</li></ul>
  <div class="tip">Modulation routings like this are how real players' expression gets built into a patch.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',pitchAmt:110}},{id:'l',type:'lfo',p:{wave:'sine',rate:5.5}},{id:'m',type:'modvca',p:{amt:1}},{id:'e',type:'env',p:{a:1.1,d:0.1,s:1,r:0.3}}],
    cables:['o.out>out.in','l.out>m.in','m.out>o.pitch','e.out>m.cv']},
  reply:`It sounds like it's breathing before it sings. Bellissimo.`},
{ id:'tidal', ch:'modlab', studio:'ladder', challenge:true, tol:3, title:'Tidal Wobble', concept:'Challenge', client:'Low Tide Collective', role:'Bass music trio',
  unlock:['mod','res'], palette:{osc:1,filter:1,lfo:1,modvca:1,func:1,env:1}, note:45, gate:2.4, dur:2.4,
  brief:`A fast filter wobble that comes and goes like waves: it swells up, fades away to nothing, swells up again. All on one held note.`,
  manual:`<h4>Challenge: the tide</h4>
  <p>No parts list. Things to listen for:</p>
  <ul><li>The fast wobble: what's moving the filter, and how fast?</li><li>"Comes and goes like waves": the wobble's <i>depth</i> rises and falls slowly, forever.</li><li>Which module repeats a slow rise and fall? And how do you let it control another modulator?</li></ul>
  <div class="tip">Get a steady wobble first, then make its depth move.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:500,res:0.5,cutAmt:2400}},{id:'l',type:'lfo',p:{wave:'sine',rate:6}},{id:'m',type:'modvca',p:{amt:1}},
      {id:'u',type:'func',p:{loop:'loop',rise:0.6,fall:0.6}}],
    cables:['o.out>f.in','f.out>out.in','l.out>m.in','m.out>f.cut','u.out>m.cv']},
  reply:`The sub is surfing. Crowd's surfing. Everyone's surfing.`},
/* ---------------- WEST COAST (advanced) ---------------- */
{ id:'fold', ch:'west', title:'Fold', concept:'Wavefolding', client:'Juniper Okonkwo', role:'Modular performance artist',
  unlock:[], palette:{osc:1,fold:1}, note:45, gate:1.2, dur:1.4,
  brief:`Everything so far started bright and got filtered darker. I want to go the other way: start with a soft, pure tone and make it <i>richer</i>, but rounder and rubberier than a saw.`,
  manual:`<h4>The other way to make a sound</h4>
  <p>There are two big ideas in synthesis. <b>Subtractive</b>: start bright and filter harmonics away. <b>Waveshaping</b>: start pure and <i>add</i> harmonics by bending the wave.</p>
  <ul><li>A <b>FOLDER</b> pushes the wave up, and every time it hits the edge it <b>folds back</b> on itself instead of clipping.</li><li>More FOLD means more folds and more harmonics.</li><li>Start with a sine. Folding a pure wave makes its sound easy to hear.</li></ul>
  <div class="tip">Watch the scope while you turn FOLD: the sine grows extra bumps on each half.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine'}},{id:'f',type:'fold',p:{fold:3.5,level:0.7}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Rubber band harmonics. This goes in the performance tonight.`},
{ id:'bloom', ch:'west', title:'Bloom', concept:'Moving folds', client:'Juniper Okonkwo', role:'Modular performance artist',
  unlock:['mod'], palette:{osc:1,fold:1,env:1}, note:45, gate:1.2, dur:1.5,
  brief:`Now make it bloom. The note should burst open rich and bright, then settle back toward a soft, round tone as it holds. And no filter.`,
  manual:`<h4>Moving timbre without a filter</h4>
  <p>Patch an ENV into the FOLDER's <b>CV</b> jack. The envelope pushes the fold harder, adding harmonics, then lets go.</p>
  <ul><li>FOLD is where the tone rests.</li><li>MOD AMT is how much extra fold the envelope adds at its peak.</li><li>The envelope's decay and sustain shape how the brightness settles.</li></ul>
  <div class="tip">Compare with filter sweeps: folding changes <i>which</i> harmonics exist, so the tone moves in a different, more vocal way.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine'}},{id:'f',type:'fold',p:{fold:1,foldAmt:4.5,level:0.7}},{id:'e',type:'env',p:{a:0.02,d:0.7,s:0.2,r:0.3}}],
    cables:['o.out>f.in','f.out>out.in','e.out>f.cv']},
  reply:`It opens like a flower. The audience gasped. Actually gasped.`},
{ id:'bonk', ch:'west', tol:1.5, title:'Bonk', concept:'Low-pass gate', client:'Pip Haddad', role:'Children\'s museum installation',
  unlock:[], palette:{osc:1,lpg:1,env:1,vca:1,filter:1}, note:57, gate:0.2, dur:1.0,
  brief:`Our sound sculpture needs a friendly, woody "bonk" when kids touch it. Like a wooden block: a soft knock that gets darker as it dies away.`,
  manual:`<h4>The low-pass gate</h4>
  <p>Real objects get <b>darker as they get quieter</b>: high frequencies die first. A VCA and a filter can fake that with two envelopes, but a <b>LPG</b> does both jobs with one signal.</p>
  <ul><li>Audio through the LPG, and an envelope into its CV.</li><li>As the envelope falls, volume and brightness fall together.</li><li>A very short envelope makes the classic "bonk".</li></ul>
  <div class="tip">One envelope, one module. The decay length is the size of the wooden block.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'g',type:'lpg',p:{open:0}},{id:'e',type:'env',p:{a:0.001,d:0.3,s:0,r:0.15}}],
    cables:['o.out>g.in','g.out>out.in','e.out>g.cv']},
  reply:`A five-year-old just hugged the sculpture. Mission accomplished.`},
{ id:'wooden-toy', ch:'west', challenge:true, tol:1.5, title:'Wooden Toy', concept:'Challenge', client:'Pip Haddad', role:'Children\'s museum, the whole gallery',
  unlock:['mod'], palette:{osc:1,fold:1,lpg:1,func:1,env:1,reverb:1}, note:57, gate:0.3, dur:1.4,
  brief:`The whole gallery now. Each strike should flash bright and rubbery, then quickly turn soft and woody and fade, in a small, friendly room. And here's the trick: our technician says one shape does everything.`,
  manual:`<h4>Challenge: one shape, two jobs</h4>
  <p>No parts list. Things to listen for:</p>
  <ul><li>"Bright and rubbery" on the strike: that's not a filter opening.</li><li>"Soft and woody as it fades": volume and brightness falling together.</li><li>"One shape does everything": a single output can feed two inputs. The shape doesn't wait for the key to be released.</li><li>"A small, friendly room".</li></ul>
  <div class="tip">Drag a second cable from the same output jack to patch one source into two places.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sine'}},{id:'f',type:'fold',p:{fold:1.2,foldAmt:3,level:0.8}},{id:'g',type:'lpg',p:{open:0}},{id:'u',type:'func',p:{loop:'once',rise:0.002,fall:0.45}},
      {id:'r',type:'reverb',p:{size:1.2,mix:0.2}}],
    cables:['o.out>f.in','f.out>g.in','g.out>r.in','r.out>out.in','u.out>f.cv','u.out>g.cv']},
  reply:`The kids are playing it like a xylophone. Best exhibit we've ever had.`},
/* ---------------- BONUS ---------------- */
{ id:'even-keel', ch:'bonus', title:'Even Keel', concept:'Key tracking', client:'Rosalind Achebe', role:'Session keyboardist',
  unlock:['keytrk','res'], palette:{osc:1,filter:1,vca:1,env:1}, note:33, gate:0.4, dur:2.2,
  seq:[[0,0,0.4],[12,0.5,0.4],[24,1.0,0.4],[36,1.5,0.4]],
  brief:`My bass patch sounds great down low, but when I play up the keyboard it gets muffled, like a blanket over the high notes. I want every note to have the same brightness, low or high.`,
  manual:`<h4>Key tracking</h4>
  <p>A filter's cutoff is a fixed frequency. A low note's harmonics fit under it, but a high note's harmonics are all higher, so more of them get cut. High notes sound duller.</p>
  <ul><li><b>KEY TRK</b> moves the cutoff with the note. At 100%, the cutoff rises an octave whenever the note does.</li><li>CUTOFF is now the setting <i>at middle C</i>. Notes below it get a lower cutoff, notes above a higher one.</li><li>This gig plays four notes, low to high, so you can hear the difference without a keyboard.</li></ul>
  <div class="tip">Bonus: after sending it, open ♪ Keys (or plug in a MIDI keyboard) and play up and down with KEY TRK at 0% and then 100%.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:900,res:0.25,track:1}},{id:'v',type:'vca',p:{level:0.85}},{id:'e',type:'env',p:{a:0.005,d:0.2,s:0.7,r:0.15}}],
    cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Top to bottom, the same tone. My hands feel ten years younger.`},
];

/* Chapters: Basics is a linear tutorial; every theme opens once Basics is done. */
const CHAPTERS = [
  {id:'basics', title:'Basics', short:'BASICS', blurb:'Start here: seven short lessons on the building blocks. Everything is open, so skip ahead whenever you like.'},
  {id:'filters', title:'Filter Lab', short:'FILTERS', blurb:'Carve, shape and squelch. Make a synth talk.'},
  {id:'bass', title:'Bass', short:'BASS', blurb:'From clean sub bass to growling engines.'},
  {id:'pads', title:'Pads', short:'PADS', blurb:'Slow, wide, atmospheric beds of sound.'},
  {id:'leads', title:'Leads', short:'LEADS', blurb:'Melody voices that cut through and sing.'},
  {id:'perc', title:'Percussion', short:'DRUMS', blurb:'Drums from nothing but oscillators, noise and envelopes.'},
  {id:'fx', title:'Sound FX', short:'FX', blurb:'Lasers, sirens, wind, and things from outer space.'},
  {id:'mix', title:'Mix Desk', short:'MIX', blurb:'Layer sources together and balance them into one voice.'},
  {id:'harm', title:'Harmonics Lab', short:'HARMONICS', blurb:'What a timbre is made of. Build waves from pure sines.'},
  {id:'fm', title:'FM Studio', short:'FM', blurb:'Oscillators modulating oscillators: bells, metal and glassy keys.'},
  {id:'fxrack', title:'Effects Rack', short:'EFFECTS', blurb:'Delay, reverb, chorus and drive: the space and grit around a sound.'},
  {id:'strings', title:'Strings & Plucks', short:'STRINGS', blurb:'Turn a click and a delay into a real-sounding string.'},
  {id:'random', title:'Random & Generative', short:'RANDOM', blurb:'Sample & hold: controlled chaos that still repeats.'},
  {id:'seqlab', title:'Step Sequencer', short:'SEQUENCER', blurb:'Patterns that play themselves: steps, gates, retriggered envelopes and glide.'},
  {id:'repair', title:'Repair Shop', short:'REPAIR', blurb:'Broken patches come in. Diagnose them and get them working.'},
  {id:'sync', title:'Sync & Ring', short:'SYNC', level:'advanced', blurb:'Hard sync and ring modulation: tearing leads and clangy robots.'},
  {id:'modlab', title:'Modulation Deep Dive', short:'MOD LAB', level:'advanced', blurb:'Draw your own shapes, and let modulation control modulation.'},
  {id:'west', title:'West Coast', short:'WEST', level:'advanced', blurb:'Build tone up by folding waves, and gate it like an acoustic sound.'},
  {id:'bonus', title:'Bonus', short:'BONUS', bonus:true, blurb:'Great with ♪ Keys or a MIDI keyboard, but nothing here needs one.'},
];
CHAPTERS.forEach(c=>{ c.levels=LEVELS.map((L,i)=>L.ch===c.id?i:-1).filter(i=>i>=0); });

/* =====================================================================
   ON YOUR BOX: real-gear guides (see docs/ideas.md, "Two paths off the screen")
   GEAR: instruments a player can pick in Settings → My gear.
   GEAR_GUIDES[gigId][gearId]: the gig's patch, step by step, on that instrument.
     step: {t: title, x: text (HTML), game: the game's words for it, page: key to press, pg: page shown,
            head: [left,right] screen header, hiHead: highlight the header, knobs: 8 × [name, value, aim 0–1|null, highlight]}
     prewired: [fromType, outPort, toType, inPort, where] cables that are already wired inside the box.
   Names come from the maker's manual. Positions are rough knob positions, not exact values.
   ===================================================================== */
const GEAR = {
  dt2:{ name:'Digitone II', short:'DT II', blurb:'FM, wavetable and supersaw machines · swappable filters · 3 LFOs',
    pages:['TRIG','SYN','FLTR','AMP','FX','MOD'], screen:'128 × 64 OLED',
    source:{label:'Digitone II manual, OS 1.12', url:'https://www.elektron.se/media/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf'} },
  minifreak:{ name:'MiniFreak', short:'MF', soon:true, blurb:'2 digital engines · analog filter · cycling envelope · mod matrix' },
  mc707:{ name:'MC-707', short:'707', soon:true, blurb:'ZEN-Core tones: up to 4 partials · virtual analog + supersaw' },
  rack:{ name:'My modular rack', short:'RACK', soon:true, modular:true, blurb:'Any brand: patch it the way the game does, cable for cable' },
};
const GEAR_GUIDES = {
  'thin-walls':{
    dt2:{
      steps:[
        {t:'Sound source', game:'OSC · SAW', page:'SYN', pg:'1/3', head:['SYN · WAVETONE','1/3'],
          x:`Use a track with the <b>Wavetone</b> machine. Turn <b>WAV1</b> until oscillator 1 is a bright, buzzy saw-like wave. Keep <b>LEV1</b> up and turn <b>LEV2</b> down, so one oscillator plays, like the game's single OSC.`,
          knobs:[['TUN1','·'],['WAV1','saw',null,1],['PD1','·'],['LEV1','up',0.8,1],['TUN2','·'],['WAV2','·'],['PD2','·'],['LEV2','0',0,1]]},
        {t:'Filter type', game:'FILTER · LP', page:'FLTR', pg:'1/2', head:['FLTR · MULTI-MODE','1/2'], hiHead:1,
          x:`Set the track's filter machine to <b>MULTI-MODE</b>. Its <b>TYPE</b> knob morphs from low-pass through band-pass to high-pass. Turn it all the way to low-pass, the game's LP.`,
          knobs:[['ATK','·'],['DEC','·'],['SUS','·'],['REL','·'],['FREQ','·'],['RESO','·'],['TYPE','LP',0,1],['ENV','·']]},
        {t:'Lower the cutoff', game:'CUTOFF 480 Hz', page:'FLTR', pg:'1/2', head:['FLTR · MULTI-MODE','1/2'],
          x:`Turn <b>FREQ</b> down to about a third, until the buzz turns muffled, like music through a wall. Keep <b>RESO</b> down and <b>ENV</b> at 0, so the filter just sits still.`,
          knobs:[['ATK','·'],['DEC','·'],['SUS','·'],['REL','·'],['FREQ','~1/3',0.33,1],['RESO','0',0,1],['TYPE','LP',0],['ENV','0',0,1]]},
        {t:'Keep the note steady', game:'(no ENV in this gig)', page:'AMP', pg:'P1', head:['AMP','P1'],
          x:`This gig has no envelope, but the box always has one on its amp. Make it stay out of the way: <b>MODE</b> ADSR, <b>ATK</b> 0, <b>SUS</b> all the way up, <b>REL</b> short. Then play a held A2 and flip between it and ▶ Target (Note) in the game.`,
          knobs:[['ATK','0',0,1],['HOLD','·'],['DEC','·'],['SUS','max',1,1],['REL','short',0.15,1],['MODE','ADSR',null,1],['PAN','·'],['VOL','·']]},
      ],
      words:[['OSC','Wavetone (SYN)'],['FILTER · LP','MULTI-MODE, TYPE at LP (FLTR)'],['CUTOFF','FREQ'],['RES','RESO']],
      prewired:[],
      note:`Here you patched OSC → FILTER → OUT yourself. On the Digitone II that chain is built in: every track runs its oscillator through a filter and an amp, so you only choose and set them.`,
    },
  },
  supersaw:{
    dt2:{
      steps:[
        {t:'A swarm of saws', game:'2 × OSC · SAW', page:'SYN', pg:'P1', head:['SYN · SWARMER','P1'],
          x:`Use a track with the <b>SWARMER</b> machine: one main oscillator plus a swarm of copies, all on one page. It does the work of the game's two oscillators. Turn <b>MIX</b> to about halfway, so you hear the main voice and the swarm together.`,
          knobs:[['TUNE','·'],['SWRM','·'],['DET','·'],['MIX','~1/2',0.5,1],['M.OCT','0',null,1],['MAIN','·'],['ANIM','·'],['N.MOD','·']]},
        {t:'Detune', game:'FINE +9 / −9', page:'SYN', pg:'P1', head:['SYN · SWARMER','P1'],
          x:`Turn <b>DET</b> up slowly from 0. The swarm drifts out of tune with itself and the sound starts to shimmer and widen, like the game's two saws at +9 and −9 cents. Stop at a gentle shimmer, a little under a quarter, not a seasick wobble.`,
          knobs:[['TUNE','·'],['SWRM','·'],['DET','~1/5',0.2,1],['MIX','~1/2',0.5],['M.OCT','0'],['MAIN','·'],['ANIM','·'],['N.MOD','·']]},
        {t:'Just a little darker', game:'FILTER · CUTOFF 2.6 kHz · RES 10%', page:'FLTR', pg:'1/2', head:['FLTR · MULTI-MODE','1/2'],
          x:`Set the filter machine to <b>MULTI-MODE</b> with <b>TYPE</b> at low-pass. Keep <b>FREQ</b> fairly high, about three quarters, so it only trims the fizz on top. <b>RESO</b> just off 0. Leave <b>ENV</b> at 0: in this gig the filter doesn't move.`,
          knobs:[['ATK','·'],['DEC','·'],['SUS','·'],['REL','·'],['FREQ','~3/4',0.75,1],['RESO','low',0.1,1],['TYPE','LP',0,1],['ENV','0',0,1]]},
        {t:'Keep the note steady', game:'(no ENV in this gig)', page:'AMP', pg:'P1', head:['AMP','P1'],
          x:`This gig has no envelope, but the box always has one on its amp. Keep it out of the way: <b>MODE</b> ADSR, <b>ATK</b> 0, <b>SUS</b> all the way up, <b>REL</b> short. Then play a held A2 and flip between it and ▶ Target (Note) in the game.`,
          knobs:[['ATK','0',0,1],['HOLD','·'],['DEC','·'],['SUS','max',1,1],['REL','short',0.15,1],['MODE','ADSR',null,1],['PAN','·'],['VOL','·']]},
      ],
      words:[['2 × OSC + FINE','SWARMER: DET, MIX'],['FILTER · LP','MULTI-MODE (FLTR)'],['CUTOFF','FREQ'],['RES','RESO']],
      prewired:[],
      note:`In the game you built the detune from two oscillators. The Swarmer machine has the swarm built in, and every track already runs it through a filter and an amp.`,
    },
  },
  acid:{
    dt2:{
      steps:[
        {t:'Sound source', game:'OSC · SAW', page:'SYN', pg:'1/3', head:['SYN · WAVETONE','1/3'],
          x:`Use a track with the <b>Wavetone</b> machine. Turn <b>WAV1</b> until oscillator 1 is a bright, buzzy saw-like wave. Keep <b>LEV1</b> up and turn <b>LEV2</b> down, so only one oscillator plays, like the game's single OSC.`,
          knobs:[['TUN1','·'],['WAV1','saw',null,1],['PD1','·'],['LEV1','up',0.8,1],['TUN2','·'],['WAV2','·'],['PD2','·'],['LEV2','0',0,1]]},
        {t:'Filter type', game:'FILTER · ladder', page:'FLTR', pg:'1/2', head:['FLTR · LOWPASS 4','1/2'], hiHead:1,
          x:`Set the track's filter machine to <b>LOWPASS 4</b>. It's a four-pole low-pass, the closest thing on this box to the game's ladder filter.`,
          knobs:[['ATK','·'],['DEC','·'],['SUS','·'],['REL','·'],['FREQ','·'],['RESO','·'],['',''],['ENV','·']]},
        {t:'Cutoff low, resonance high', game:'CUTOFF 400 Hz · RES 82%', page:'FLTR', pg:'1/2', head:['FLTR · LOWPASS 4','1/2'],
          x:`Turn <b>FREQ</b> down to about a quarter, so the sound goes dark. Turn <b>RESO</b> up to about four fifths, until the filter starts to whistle.`,
          knobs:[['ATK','·'],['DEC','·'],['SUS','·'],['REL','·'],['FREQ','~1/4',0.25,1],['RESO','~4/5',0.8,1],['',''],['ENV','·']]},
        {t:'Filter envelope', game:'2nd ENV → FILTER CUT', page:'FLTR', pg:'1/2', head:['FLTR · LOWPASS 4','1/2'],
          x:`Same page. The filter has its own envelope built in, so no cable is needed. Set <b>ATK</b> to 0, <b>DEC</b> short, <b>SUS</b> to 0 and <b>REL</b> short. Then turn <b>ENV</b> (envelope depth) well up, so each note bites open and snaps shut.`,
          knobs:[['ATK','0',0,1],['DEC','short',0.3,1],['SUS','0',0,1],['REL','short',0.15,1],['FREQ','~1/4',0.25],['RESO','~4/5',0.8],['',''],['ENV','high',0.8,1]]},
        {t:'Amp envelope', game:'1st ENV → VCA', page:'AMP', pg:'P1', head:['AMP','P1'],
          x:`The amp has its own envelope too. Set <b>MODE</b> to ADSR. <b>ATK</b> 0, <b>DEC</b> about halfway, <b>SUS</b> about a third, <b>REL</b> short. Then play a short A2 on the box and flip between it and ▶ Target (set to Note) in the game.`,
          knobs:[['ATK','0',0,1],['HOLD','·'],['DEC','mid',0.45,1],['SUS','~1/3',0.35,1],['REL','short',0.15,1],['MODE','ADSR',null,1],['PAN','·'],['VOL','·']]},
      ],
      words:[['OSC','Wavetone (SYN)'],['FILTER · ladder','LOWPASS 4 (FLTR)'],['CUTOFF','FREQ'],['RES','RESO'],['ENV → CUT','FLTR envelope + ENV'],['ENV → VCA','AMP envelope'],['VCA LEVEL','VOL (AMP)']],
      prewired:[['env','out','filter','cut','FLTR page'],['env','out','vca','gain','AMP page']],
      note:`Both envelope cables are already wired inside the Digitone II: you set them on a page instead of patching. On a modular rack you'd patch them, the same as here.`,
    },
  },
};
