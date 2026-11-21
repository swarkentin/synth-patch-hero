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
{ id:'pluck', ch:'basics', tol:1.5, title:'Pluck', concept:'VCA + ADSR', client:'Juniper Vale', role:'Folktronica songwriter',
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
{ id:'squelch', ch:'filters', title:'Squelch', concept:'Resonance', client:'Acid Annie', role:'303 devotee, warehouse DJ',
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
{ id:'acid', ch:'filters', challenge:true, tol:1.5, title:'Acid Test', concept:'Challenge', client:'Acid Annie', role:'Back for more squelch',
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
{ id:'wobble', ch:'bass', tol:3, title:'Wobble', concept:'LFO → filter', client:'BRÖSTEP', role:'Producer, umlaut mandatory',
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
];

/* Chapters: Basics is a linear tutorial; every theme opens once Basics is done. */
const CHAPTERS = [
  {id:'basics', title:'Basics', short:'BASICS', blurb:'Your first week in the basement. Seven short lessons on the building blocks. Finish them to open the themes.'},
  {id:'filters', title:'Filter Lab', short:'FILTERS', blurb:'Carve, shape and squelch. Make a synth talk.'},
  {id:'bass', title:'Bass', short:'BASS', blurb:'From clean sub bass to growling engines.'},
  {id:'pads', title:'Pads', short:'PADS', blurb:'Slow, wide, atmospheric beds of sound.'},
  {id:'leads', title:'Leads', short:'LEADS', blurb:'Melody voices that cut through and sing.'},
  {id:'perc', title:'Percussion', short:'DRUMS', blurb:'Drums from nothing but oscillators, noise and envelopes.'},
  {id:'fx', title:'Sound FX', short:'FX', blurb:'Lasers, sirens, wind, and things from outer space.'},
];
CHAPTERS.forEach(c=>{ c.levels=LEVELS.map((L,i)=>L.ch===c.id?i:-1).filter(i=>i>=0); });
