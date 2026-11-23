# Ideas & roadmap

A parking lot for where Synth Patch Hero could go next. Nothing here is committed or scheduled. When an idea is picked up, move the decision into `docs/design.md` and tick it here.

**Status:** 🟢 ready to build · 🟡 needs a design pass or research · 🔴 stretch / uncertain · ✅ done

---

## North star: get better on real synth boxes

> "The goal really would be to take our learnings here and use them to become even better at real synth boxes." (2026-11-23)

The game already teaches concepts by ear: oscillators, filters, envelopes, FM, sync, folding, sequencing. The next step is to **transfer** those concepts to the instruments players own. Reference gear on hand: **Elektron Digitone II**, **Arturia MiniFreak**, **Roland MC-707** (ZEN-Core).

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
| Comb filter (Karplus–Strong, Strings & Plucks) | Comb− / Comb+ filter machines | Comb Filter mode; Karplus Str. mode | — |
| Function generator / looping envelope (Modulation Deep Dive) | — | **Cycling envelope** (rise / hold / fall; one-shot, Run or Loop, up to audio rate) | — |
| LFOs, S&H, modulating modulation | 3 assignable LFOs per track | 2 LFOs + custom shapes + mod matrix (incl. mod of mod) | 2 LFOs per partial, matrix control |
| Layering (Mix Desk) | 16 tracks | 2 engines into the filter | Up to 4 partials per tone |
| Effects Rack | Per-voice drive, bit/sample-rate reduction; send FX | 3 FX slots | Many effects per partial / tone |
| Sequencer (Step Sequencer) | Elektron sequencer, trig conditions | 64-step sequencer, arpeggiator | Grooveboxes: clip sequencer |
| Formants / vowels (Talk Box, Robot Babble) | — | Formant, Speech modes | — |

### Building blocks, smallest first

1. 🟢 **"On your box" notes in existing gigs.** A short, optional panel per gig, for example "On a MiniFreak: the cycling envelope in Loop mode is this gig's FUNC." It's shown for gear the player picks in Settings ("My gear": none / Digitone II / MiniFreak / MC-707). This is cheap and immediately useful, but every note must be checked against the manual.
2. 🟡 **Device racks.** Locked, pre-wired preset racks that mirror each box's signal flow, with its labels and value ranges (e.g. 0–127), so the numbers learned transfer to the real knobs. Presets, locks and Help already support most of this.
3. 🟡 **Engine additions to cover the boxes:**
   - Comb± filters.
   - A **4-operator FM** voice with algorithms and feedback (Digitone FM Tone).
   - A wavetable / phase-distortion oscillator (Wavetone, MiniFreak Wavetable).
   - A **hold** stage and Run/Loop modes on FUNC (MiniFreak cycling envelope).
   - A base-width filter (HP+LP pair).
   - A 12 dB state-variable LP/BP/HP that behaves like an analog SVF.
   - The **MiniFreak** builds on open-source Eurorack oscillator code, so some of its modes have published reference algorithms. Check the licences before porting anything (and keep the no-dependencies rule).
   - Out of reach: **ZEN-Core PCM waveforms** and any factory samples (proprietary recordings).
4. 🟡 **Read the real knobs over MIDI.** If a box sends parameter changes (CC/NRPN), Help can compare the player's real knob against the target ("your cutoff is about 20 too high") and lock-step lessons can wait for the right knob. This needs per-device CC/NRPN maps from the manuals. Web MIDI works in desktop Chrome/Edge/Firefox and Chrome on Android, **not on iPhone**.
5. 🔴 **Listening mode: score the real box.** The game sends a note over MIDI, records the box through the audio interface or mic, and scores it with the existing matcher, so the player turns real knobs and watches the match % climb. Judged a stretch, but on the right track.
   - Unknowns: latency alignment, level calibration, room noise and mic colour. The scoring would need a "gear" tolerance profile.
   - Desktop/Android only.
   - **Intermediate step with no mic:** the game plays the target and the player matches it on the box by ear, then rates themselves. Optionally they can record a clip into the browser for an A/B.
6. 🟡 **A first device pack: Digitone II.** It's closest to the current engine (Swarmer ≈ supersaw, FM Tone ≈ FM Studio, Lowpass 4 ≈ ladder, comb filters ≈ strings). It could start with a chapter of 4–5 gigs, built in the order of the blocks above.

### Brand and licensing rules of thumb (not legal advice)
- Naming the instruments descriptively ("for Digitone II owners") is generally fine.
- No logos, panel art or trade dress copies. No factory presets or samples. Never imply endorsement.
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
