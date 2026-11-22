# Synth Patch Hero — Design notes (v0.1)

- **Repo (source of truth):** https://github.com/swarkentin/synth-patch-hero (`main`)
- **Playable build:** https://claude.ai/artifact/LntpV9NeJ5v3HUeZpdTfDn, plus GitHub Pages once enabled
- **Stack:** plain HTML/CSS/JS with Web Audio and no build step. `index.html` loads `css/style.css` and `js/*.js`.

## Core loop
Gig board → client brief + manual page → fill the slot board with modules and patch them → compare against the target in the always-visible compare panel → match ≥ 90% → Send → paid → optimize cost (¢) to beat par.

## Screen layout (since 2026-11-21)
Feedback that drove it: too much scrolling between panels; you must always be able to compare yours with the target and see the scope; the keyboard was a distraction while solving; the board needed zoom; OUTPUT should never need hunting for; it should be obvious when a module is missing.
- **Desktop (≥1100px):** brief + manual on the left (280px) · board in the middle · compare panel on the right (300px).
- **Tablet (761–1099px):** brief becomes a drawer (Brief button); board + compare panel.
- **Phone (≤760px):** compare strip at the top (▶ Target / ▶ Yours / match % / Send, top hint, one graph with Scope · Loudness · Spectrum tabs, "More" for sub-scores and all hints) · toolbar (Brief, palette, Keys, Reset) · board fills the rest. No tabs.
- **Compare panel:** match bar, Spectrogram/Tone/Shape sub-scores, hints (a missing part is always listed first), an **oscilloscope** (3 cycles of the held note, zero-crossing aligned, target dashed), loudness over time, and the spectrum.
- **Focus mode** (⛶ Focus button or Shift+F; uses the browser's full screen where available, otherwise CSS only on iPhone): hides the top bar and brief (the Brief button opens it as a drawer), and turns the compare panel into a compact bar above the board. On desktop the bar holds ▶ Target / ▶ Yours / match % / Send, the top two hints, and scope + loudness + spectrum side by side. On phones it holds the same strip with scope and loudness side by side. The board gets the rest of the screen. Esc, ✕ or leaving the gig exits focus mode.
- **Keyboard:** hidden by default behind **♪ Keys** (the choice is remembered). MIDI and computer keys play while it's hidden.

## Slot board
- The board is a grid of slots. Slot count = target modules + OUTPUT + 2 spares, rounded to even, 4–8 (Free Jam: 12). Desktop uses 1–2 rows; phones use 2 columns.
- **OUTPUT is always in the top-right slot**, so it's in view at the default zoom.
- **Presets:** a level can define `start` modules (slot, params, `locked`) and `startCables`. Locked presets can't be moved or deleted, but their knobs can be turned. They're marked PRESET and are free (cost ¢ excludes them; par = target cost − preset cost). Used in Dial Tone (OSC), Wow Bass (OSC→VCA→OUT + amp ENV; the player adds FILTER + filter ENV), and Kick It (OSC→VCA→OUT + amp ENV; the player adds the pitch ENV).
- **Parts list:** derived from the target patch, e.g. `OSC ✓ · FILTER 0/1 · ENV 1/2`. When parts are missing, empty slots pulse "NEEDS A MODULE", the palette buttons for the missing types get a dot, and the first hint names the part.
- Adding: tap an empty slot (picker) or a palette button (first empty slot). Moving: drag a module's header to another slot (swaps with unlocked modules).
- **Zoom/pan:** − / + / Fit buttons, Ctrl/⌘+scroll or trackpad pinch, two-finger pinch on touch, drag empty space to pan, keys `+ - 0`. The board auto-fits when a level opens and on resize, until the player zooms by hand.

## Help ladder (js/help.js)
Feedback that drove it: difficulty rises fast (especially the VCA lesson); players need hints and helpers, such as locking knobs with an explanation of what they do and why.
- **Help button** (next to Send). Each press goes one step further, and nothing changes without the player confirming:
  1. **Wiring first.** Help pairs the player's modules with the reference patch (by type, wiring and knob similarity; the pairing is kept stable once chosen). It names the first missing module, missing cable or extra cable, and says why it matters. **Patch it for me** adds the missing modules and cables and unplugs extra ones; knob settings are kept.
  2. **Most important knob.** Help tries each visible knob at the client's value behind the scenes (offline renders) and picks the one that raises the score most. It names the knob, says which way it's off ("fades out too slowly"), and explains what the knob does, without giving the value.
  3. **Lock it for me** sets that knob to the client's value and locks it. A locked knob shows a LOCKED tag; tapping it explains what it does, what the player had, the client's value, and why it was locked, with an **Unlock** button.
- **Stuck detection:** after 60s on a gig, 10+ changes, and no score gain of 2+ points for 40s, the Help button pulses and a one-time toast offers it.
- Gigs finished with help show "helped" on the board (`progress.helped`). The pay is the same.
- Test: from an untouched rack, repeatedly applying Help passes every gig within 16 steps (most gigs take 2–11).

## Knob controls
- **Drag** up/down (mouse 0.35%/px, Shift 0.07%/px; touch 0.22%/px).
- **Click/tap without dragging** opens the precise editor: big slider, − / + (about 0.25% of the range, or one step on stepped knobs) and −− / ++ (3%), ←/→ keys (Shift for bigger steps), Reset, ▶ Yours.
- **Wheel/trackpad** follows the scroll distance (0.06% per pixel, Shift 0.015%). Coarse stepped knobs (OCT, SEMI, FINE) move one step per ~40px. This fixes trackpads sending dozens of events per swipe, which previously moved 1% per event.

## Feel: haptics and the end-of-gig jingle
- **Haptics** (`js/haptics.js`, touch devices only, on/off switch on the gig board, saved): a knob tick at each step (stepped knobs) or every 5% (smooth knobs), and a firmer bump at an end stop. Cable plug = one solid pulse, unplug = double tap, add/move/remove a module = thunk, choice buttons and jack picks = light tick, on-screen keys = tiny tick, crossing 90% and Send = celebration pattern. Throttled so fast turns don't blur into one buzz.
  - Android and most browsers: `navigator.vibrate`.
  - iPhone (Safari and Chrome, both WebKit) has no vibrate(). On iOS 18+ we click a hidden `<input type="checkbox" switch>`, which plays the system switch haptic. On older iOS nothing happens.
  - Playtest on iPhone (Chrome): haptics worked for a few seconds, then stopped. Cause: WebKit only plays the switch haptic right after a real tap or release (transient user activation); a finger sliding across a knob, timers and async work don't count. So on iOS we fire only while `navigator.userActivation.isActive`, use a single tick (no delayed pulses), and knobs tick once **on release** after turning instead of during the drag (`Haptics.continuous` is false). Tap-driven feedback still works: −/+ in the knob editor, plugging cables, adding modules, keys, Send. The "crossed 90%" buzz usually arrives after async analysis, so it won't fire on iPhone.
- **Jingle:** on Send, the result screen plays a short phrase on the player's own patch (a copy, scheduled with the normal voice engine), shaped per chapter, with note markers that light in time and a Replay button. It stops when the dialog closes.
  - melodic "ta-da" arpeggio (Basics, Filters, Leads)
  - funky riff (Bass)
  - IV → I chords (Pads)
  - drum fill on one pitch (Percussion)
  - three hits at different pitches (Sound FX)
  - Test: every gig's jingle, rendered offline on its reference patch, is audible and finite.

## Modules (cost)
OSC 2¢ (wave, oct, semi, fine, pitch mod amt) · NOISE 1¢ · FILTER 3¢ (LP/HP/BP, cutoff, res, cutoff mod amt in octaves) · VCA 1¢ (level, CV in) · ENV 2¢ (ADSR, linear segments) · LFO 2¢ (wave, rate).
Yellow cables = audio, blue = control. Modulation depth lives on the destination (MOD AMT knobs). Knobs and jacks unlock per lesson.

## Curriculum (34 gigs in 7 chapters + Free Jam)
Structure: **Basics** is a linear tutorial (7 gigs). Finishing it opens all six **themes** at once; within a theme, gigs unlock in order. Each theme ends in exactly one **challenge** gig (`challenge:true`). A challenge hides the parts list and the missing-part names, showing only "N/M modules", and its manual gives guiding questions instead of steps.
- **Basics:** Dial Tone (oscillator, pitch, cables) · Shape of Sound (waveforms) · Pixel Knight (intervals) · Thin Walls (low-pass) · Curtain Call (VCA + envelope: sustain & release, with OSC → VCA → OUT pre-wired) · Pluck (all four ADSR stages, built from scratch) · Vibrato (LFO, modulation)
- **Filter Lab:** Squelch (resonance) · Payphone (filter types) · Thin Air (high-pass) · Talk Box (formants) · ★ Acid Test
- **Bass:** Sub Club (sub bass) · Wow Bass (filter envelope, presets) · Pluck Bass · Wobble (LFO → filter) · ★ Reese
- **Pads:** Slow Bloom · Glass Pad (layering) · Breathing Pad (slow LFO) · ★ String Section
- **Leads:** Brass Stab (filter attack) · Neon Avenue (detune) · Night Flute (expressive lead) · ★ Stadium Lead
- **Percussion:** Kick It (pitch envelope, presets) · Floor Tom (tuning) · Snare Crack (noise) · Hi-Hat (short envelopes) · ★ Cowbell
- **Sound FX:** Laser Zap (pitch sweeps) · Siren (square LFO) · Wind (filtered noise) · ★ Close Encounter

**Features** (which knobs/jacks are visible): in Basics they unlock lesson by lesson (`unlock`). In themes the player gets everything from Basics plus waveform/resonance/filter type, plus whatever the chapter's gigs so far use (derived from their reference patches: `fine`, `noise`, `mod`, …).

**Quality checks per gig** (`npm test`): the reference patch scores 100%; an untouched rack scores under 80%; ids are unique; every theme ends in one challenge; unlock order is correct. When authoring, also check that removing any module from the reference patch scores under 90%, so a gig can't be passed by skipping its lesson.

## Matching
Offline render at 22.05 kHz, then: spectrogram distance (per-frame normalized, loudness-weighted, 1/36-oct bands) 50%, average-spectrum tone 20%, perceptual loudness envelope 30%. Score = exp(-d/K) per part, geometric mean. Per-level `tol` widens tolerance for movement-based gigs (vibrato, wobble, detune = 3; fast LFO gigs Siren and Close Encounter = 5; percussive = 1.5). `tolShape` optionally sets a separate, stricter loudness-shape tolerance (1.2 on slow-movement pads/leads/FX), so a gig can't be passed by leaving out its volume envelope. Calibration: `index.html#selftest`, enforced by `npm test`.
Calibrated outcomes: exact = 100; cutoff +0.2 oct ≈ 94; decay −9% ≈ 88; wrong waveform 10–35; 1 semitone off < 7.

## Touch details
- Tap-to-patch: tap a jack, then the destination. A bar at the bottom offers Unplug and Done.
- Tap a knob to open a bottom sheet: large slider, −/+ steps, Reset, ▶ Yours. Finger-dragging a knob is about 2.7× less sensitive than mouse dragging.
- On iOS, `navigator.audioSession.type = 'playback'` so sound plays with the silent switch on.

## Keyboards and "play the note"
- The keyboard highlights the client's note and describes it relative to middle C ("the third A below middle C"). Wrong notes get coaching by semitones or octaves. Success saves `progress.played[gig]` and adds ♪ to the gig card. After that, every key plays the patch.
- MIDI, on-screen keys and computer keys share one `keyDown`/`keyUp` path. Velocity maps to loudness 0.35–1.0. Sustain pedal (CC64) and all-notes-off are supported.
- Web MIDI works in Chrome/Edge/Opera/Firefox desktop and Chrome on Android; iOS Safari has none. The hosted artifact frame may block MIDI, so GitHub Pages (or opening `index.html` directly) works around that.

## Open ideas
- Melodic prompts (play A1 → C2 → E2), then riff targets.
- More presets in later gigs (e.g. a prebuilt filter section in Wobble, so the lesson focuses on the LFO).
- Mixer, FM, sample & hold, effects; histograms of player scores; story chapters.
