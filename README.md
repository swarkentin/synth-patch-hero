# Synth Patch Hero

A Zachtronics-style puzzle game about building synth patches. You play a broke musician who takes gigs from artists. Each gig gives you a reference sound to match by patching modules on a virtual modular synth. Every gig teaches one new synthesis concept.

Everything is in one file: `index.html`. Open it in a desktop browser (it uses the Web Audio API). There is no build step and nothing to install.

## How to play

1. Pick a gig on the board. The brief and the manual page for that lesson sit on the left (on phones and tablets, tap **Brief**).
2. The rack is a board of slots. The **OUTPUT**, plus any **preset** modules the gig provides, start in fixed slots. Dashed empty slots are where your modules go. Tap an empty slot or a palette button to add one.
3. The **Parts** chips show what the sound needs (e.g. `FILTER 0/1`). Missing parts pulse, and the top hint names them.
4. Patch cables by dragging between jacks, or tap one jack and then another. Click a cable to unplug it. Drag a module's header to move it to another slot.
5. Turn knobs by dragging up and down (Shift = fine, double-click resets). On touch screens, tap a knob for a big slider with −/+ steps.
6. The compare panel is always visible: ▶ Target / ▶ Yours, match %, hints, an **oscilloscope** (a few cycles of both waveforms), loudness over time, and the spectrum. On phones it's a strip at the top with Scope / Loudness / Spectrum tabs.
7. Zoom the rack with − / + / Fit, Ctrl+scroll or pinch. Drag empty space to pan.
8. At 90% or better, **Send** it. Then try to beat par on cost (¢). Preset modules are free.

## Curriculum

| # | Gig | Concept introduced |
|---|-----|--------------------|
| 1 | Dial Tone | Oscillator, pitch, patch cables |
| 2 | Shape of Sound | Waveforms and harmonics |
| 3 | Pixel Knight | Intervals (octaves, fifths) |
| 4 | Thin Walls | Low-pass filter, cutoff |
| 5 | Squelch | Resonance |
| 6 | Payphone | Filter types (LP / HP / BP) |
| 7 | Pluck | VCA + ADSR envelope |
| 8 | Slow Bloom | Pad envelopes |
| 9 | Wow Bass | Modulation: filter envelope |
| 10 | Vibrato | LFO → pitch |
| 11 | Wobble | LFO → filter |
| 12 | Neon Avenue | Detune and beating |
| 13 | Kick It | Pitch envelope (synth drums) |
| 14 | Snare Crack | Noise |

There's also **Free Jam**, a sandbox with every module unlocked and no target.

## How matching works

Both the target and your patch are rendered offline (`OfflineAudioContext`, 22.05 kHz) and analyzed in JavaScript:

- **Spectrogram** (50%): timbre over time. 2048-point FFT, sampled on a 1/36-octave log scale, each frame normalized to its own peak and weighted by loudness.
- **Tone** (20%): the time-averaged spectrum shape.
- **Shape** (30%): the loudness envelope on a perceptual (amplitude^0.5) scale.

Each distance maps to a score with `exp(-d / K)`. The overall score is the weighted geometric mean. Levels built on movement (vibrato, wobble, detune) use a wider tolerance (`tol`), because small rate differences add up across a note. Because matching is done on the audio, any patch that sounds right passes, not just the reference patch.

Hints (pitch in semitones, brighter/darker, attack and length) come from a normalized-autocorrelation pitch detector, the spectral centroid, and envelope features.

To check calibration, open `index.html#selftest`. It renders about 60 near-miss variants and prints their scores.

## Code map (inside `index.html`)

- `MT`: module definitions (ports, params, cost, which lesson unlocks each knob)
- `LEVELS`: gig data (brief, manual text, palette limits, target patch, reply)
- `buildVoice()`: turns a patch into a Web Audio graph (envelopes drive `ConstantSourceNode`s; modulation goes to `detune` in cents)
- `analyze()` / `compare()`: offline analysis and scoring
- UI: gig board, rack (drag modules, patch cables), knobs, right-hand match panel

Progress and in-progress patches are saved in `localStorage`.

## Ideas for next steps

- More modules: second filter, mixer with levels, sample & hold, FM (audio-rate modulation), delay, distortion
- Histograms of other players' cost/cable scores, like Zachtronics
- Story beats between chapters and an end-of-act "album" where your patches get used in a song
- Melodic targets (play a short riff, not a single note)
- Touch-friendly layout for tablets
