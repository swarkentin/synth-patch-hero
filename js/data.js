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
  osc: {name:'OSC', long:'Oscillator', color:'var(--amber)', cost:2,
    ins:[{id:'pitch',kind:'mod',label:'PITCH',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'wave',type:'choice',options:WAVES,def:'sine',req:'wave'},
      {id:'oct',label:'OCT',min:-3,max:3,step:1,def:0,fmt:fmtSigned},
      {id:'semi',label:'SEMI',min:-12,max:12,step:1,def:0,fmt:fmtSigned},
      {id:'fine',label:'FINE',min:-50,max:50,step:1,def:0,fmt:v=>fmtSigned(v)+'ct',req:'fine'},
      {id:'pitchAmt',label:'MOD AMT',min:0,max:4800,step:5,def:0,fmt:v=>(v/100).toFixed(v<1000?2:1)+'st',req:'mod'},
    ]},
  noise: {name:'NOISE', long:'Noise source', color:'var(--grey)', cost:1, ins:[], outs:[{id:'out',kind:'audio',label:'OUT'}], params:[]},
  filter: {name:'FILTER', long:'Filter', color:'var(--teal)', cost:3,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'cut',kind:'mod',label:'CUT',req:'mod'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[
      {id:'type',type:'choice',options:['lowpass','highpass','bandpass'],labels:['LP','HP','BP'],def:'lowpass',req:'ftype'},
      {id:'cutoff',label:'CUTOFF',min:40,max:12000,scale:'log',def:2000,fmt:fmtHz},
      {id:'res',label:'RES',min:0,max:1,step:0.01,def:0.1,fmt:fmtPct,req:'res'},
      {id:'cutAmt',label:'MOD AMT',min:0,max:7200,step:10,def:0,fmt:v=>(v/1200).toFixed(2)+'oct',req:'mod'},
    ]},
  vca: {name:'VCA', long:'Amplifier', color:'var(--red)', cost:1,
    ins:[{id:'in',kind:'audio',label:'IN'},{id:'gain',kind:'mod',label:'CV'}], outs:[{id:'out',kind:'audio',label:'OUT'}],
    params:[{id:'level',label:'LEVEL',min:0,max:1,step:0.01,def:0.8,fmt:fmtPct}]},
  env: {name:'ENV', long:'ADSR envelope', color:'var(--violet)', cost:2, ins:[], outs:[{id:'out',kind:'mod',label:'ENV'}],
    params:[
      {id:'a',label:'ATTACK',min:0.001,max:3,scale:'log',def:0.01,fmt:fmtT},
      {id:'d',label:'DECAY',min:0.005,max:3,scale:'log',def:0.3,fmt:fmtT},
      {id:'s',label:'SUSTAIN',min:0,max:1,step:0.01,def:0.7,fmt:fmtPct},
      {id:'r',label:'RELEASE',min:0.005,max:4,scale:'log',def:0.3,fmt:fmtT},
    ]},
  lfo: {name:'LFO', long:'Low-frequency oscillator', color:'var(--green)', cost:2, ins:[], outs:[{id:'out',kind:'mod',label:'LFO'}],
    params:[
      {id:'wave',type:'choice',options:WAVES,def:'sine'},
      {id:'rate',label:'RATE',min:0.1,max:20,scale:'log',def:2,fmt:v=>v.toFixed(v<10?2:1)+'Hz'},
    ]},
  out: {name:'OUTPUT', long:'Speaker', color:'var(--cream)', cost:0, ins:[{id:'in',kind:'audio',label:'IN'}], outs:[], params:[]},
};
const ALL_FEATURES = ['osc','wave','filter','res','ftype','vca','env','mod','lfo','fine','noise'];

/* =====================================================================
   DATA: levels
   ===================================================================== */
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteName = m => NOTE_NAMES[m%12]+(Math.floor(m/12)-1);
const mtof = m => 440*Math.pow(2,(m-69)/12);

const LEVELS = [
{ id:'dial-tone', title:'Dial Tone', concept:'Oscillator', client:'Marlene Okafor', role:'Owner, Suds & Spins Laundromat',
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

{ id:'shape', title:'Shape of Sound', concept:'Waveforms', client:'DJ Kettle', role:'Basement rave curator',
  unlock:['wave'], palette:{osc:1}, note:45, gate:1.2, dur:1.4,
  brief:`I need a raw tone. Buzzy. Nasty. Like a bee trapped in a soda can. Same note as the reference, I just need that edge on it.`,
  manual:`<h4>Waveforms and harmonics</h4>
  <p>The <b>shape</b> of the wiggle sets the tone color, or <b>timbre</b>. Any shape other than a sine adds <b>harmonics</b>: quieter copies of the note at 2×, 3×, 4×… the frequency.</p>
  <ul><li><b>Sine</b>: the fundamental only. Pure and soft.</li><li><b>Triangle</b>: a few odd harmonics, fading fast. Mellow, flute-like.</li><li><b>Square</b>: strong odd harmonics. Hollow, reedy, "8-bit."</li><li><b>Saw</b>: every harmonic. Bright and buzzy, the classic synth raw material.</li></ul>
  <div class="tip">Watch the <b>spectrum</b> plot: each spike is a harmonic. Count the spikes and compare their spacing to pick the right shape.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}}], cables:['o.out>out.in']},
  reply:`BZZZZT. Perfect. The crowd is going to hate it in the best way.`},

{ id:'pixel-knight', title:'Pixel Knight', concept:'Pitch practice', client:'Bitcrush Bros.', role:'Two-person indie game studio',
  unlock:[], palette:{osc:1}, note:57, gate:1.2, dur:1.4,
  brief:`Our hero's jump sound needs a chiptune "bloop." Hollow, retro, way up high. We lost the original file and only have this recording. Help.`,
  manual:`<h4>Intervals</h4>
  <p>Musicians count pitch distance in <b>semitones</b>. A few you'll hear constantly:</p>
  <ul><li><b>+12</b>: an octave. Same note, higher.</li><li><b>+7</b>: a <b>perfect fifth</b>. Bright and stable (think power chords).</li><li><b>+5</b>: a fourth. <b>+4</b>: a major third. <b>+3</b>: a minor third.</li></ul>
  <p>OCT and SEMI add together, so +1 OCT and +7 SEMI is 19 semitones up.</p>
  <div class="tip">Get the shape right first, then sweep pitch. The hint list tells you how many semitones off you are.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'square',oct:1,semi:7}}], cables:['o.out>out.in']},
  reply:`Our knight jumps with dignity again. Paying you in cash AND a credit in the game.`},

{ id:'thin-walls', title:'Thin Walls', concept:'Low-pass filter', client:'Lo & Behold', role:'Lo-fi duo, bedroom label',
  unlock:['filter'], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`We want this buzzy note to sound like it's coming through the wall from the neighbour's apartment. Muffled, warm, distant. Same buzz underneath, just… dulled.`,
  manual:`<h4>Subtractive synthesis</h4>
  <p>Start with a harmonic-rich wave, then <b>carve harmonics away</b> with a <b>filter</b>. This is how most classic analog synths work.</p>
  <p>A <b>low-pass filter</b> lets low frequencies through and removes highs above its <b>CUTOFF</b>. Lower cutoff = darker, more muffled sound.</p>
  <p>Patch it <i>between</i> the oscillator and the output: <code>OSC → FILTER → OUTPUT</code>.</p>
  <div class="tip">On the spectrum plot, watch the right side of the curve drop as you lower the cutoff. Line yours up with the target's slope.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:480}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Exactly like our neighbour, Gary. Love that for us. Track's going on the "rainy window" playlist.`},

{ id:'squelch', title:'Squelch', concept:'Resonance', client:'Acid Annie', role:'303 devotee, warehouse DJ',
  unlock:['res'], palette:{osc:1,filter:1}, note:45, gate:1.2, dur:1.4,
  brief:`Darling, a plain filter is so polite. I need it to sing. That rubbery, wet, whistling peak right at the cutoff. Make it squelch.`,
  manual:`<h4>Resonance</h4>
  <p><b>Resonance</b> (also called <b>Q</b> or emphasis) feeds some of the filter's output back into itself, which <b>boosts the frequencies right at the cutoff</b>.</p>
  <ul><li>Low resonance: a smooth roll-off.</li><li>High resonance: a sharp peak that whistles. Sweeping it is the "acid" sound.</li></ul>
  <div class="tip">A resonant peak shows up as a bump on the spectrum plot. Its <b>position</b> is the cutoff, its <b>height</b> is the resonance. Match position first.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:900,res:0.78}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Mmm, squelchy. You've got good ears, sweetie. I'll be back.`},

{ id:'payphone', title:'Payphone', concept:'Filter types', client:'The Payphones', role:'Garage band, three chords',
  unlock:['ftype'], palette:{osc:1,filter:1}, note:57, gate:1.2, dur:1.4,
  brief:`Our intro is supposed to sound like it's coming down an old telephone line. Thin and nasal: no deep bass, no fizzy top. Just the honky middle.`,
  manual:`<h4>Filter types</h4>
  <ul><li><b>LP (low-pass)</b>: keeps lows, cuts highs. Warm, dark.</li><li><b>HP (high-pass)</b>: keeps highs, cuts lows. Thin, airy.</li><li><b>BP (band-pass)</b>: keeps a band around the cutoff and cuts both sides. Nasal, telephone, radio.</li></ul>
  <p>On a band-pass, <b>RES</b> controls how narrow the band is. Narrower = more nasal.</p>
  <div class="tip">Look at the target spectrum: is it a ramp, a slope up, or a hill? That tells you the filter type.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{type:'bandpass',cutoff:1300,res:0.3}}], cables:['o.out>f.in','f.out>out.in']},
  reply:`Hello? Is it me you're looking for? (Yes. It's you. That's perfect.)`},

{ id:'pluck', tol:1.5, title:'Pluck', concept:'VCA + ADSR', client:'Juniper Vale', role:'Folktronica songwriter',
  unlock:['vca','env'], palette:{osc:1,filter:1,vca:1,env:1}, note:57, gate:1.0, dur:1.6,
  brief:`Every sound you've made so far just… sits there, droning. I want a plucked string, like a kalimba. A quick "plink" that fades away by itself. Soft tone.`,
  manual:`<h4>Shaping volume over time</h4>
  <p>A <b>VCA</b> (voltage-controlled amplifier) is a volume knob that other modules can turn. Plug a control signal into its <b>CV</b> jack and it opens and closes with that signal.</p>
  <p>An <b>envelope</b> (ENV) is a control signal that plays once per note in four stages:</p>
  <ul><li><b>Attack</b>: how long to rise to full when the key goes down.</li><li><b>Decay</b>: how long to fall to the sustain level.</li><li><b>Sustain</b>: the level held while the key stays down (a level, not a time).</li><li><b>Release</b>: how long to fade out after the key is let go.</li></ul>
  <p>Patch <code>OSC → VCA → OUTPUT</code>, then <code>ENV → VCA CV</code>. Blue cables carry control signals; yellow cables carry audio.</p>
  <div class="tip">The loudness plot shows the envelope shape. A pluck: near-instant attack, a decay to silence, zero sustain.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle'}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.003,d:0.35,s:0,r:0.25}}], cables:['o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`Plink! Oh that's lovely. I wrote half a song just listening to it.`},

{ id:'slow-bloom', title:'Slow Bloom', concept:'Pad envelopes', client:'Mira Glass', role:'Ambient composer',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:1}, note:45, gate:1.6, dur:3.2,
  brief:`I score films about fog. I need a warm pad that swells in slowly, like a breath, holds, and then lingers after the note ends. Not too bright.`,
  manual:`<h4>Pads</h4>
  <p>A <b>pad</b> is a long, soft, sustained sound that fills space behind a song. The envelope does most of the work:</p>
  <ul><li><b>Slow attack</b> so it fades in instead of starting abruptly.</li><li><b>High sustain</b> so it holds while the key is down.</li><li><b>Long release</b> so it trails off after.</li></ul>
  <p>You'll need a filter too: pads are usually darker than a raw saw.</p>
  <div class="tip">Build the signal chain <code>OSC → FILTER → VCA → OUTPUT</code>. Get the tone right with the filter first, then shape loudness with the envelope.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:1100,res:0.15}},{id:'v',type:'vca',p:{level:0.8}},{id:'e',type:'env',p:{a:0.85,d:0.5,s:0.7,r:1.2}}], cables:['o.out>f.in','f.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`It breathes. It actually breathes. The fog thanks you.`},

{ id:'wow-bass', title:'Wow Bass', concept:'Filter envelope', client:'The Lowkey Ladies', role:'Funk band, Thursday residency',
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

{ id:'vibrato', tol:3, title:'Vibrato', concept:'LFO → pitch', client:'Rosa Belcanto', role:'Cabaret singer',
  unlock:['lfo'], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:57, gate:1.8, dur:2.0,
  brief:`My accompanist quit. I need a little voice to sing with me: a sweet, soft tone with a gentle wobble in its pitch, the way a singer holds a long note.`,
  manual:`<h4>The LFO</h4>
  <p>An <b>LFO</b> (low-frequency oscillator) is an oscillator too slow to hear as a note. Instead of using it as sound, you use it to <b>move</b> other knobs in a repeating cycle.</p>
  <ul><li><b>RATE</b>: cycles per second. Vibrato is usually 4–7 Hz.</li><li>The <b>MOD AMT</b> on the destination sets the depth. For vibrato, a fraction of a semitone.</li></ul>
  <p>Patch <code>LFO → OSC PITCH</code> to make <b>vibrato</b>.</p>
  <div class="tip">Count the wobbles in the target per second to find the rate. Small depth goes a long way.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'triangle',oct:1,pitchAmt:40}},{id:'l',type:'lfo',p:{rate:5.5}}], cables:['o.out>out.in','l.out>o.pitch']},
  reply:`Bravissimo! We open Friday. Wear something sparkly.`},

{ id:'wobble', tol:3, title:'Wobble', concept:'LFO → filter', client:'BRÖSTEP', role:'Producer, umlaut mandatory',
  unlock:[], palette:{osc:1,filter:1,vca:1,env:2,lfo:1}, note:33, gate:1.8, dur:2.0,
  brief:`YO. I need the WUB. Low, filthy bass where the filter opens and closes in rhythm. WUB WUB WUB. Same tempo as the reference. Don't let me down.`,
  manual:`<h4>Filter wobble</h4>
  <p>Point the LFO at the <b>filter cutoff</b> instead of pitch and the tone opens and closes rhythmically. That's the wobble bass.</p>
  <ul><li><b>LFO RATE</b>: how many wubs per second.</li><li><b>Filter MOD AMT</b>: how far it opens.</li><li><b>CUTOFF</b>: the centre point it swings around.</li><li><b>Resonance</b>: makes it talk.</li></ul>
  <div class="tip">Get the rate first. If yours drifts in and out of time with the target, the rate is close but not exact.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth'}},{id:'f',type:'filter',p:{cutoff:420,res:0.6,cutAmt:2400}},{id:'l',type:'lfo',p:{rate:3,wave:'sine'}}], cables:['o.out>f.in','f.out>out.in','l.out>f.cut']},
  reply:`WUB. WUB. WUUUUB. You're a legend. I'm naming a track after you.`},

{ id:'supersaw', tol:3, title:'Neon Avenue', concept:'Detune', client:'Neon Avenue', role:'Synthwave duo, sunglasses indoors',
  unlock:['fine'], palette:{osc:2,filter:1,vca:1,env:2,lfo:1}, note:45, gate:1.8, dur:2.0,
  brief:`Our lead needs to be BIG. Wide, shimmering, like two synths playing at once. One oscillator sounds thin next to the reference.`,
  manual:`<h4>Detuning</h4>
  <p>Two oscillators on the same note sound like one louder oscillator. Pull them slightly apart with <b>FINE</b> tuning (in cents, 1/100 of a semitone) and they drift in and out of phase. You hear a slow shimmer called <b>beating</b>.</p>
  <ul><li>A few cents apart: gentle chorus.</li><li>10–20 cents apart: thick and wide, the "supersaw."</li><li>Way more: sounds out of tune.</li></ul>
  <p>Patch both oscillators into the same input. Signals patched into one jack get <b>mixed</b> together.</p>
  <div class="tip">The speed of the beating tells you the total detune. Detune one oscillator up and the other down by the same amount.</div>`,
  target:{mods:[{id:'o',type:'osc',p:{wave:'sawtooth',fine:9}},{id:'o2',type:'osc',p:{wave:'sawtooth',fine:-9}},{id:'f',type:'filter',p:{cutoff:2600,res:0.1}}], cables:['o.out>f.in','o2.out>f.in','f.out>out.in']},
  reply:`We put on our sunglasses. Then we put on another pair. Incredible.`},

{ id:'kick', tol:1.5, title:'Kick It', concept:'Pitch envelope', client:'MC Thump', role:'Rapper, needs drums yesterday',
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

{ id:'snare', tol:1.5, title:'Snare Crack', concept:'Noise', client:'Rimshot Rita', role:'Session drummer, broken wrist',
  unlock:['noise'], palette:{osc:2,noise:1,filter:1,vca:1,env:2,lfo:1}, note:50, gate:0.3, dur:0.7,
  brief:`I can't play for six weeks and I've got a session Monday. I need a snare: a tight, bright crack of hiss with a little body tone underneath. Short!`,
  manual:`<h4>Noise</h4>
  <p>A <b>noise</b> source outputs random values: every frequency at once, no pitch. It's the raw material for snares, hi-hats, wind, breath and static.</p>
  <ul><li>Filter noise to shape it: <b>high-pass</b> for crisp hats and snare sizzle, <b>low-pass</b> for rumble.</li><li>Mix in a short <b>tone</b> for the drum's body.</li><li>One envelope on one VCA can shape both at once if you patch them both into the VCA.</li></ul>
  <div class="tip">Final exam: combine everything. The spectrum shows the tone as a spike and the noise as a wide plateau.</div>`,
  target:{mods:[{id:'n',type:'noise',p:{}},{id:'f',type:'filter',p:{type:'highpass',cutoff:1400,res:0.1}},{id:'o',type:'osc',p:{wave:'triangle'}},{id:'v',type:'vca',p:{level:0.9}},{id:'e',type:'env',p:{a:0.001,d:0.16,s:0,r:0.08}}],
    cables:['n.out>f.in','f.out>v.in','o.out>v.in','v.out>out.in','e.out>v.gain']},
  reply:`CRACK. That'll fool the producer for sure. Studio's yours whenever you want it. You're not struggling anymore, kid. You're a sound designer.`},
];
