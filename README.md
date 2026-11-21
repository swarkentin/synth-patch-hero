# Synth Patch Hero

A Zachtronics-style puzzle game about building synth patches. You play a broke musician who takes gigs from artists. Each gig gives you a reference sound to match by patching modules on a virtual modular synth. Every gig teaches one new synthesis concept.

Everything is in one file: `index.html`. Open it in a desktop browser (it uses the Web Audio API). There is no build step and nothing to install.

## How to play

1. Pick a gig on the board. Read the client brief and the manual page for that lesson.
2. Add modules from the palette. Drag a jack to another jack to patch a cable. Click a cable to unplug it.
3. Drag knobs up and down (hold Shift for fine control, double-click to reset).
4. Compare **▶ Target** and **▶ Yours**. The right panel shows a match score, hints, and overlaid loudness and spectrum plots.
5. At 90% or better, send it to the client. Then come back and solve it cheaper (cost ¢), Zachtronics-style.

On phones (≤760px wide) the level screen switches to three tabs (Brief / Rack / Match), with Target, Yours and the match % always visible at the top. Modules stack in signal-flow order, and cables run along a left-hand gutter. Tap a jack, then tap where it goes (this also works on desktop). Tap a knob to open a slider with −/+ steps. Dragging a knob with a finger works too, at lower sensitivity.

### Keyboards

Each gig has an on-screen keyboard: a dock under the rack on desktop, or the **Keys** tab on phones. It shows the client's note highlighted, plus a plain description ("the third A below middle C"). Playing it marks the gig with ♪. Wrong notes get coaching such as "That's C2. A1 is 3 semitones lower" or "Right note, wrong octave: go 1 octave down". After that, every key plays your patch.

**USB / MIDI keyboards** connect through the Web MIDI API ("Connect USB keyboard"). Supported in Chrome, Edge, Opera and Firefox on desktop, and Chrome on Android. Note-on velocity sets loudness, and the sustain pedal (CC64) is supported. iPhone and iPad Safari have no Web MIDI, so use the on-screen keys there. Some embedded or sandboxed viewers block MIDI. Opening `index.html` directly, or hosting it (e.g. GitHub Pages), avoids that.

Keys: `A`–`K` play your patch (black keys on `W E T Y U`), `Z`/`X` shift the octave, `Space` plays yours, `Shift+T` plays the target.

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
