# Ideas & roadmap

A parking lot for where Synth Patch Hero could go next. Nothing here is committed or scheduled. When an idea is picked up, move the decision into `docs/design.md` and tick it here.

**Status:** 🟢 ready to build · 🟡 needs a design pass or research · 🔴 stretch / uncertain · ✅ done

---

## North star: get better on real synth boxes

> "The goal really would be to take our learnings here and use them to become even better at real synth boxes." (2026-11-23)

The game already teaches concepts by ear: oscillators, filters, envelopes, FM, sync, folding, sequencing. The next step is to **transfer** those concepts to the instruments players own. Reference gear on hand: **Elektron Digitone II**, **Arturia MiniFreak**, **Roland MC-707** (ZEN-Core).

### Two paths off the screen
The game is a modular synth: modules and cables. That stays the core. Off the screen there are two ways to go:
- **A modular rack.** The game maps 1:1: a module is a module and a cable is a cable. This is where the patching skills carry over most directly, but a rack is expensive to start.
- **A standalone synth or groovebox** (MiniFreak, Digitone II, MC-707). It's the **affordable way to learn today** for players who can't buy a modular rack yet. The same modules are inside, but they're pre-wired, and the cables become pages, envelope-depth knobs and a mod matrix.

Gear guidance should teach that translation explicitly: "this cable is already wired inside your box" (a fixed filter envelope, an amp envelope on the VCA), and "this cable is a mod-matrix slot" (cycling envelope → cutoff). It should also be honest about what a box can't do (no audio-rate cross-patching, a fixed filter order). Skills learned on a box still count when a player moves up to a rack later.

- 🟡 **"Already wired" cables.** When a gear tab is on, mark the cables in the game patch that the chosen box has built in (dimmed with a small "inside your box" tag). Mark the ones that need a matrix slot or a menu differently.
- 🟡 **A generic "modular rack" entry in My gear.** No brand: steps say "patch your VCO's saw out to the filter in". This sits next to the standalone boxes. Brand-specific modules can come later.

### Why this fits
- Most of what a player learns here maps directly onto these boxes. The table below shows the overlap.
- What makes this game different from other synth trainers (open-ended patches scored by sound, Help that explains, repair gigs) carries over naturally to "make this sound on *your* box."

### Concept → gear map (from spec sheets; verify every row against the manuals before building)

| Concept in the game | Digitone II | MiniFreak | MC-707 (ZEN-Core) |
|---|---|---|---|
| Supersaw / detune (Neon Avenue) | Swarmer machine | Superwave mode | Supersaw oscillator |
| FM (FM Studio) | FM Tone: 4-operator FM with algorithms; FM Drum | Two Op. FM mode | (PCM cross-mod; no classic FM) |
| Wavetables / phase distortion | Wavetone: 2 oscillators, wavetable + phase distortion | Wavetable mode | PCM waves (proprietary) |
| Low-pass ladder (Acid Test, Squelch) | Lowpass 4 filter machine | Analog 12 dB state-variable LP | Several modeled filter types |
| Multimode / HP / BP / notch (Filter Lab) | Multi-Mode filter machine, plus a base-width filter on every voice | Analog filter LP/BP/HP; Multi Filter engine mode | Filter types per partial |
| Comb filter (Comb Lab; Karplus–Strong in Strings & Plucks) | Comb− / Comb+ filter machines | Comb Filter mode; Karplus Str. mode | — |
| Function generator / looping envelope (Modulation Deep Dive) | — | **Cycling envelope** (rise / hold / fall; one-shot, Run or Loop, up to audio rate) | — |
| LFOs, S&H, modulating modulation | 3 assignable LFOs per track | 2 LFOs + custom shapes + mod matrix (incl. mod of mod) | 2 LFOs per partial, matrix control |
| Layering (Mix Desk) | 16 tracks | 2 engines into the filter | Up to 4 partials per tone |
| Effects Rack | Per-voice drive, bit/sample-rate reduction; send FX | 3 FX slots | Many effects per partial / tone |
| Sequencer (Step Sequencer) | Elektron sequencer, trig conditions | 64-step sequencer, arpeggiator | Grooveboxes: clip sequencer |
| Formants / vowels (Talk Box, Robot Babble) | — | Formant, Speech modes | — |

### Building blocks, smallest first

1. 🟢 **"On your box" notes and panel maps in existing gigs.** *Built for the Digitone II: Thin Walls, Acid Test and Neon Avenue (see docs/design.md, On your box). Next: more gigs, then MiniFreak.* A short, optional panel per gig, for example "On a MiniFreak: the cycling envelope in Loop mode is this gig's FUNC." It's shown for gear the player picks in Settings ("My gear": none / Digitone II / MiniFreak / MC-707), with a panel map highlighting where the control lives (see Showing the real gear). This is cheap and immediately useful, but every note must be checked against the manual.
2. 🟡 **Device racks.** Locked, pre-wired preset racks that mirror each box's signal flow, with its labels and value ranges (e.g. 0–127), so the numbers learned transfer to the real knobs. Presets, locks and Help already support most of this.
3. 🟡 **Engine additions to cover the boxes:**
   - ✅ Comb± filters: the COMB module (bipolar feedback), used in Comb Lab and Industrial.
   - A **4-operator FM** voice with algorithms and feedback (Digitone FM Tone).
   - A wavetable / phase-distortion oscillator (Wavetone, MiniFreak Wavetable).
   - A **hold** stage and Run/Loop modes on FUNC (MiniFreak cycling envelope).
   - A base-width filter (HP+LP pair).
   - A 12 dB state-variable LP/BP/HP that behaves like an analog SVF.
   - The **MiniFreak** builds on open-source Eurorack oscillator code, so some of its modes have published reference algorithms. Check the licences before porting anything (and keep the no-dependencies rule).
   - Out of reach: **ZEN-Core PCM waveforms** and any factory samples (proprietary recordings).
4. 🟢 **Send the client's phrase to the box (MIDI out).** The game plays the demo song's notes out to the box on the track's channel, in time with ▶ Target, so both play the same line for A/B. Needs only a port and channel picker, no CC tables. Until then, guides compare one short note.
5. 🟡 **Read the real knobs over MIDI.** If a box sends parameter changes (CC/NRPN), Help can compare the player's real knob against the target ("your cutoff is about 20 too high") and lock-step lessons can wait for the right knob. This needs per-device CC/NRPN maps from the manuals. Web MIDI works in desktop Chrome/Edge/Firefox and Chrome on Android, **not on iPhone**.
6. 🔴 **Listening mode: score the real box.** The game sends a note over MIDI, records the box through the audio interface or mic, and scores it with the existing matcher, so the player turns real knobs and watches the match % climb. Judged a stretch, but on the right track.
   - Unknowns: latency alignment, level calibration, room noise and mic colour. The scoring would need a "gear" tolerance profile.
   - Desktop/Android only.
   - **Intermediate step with no mic:** the game plays the target and the player matches it on the box by ear, then rates themselves. Optionally they can record a clip into the browser for an A/B.
7. 🟡 **A first device pack: Digitone II.** It's closest to the current engine (Swarmer ≈ supersaw, FM Tone ≈ FM Studio, Lowpass 4 ≈ ladder, comb filters ≈ strings). It could start with a chapter of 4–5 gigs, built in the order of the blocks above.
   - Reference: the [Digitone II manual, OS 1.12](https://www.elektron.se/media/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf); a third-party layout at https://www.knobwerk.com/en/digitone2 as a fallback.
   - Checked so far: a 128 × 64 OLED that shows eight values in the same places as DATA ENTRY knobs A–H. Page keys: TRIG, SYN, FLTR, AMP, FX, MOD. Lowpass 4 has FREQ, RESO, ENV and its own filter envelope (ATK, DEC, SUS, REL) on FLTR page 1. AMP: ATK, HOLD, DEC, SUS, REL, MODE, PAN, VOL. Wavetone page 1: TUN1, WAV1, PD1, LEV1, TUN2, WAV2, PD2, LEV2.
   - Still to check: which knob each value sits on, value ranges, and the knob layout on the panel.

### Showing the real gear: panel maps (rules of thumb, not legal advice)
Teaching *where to reach* on the box is central to this track, the same way gear tutorials show the hardware.
- 🟢 **Panel maps.** Accurate diagrams of each box's control layout, drawn in the game's own style: real knob and button positions, groupings and labels, pages and menus. The lesson's control lights up ("turn this one"). We draw them from our own measurements of the hardware.
- 🟢 **Names and labels.** Name the instruments and their controls descriptively ("FILTER → FREQ on the Digitone II"), with a "not affiliated with or endorsed by" note on gear content.
- 🟢 **Wireframes only.** Every box gets the same wireframe treatment; no photo option. It's easier to build, looks the same across boxes, and nothing has to be tapped into place.
- 🟢 **A copy of its screen.** If the box has a display (an OLED, an LCD), show a lookalike of it next to the wireframe: the same page layout, parameter names and values, in the game's type. Highlight the values to change. It stays pinned in view while the panel moves, so players can check they grabbed the right knob.
- 🟢 **Wide boxes.** Some panels are too wide to show whole and still read (a MiniFreak; imagine a PolyBrute). Show a thin overview strip of the whole panel with a window over the part drawn below. The window follows each step to its section, and the player can drag it or switch to "whole panel". Small boxes just show the whole panel.
- Mockup of this flow for Acid Test on Digitone II and MiniFreak: https://claude.ai/artifact/1pE43QM3CdVrQ13h5jBucY (source in [`docs/mockups/real-gear/`](mockups/real-gear/))
- 🔴 **Avoid:** manufacturer press photos, renders and manual illustrations (copyrighted; ask for permission, since some makers have educator or creator programs). Logos and pixel-faithful copies of the panel artwork, or anything that reads as an official app. Factory presets and samples.
- Describe the game on its own terms (see CLAUDE.md); gear names belong only in gear-specific content.

---

## Curriculum and game ideas

- 🟡 **Melodic targets.** Play A1 → C2 → E2 prompts, then riffs. Arpeggiators. Multi-note `seq` targets already work.
- 🟢 **Tremolo** (LFO → VCA) as its own lesson.
- 🟡 **Pulse width and PWM.**
- 🟢 **A quantizer** for the sequencer and S&H (random notes in a scale). Accents and rests on sequencer steps.
- 🟡 **Physical modeling:** an exciter + resonator (marimba, blown bottle, bowed string).
- 🟡 **FM operators with feedback.** Also the path to Digitone FM Tone.
- 🟡 **A self-oscillating filter** played as an oscillator.
- 🟢 **Translation challenges:** match a filtered target using only FM or only folding. They show off open-ended scoring, which knob-matching trainers can't do.
- 🟢 **Blind "ear" gigs** that hide the graphs. **Budget gigs** with a hard cost cap. **Remix gigs** that change one quality of an existing patch.
- 🟢 **Vocabulary quizzes** between chapters: which knob makes it "brighter", "plucky", "wider"?
- 🟡 **Community gigs:** an in-game gig editor and shareable gig links (no server: encode the gig in the URL).
- 🟢 **More presets in later gigs** (e.g. a prebuilt filter section in Wobble, so the lesson focuses on the LFO).
- 🔴 Histograms of player scores; story chapters.

## Sound

- 🟡 **Offline renders leak memory in Chrome** (found 2026-11-24). Every `OfflineAudioContext` that loads AudioWorklet code is kept for good, at about 0.5 MB for the worklet scope plus its output buffer. Forced GC doesn't free it, and idling frees only a little. It happens with an empty one-line module, from Blob, data: or same-origin file URLs alike; plain contexts don't leak. The game renders offline for every match update and every Help trial.
  - ✅ **Done:** Help's knob trials render in one context, one patch per channel (`renderPatches`), so a Help step with 10 trials makes 1 context instead of 11, about 4× less memory. The last 24 versions of the player's patch are remembered (`renderMine`), so undo or turning a knob back doesn't render again. `npm test` reloads the page every 15 gigs in the Help-rescue check.
  - ❌ **Tried, not kept:** one long-lived shared context that suspends, builds the next render, and resumes. In this Chrome the whole context (output buffer too) is retained, so it saved at most ~2×. Chrome also applies changes made while suspended a block or two late, now and then, so renders weren't always exact (some came out badly wrong). Waiting for processors, a lead-in, keeping nodes alive and render-twice checks made it reliable but no cheaper than before.
  - **Still open:** each match update costs one context (~0.6 MB), so a very long session still grows. Ideas: render match updates at a lower rate while a knob is being dragged; check whether Safari and Firefox leak the same way; report it to Chromium with the one-line repro.

- 🟡 **A sound-design pass** on gig targets and demo songs, so client sounds are genuinely good patches and not just correct ones.
- 🟢 **Better drums** under demo songs; a bass line under lead songs; light ducking.
- 🟡 **Ladder-style HP/BP**, and a chorus worth the name (stereo, multi-voice).
- 🔴 **Stereo scoring** (the matcher is mono today).

## Done (for context)
- ✅ The Studio engine everywhere: band-limited oscillators with drift, a ladder filter on squelchy gigs, curved envelopes, a studio finish.
- ✅ Hard sync, ring mod, function generator, MOD VCA, wavefolder, low-pass gate (advanced chapters).
- ✅ Step sequencer with glide and retriggered envelopes; a key-tracking bonus gig.
- ✅ Demo songs on every gig (also the end-of-gig jingle), ♫ Note | Song switch.
- ✅ Free module placement with optional Snap; Back/Forward routes; Your data panel.
