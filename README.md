# Synth Patch Hero

**A Zachtronics-style puzzle game about building synth patches.** You're a broke musician taking gigs from artists who want very specific sounds. Each gig hands you a reference sound and a rack. Patch oscillators, filters, envelopes and LFOs together until your sound matches theirs. Every gig teaches one new piece of synthesis.

![Desktop: brief on the left, slot board in the middle, compare panel with oscilloscope on the right](docs/screenshots/desktop.png)

<p align="center"><img src="docs/screenshots/phone.png" width="300" alt="Phone layout: compare strip on top, zoomable board below"></p>

## Play

- **Hosted:** GitHub Pages, deployed from `main` by [`.github/workflows/pages.yml`](.github/workflows/pages.yml). To turn it on: Settings → Pages → Source: *GitHub Actions*.
- **Locally:** `npm start`, then open http://localhost:8080. Opening `index.html` directly also works.

There's no build step and there are no dependencies: it's plain HTML, CSS and JavaScript using the Web Audio API. Use headphones.

## How it plays

1. **Pick a gig.** Read the client's brief and the manual page for that lesson.
2. **Fill the board.** OUTPUT sits in the top-right slot, and some gigs start with **preset** modules already wired. Tap an empty slot (or a palette button) to add a module. The **Parts** chips (`FILTER 0/1`) tell you what's still missing.
3. **Patch.** Drag from jack to jack, or tap one jack and then another. Yellow cables carry audio, blue cables carry control signals. Click a cable to unplug it.
4. **Tune.** Drag knobs up and down (Shift for fine control, double-click to reset). On touch screens, tap a knob for a big slider.
5. **Compare.** ▶ Target vs ▶ Yours, plus an oscilloscope, loudness and spectrum overlays and hints, are always on screen.
6. **Send** at a 90% match or better. Then come back and beat par on cost.

**Keyboards:** open **♪ Keys** for an on-screen keyboard that shows the client's note to find. USB/MIDI keyboards work in Chrome, Edge, Opera and Firefox on desktop, and Chrome on Android (velocity and sustain pedal included). Computer keys `A`–`K` play too, `Z`/`X` shift the octave, `Space` plays yours and `Shift+T` plays the target. The board zooms with `+` `-` `0`, Ctrl+scroll or pinch.

## Curriculum

| # | Gig | Concept |
|---|-----|---------|
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

Plus **Free Jam**, a sandbox with everything unlocked.

## How matching works

The target and your patch are both rendered offline (`OfflineAudioContext`, 22.05 kHz) and compared on three measures:

- **Spectrogram (50%):** timbre over time, on 1/36-octave bands, with each frame normalized and weighted by loudness.
- **Tone (20%):** the time-averaged spectrum shape.
- **Shape (30%):** the loudness envelope on a perceptual scale.

Each distance becomes a score with `exp(-d/K)`, and the scores are combined with a weighted geometric mean. Gigs built on movement (vibrato, wobble, detune) get a wider tolerance. Because matching listens to the audio, any patch that sounds right passes, not just the reference patch. Hints (pitch in semitones, brighter/darker, attack, length, missing parts) come from pitch detection, spectral centroid and envelope features.

## Project layout

```
index.html          markup only
css/style.css       all styles (desktop, tablet, phone breakpoints)
js/data.js          module types and the gig list (briefs, manual pages, target patches, presets)
js/store.js         saved progress (localStorage) and patch helpers
js/audio.js         Web Audio engine: patch → voice, live playback
js/analysis.js      offline render, FFT, match score, hints
js/ui-core.js       shared UI state and helpers
js/keys.js          on-screen keyboard, computer keys, Web MIDI, play-the-note prompt
js/ui.js            gig board, slot board, zoom/pan, knobs, cables, compare panel
js/selftest.js      scoring calibration run (index.html#selftest)
tests/              headless-Chrome tests (npm test)
scripts/            dev server, screenshot generator
docs/design.md      design notes and decisions
```

## Development

```sh
npm start              # http://localhost:8080
npm test               # scoring calibration + every gig opens on desktop & phone + every gig is solvable
npm run screenshots    # regenerate docs/screenshots/
```

Tests need Node 22+ and Chrome or Chromium on the PATH (or set `CHROME_PATH`). CI runs them on every push and pull request.

**Adding a gig:** add an entry to `LEVELS` in `js/data.js` with a brief, a manual page, a palette, and a `target` patch (plus optional `start` presets and `startCables`). `npm test` checks that it fits the board and that its reference patch scores 100%. If you change the scoring, keep the bands in `tests/run.mjs` passing, or update them on purpose.

See [`docs/design.md`](docs/design.md) for the design decisions behind the layout, slot board, scoring and touch controls.

## License

[MIT](LICENSE)
