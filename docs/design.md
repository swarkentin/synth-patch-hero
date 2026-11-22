# Synth Patch Hero — Design notes (v0.1)

- **Repo (source of truth):** https://github.com/swarkentin/synth-patch-hero (`main`)
- **Playable build:** https://claude.ai/artifact/LntpV9NeJ5v3HUeZpdTfDn, plus GitHub Pages once enabled
- **Stack:** plain HTML/CSS/JS with Web Audio and no build step. `index.html` loads `css/style.css` and `js/*.js`.

## Core loop
Gig board (▶ on each card previews the client's target sound) → client brief + manual page → fill the slot board with modules and patch them → compare against the target in the always-visible compare panel → match ≥ 90% → Send → paid → optimize cost (¢) to beat par.

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

## Phone chrome (from iPhone playtest, 2026-11-22)
- **Problems seen:**
  - The page was wider than the screen, because the compare buttons couldn't wrap; it could be dragged sideways and edges were clipped.
  - The on-screen keyboard reopened on every gig, and its toggle was off-screen.
  - The haptics toggle was only at the bottom of the gig board.
- **Now:**
  - Nothing may exceed the screen width (tested at 390 and 375px).
  - Top bar: title · **⚙ Settings** · ←.
  - Compare strip: ▶ Target · ▶ Yours · % · Send · round **?** Help; hint clamped to 2 lines; shorter graph; no duplicate progress bar.
  - Toolbar: Brief · scrolling palette · fixed ♪ Keys and ⛶ Focus icons. Reset moved to Settings.
  - On phones the keyboard always starts hidden (the "keep open" preference is desktop-only), and it has its own × close.
- **⚙ Settings** (everywhere): Haptics on/off (a real iOS `switch`), On-screen keyboard, Focus mode, Reset this rack. The temporary iPhone haptic tests and Test button were removed once the technique was settled.

## Feel: haptics and the end-of-gig jingle
- **Haptics** (`js/haptics.js`, touch devices only, on/off switch on the gig board, saved): a knob tick at each step (stepped knobs) or every 5% (smooth knobs), and a firmer bump at an end stop. Cable plug = one solid pulse, unplug = double tap, add/move/remove a module = thunk, choice buttons and jack picks = light tick, on-screen keys = tiny tick, crossing 90% and Send = celebration pattern. Throttled so fast turns don't blur into one buzz.
  - Android and most browsers: `navigator.vibrate`.
  - iPhone (Safari and Chrome, both WebKit) has no vibrate(). On iOS 18+ we create a hidden `<input type="checkbox" switch>` inside a label, click it, and remove it straight away (a fresh one per tick, matching the known-working technique), which plays the system switch haptic. On older iOS nothing happens. This is unofficial; the Settings haptics control is itself a native switch, so flipping it shows whether switch haptics work on that phone/browser at all.
  - **Playtest result (2026-11-22, iPhone):** flipping the native switch in Settings ticks, but code-triggered ticks (Test) don't. Current iOS appears to require a real finger tap on the switch.
    - Added **technique 3**: tap targets are `<label>`s wrapping an invisible switch (`Haptics.tapTarget`), so the finger's own tap toggles it natively and iOS ticks. Used for the knob editor's −/+ buttons.
    - Three-way test on the iPhone: only **3 (switch under the finger)** ticks. Code-triggered switch clicks never do, even inside a tap handler.
    - **So on iPhone:**
      - Every tap target is a `<label role="button">` with an invisible switch (`Haptics.upgrade` / `addSwitch` / `tapTarget`): jacks, palette, empty slots and the slot picker, waveform/filter-type choices, knobs (tap) and knob-editor −/+, ▶ Target / ▶ Yours, Send, Help, Brief, Keys, Focus, ⚙, ←, the Unplug/Done bar, Help-card buttons, the on-screen keyboard, gig cards, and Settings → Test.
      - Code-triggered haptics are off on iOS. Drags (knob turns, cable drags) can't tick.
      - iOS flips the switch only after the tap's click handlers run, so actions that rebuild the tapped element are deferred one tick (`Haptics.later`).
      - Disabled targets (e.g. Send below 90%) and the Haptics off switch disable the hidden switches.
      - Tests drive real taps through Chrome's input pipeline to check one tap = one action, the switch flips, and every target carries a switch.
  - Playtest on iPhone (Chrome): haptics worked for a few seconds, then stopped. Cause: WebKit only plays the switch haptic right after a real tap or release (transient user activation); a finger sliding across a knob, timers and async work don't count. So on iOS we fire only while `navigator.userActivation.isActive`, use a single tick (no delayed pulses), and knobs tick once **on release** after turning instead of during the drag (`Haptics.continuous` is false). Tap-driven feedback still works: −/+ in the knob editor, plugging cables, adding modules, keys, Send. The "crossed 90%" buzz usually arrives after async analysis, so it won't fire on iPhone.
- **Jingle:** on Send, the result screen plays a short phrase on the player's own patch (a copy, scheduled with the normal voice engine), shaped per chapter, with note markers that light in time and a Replay button. It stops when the dialog closes.
  - melodic "ta-da" arpeggio (Basics, Filters, Leads)
  - funky riff (Bass)
  - IV → I chords (Pads)
  - drum fill on one pitch (Percussion)
  - three hits at different pitches (Sound FX)
  - falling plucked arpeggio (Effects Rack, Strings & Plucks), so delay tails and string decays get room
  - Test: every gig's jingle, rendered offline on its reference patch, is audible and finite.

## Modules (cost)
- OSC 2¢: wave, oct, semi, fine, pitch MOD AMT (bipolar, ±48 st), and an **FM** audio input with FM AMT (linear FM, ± Hz).
- NOISE 1¢.
- FILTER 3¢: LP/HP/BP/**notch**, cutoff, res, cutoff MOD AMT (bipolar, ±6 oct).
- VCA 1¢: level, CV in.
- ENV 2¢: ADSR, linear segments.
- LFO 2¢: wave, rate.
- **MIXER** 1¢: three inputs, three levels.
- **HARMONIC** 3¢: additive oscillator with six drawbars (H1–H6, sine partials at 1×–6×).
- **DELAY** 3¢: MS/NOTE sync, time, feedback, mix, tone (low-pass in the feedback loop, peak-free so the loop gain stays below 1), and a TIME mod input with MOD depth (chorus). NOTE sync sets the time to one period of the played note, which gives Karplus–Strong strings. Web Audio's minimum delay inside a feedback loop is 128 frames (5.8 ms at the 22.05 kHz scoring rate), so string gigs keep notes at or below about 170 Hz.
- **REVERB** 3¢: size (seconds), mix. The impulse response is generated from seeded noise, so renders are deterministic.
- **DRIVE** 2¢: tanh waveshaper, drive, level.
- **S&H** 2¢: sample and hold. Random steps from a fixed 32-step seeded sequence, so targets are repeatable. Rate is stepped at 0.5 Hz, so exact values are reachable.

Yellow cables = audio, blue = control. Modulation depth lives on the destination (MOD AMT knobs). Bipolar knobs fill from the centre. Knobs and jacks unlock per lesson. Modules with five or more knobs use a denser knob layout so they fit a slot.

## Curriculum (64 gigs in 14 chapters + Free Jam)
Structure: **Basics** (7 gigs) is the suggested starting point, followed by thirteen **themes**. **Every gig is open from the start** (playtest, 2026-11-22: let people explore and skip ahead); progress is still recorded per gig. Each gig card has a round **▶ preview** button that plays the target sound right on the board, so players can browse by ear before picking a gig. Tap again to stop. Starting another preview or opening a gig stops the current one. It sits beside the card rather than inside it, so it never opens the gig, and on iPhone it's its own haptic tap target. The board suggests an order: each chapter marks its first unsolved gig as **NEXT**, and the ledger's "Next lesson" is the earliest unsolved gig. Each theme ends in exactly one **challenge** gig (`challenge:true`), which hides the parts list and missing-part names (showing only "N/M modules") and gives guiding questions instead of steps.
- **Basics:** Dial Tone (oscillator, pitch, cables) · Shape of Sound (waveforms) · Pixel Knight (intervals) · Thin Walls (low-pass) · Curtain Call (VCA + envelope: sustain & release, with OSC → VCA → OUT pre-wired) · Pluck (all four ADSR stages, built from scratch) · Vibrato (LFO, modulation)
- **Filter Lab:** Squelch (resonance) · Payphone (filter types) · Thin Air (high-pass) · Talk Box (formants) · The Scoop (notch) · Upside Down (inverted filter envelope) · ★ Acid Test
- **Bass:** Sub Club (sub bass) · Wow Bass (filter envelope, presets) · Pluck Bass · Wobble (LFO → filter) · ★ Reese
- **Pads:** Slow Bloom · Glass Pad (layering) · Breathing Pad (slow LFO) · ★ String Section
- **Leads:** Brass Stab (filter attack) · Neon Avenue (detune) · Night Flute (expressive lead) · ★ Stadium Lead
- **Percussion:** Kick It (pitch envelope, presets) · Floor Tom (tuning) · Snare Crack (noise) · Hi-Hat (short envelopes) · ★ Cowbell
- **Sound FX:** Laser Zap (pitch sweeps) · Siren (square LFO) · Wind (filtered noise) · ★ Close Encounter
- **Mix Desk:** Sub Layer (mixing sources) · Breath & Tone (mixing noise) · ★ Layer Cake
- **Harmonics Lab:** Octave Up (harmonics) · Build a Square (odd harmonics) · Build a Saw (additive synthesis) · ★ Drawbar Organ
- **FM Studio:** Metal Ring (carrier, modulator, ratio) · Bell Tower (FM bells) · Electric Piano (modulation envelope via a VCA) · ★ Temple Gong
- **Effects Rack:** Slapback (delay, presets) · Canyon Echo (feedback, tone) · Big Room (reverb) · Chorus (modulated delay) · Fuzz Box (distortion) · ★ Dub Stab
- **Strings & Plucks:** Plucked String (Karplus–Strong, presets) · Nylon (damping) · ★ Harp
- **Random & Generative:** Computer Bleeps (sample & hold) · Random Filter · ★ Robot Babble
- **Repair Shop:** broken, unlocked presets to diagnose. No Signal (signal flow) · Muffled Mess (diagnosing tone) · Wrong Jack (audio vs. control) · Seasick (modulation depth) · ★ Total Wreck

**Features** (which knobs/jacks are visible): in Basics they unlock lesson by lesson (`unlock`). In themes the player gets everything from Basics plus waveform/resonance/filter type, plus whatever the chapter's gigs so far use (derived from their reference patches: `fine`, `noise`, `mod`, …).

**Quality checks per gig** (`npm test`): the reference patch scores 100%; an untouched rack scores under 80%; ids are unique; every theme ends in one challenge; every gig is open; NEXT points at each chapter's earliest unsolved gig, even when later gigs were solved out of order. When authoring, also check that removing any module from the reference patch (bypassing it, so the chain stays connected) scores under 90%, so a gig can't be passed by skipping its lesson, and that the knob a lesson teaches fails when it's clearly wrong.

## Matching
Offline render at 22.05 kHz, then: spectrogram distance (per-frame normalized, loudness-weighted, 1/36-oct bands) 50%, average-spectrum tone 20%, perceptual loudness envelope 30%. Score = exp(-d/K) per part, geometric mean. Per-level `tol` multiplies K, so above 1 is more forgiving and below 1 stricter. Movement-based gigs get more (vibrato, wobble, detune, chorus, Seasick = 3; fast LFO gigs Siren and Close Encounter, and the S&H gigs = 5; percussive, Temple Gong and Harp = 1.5). The drawbar lessons get 0.7, so a harmonic that's clearly off fails. `tolShape` optionally sets a separate, stricter loudness-shape tolerance (1.2 on slow-movement pads/leads/FX), so a gig can't be passed by leaving out its volume envelope. Calibration: `index.html#selftest`, enforced by `npm test`.
Calibrated outcomes: exact = 100; cutoff +0.2 oct ≈ 94; decay −9% ≈ 88; wrong waveform 10–35; 1 semitone off < 7.

## Touch details
- Tap-to-patch: tap a jack, then the destination. A bar at the bottom offers Unplug and Done.
- Tap a knob to open a bottom sheet: large slider, −/+ steps, Reset, ▶ Yours. Finger-dragging a knob is about 2.7× less sensitive than mouse dragging.
- On iOS, `navigator.audioSession.type = 'playback'` so sound plays with the silent switch on.

## Keyboards and "play the note"
- The keyboard highlights the client's note and describes it relative to middle C ("the third A below middle C"). Wrong notes get coaching by semitones or octaves. Success saves `progress.played[gig]` and adds ♪ to the gig card. After that, every key plays the patch.
- MIDI, on-screen keys and computer keys share one `keyDown`/`keyUp` path. Velocity maps to loudness 0.35–1.0. Sustain pedal (CC64) and all-notes-off are supported.
- Web MIDI works in Chrome/Edge/Opera/Firefox desktop and Chrome on Android; iOS Safari has none. The hosted artifact frame may block MIDI, so GitHub Pages (or opening `index.html` directly) works around that.

## Roadmap / open ideas
- Melodic targets: play A1 → C2 → E2 prompts, then riffs; glide/portamento; arpeggiators.
- Tremolo (LFO → VCA) as its own lesson; key tracking on the filter; pulse width and PWM.
- Blind "ear" gigs that hide the graphs; budget gigs with a hard cost cap; remix gigs that change one quality of an existing patch.
- Vocabulary quizzes between chapters (which knob makes it "brighter", "plucky", "wider"?).
- More presets in later gigs (e.g. a prebuilt filter section in Wobble, so the lesson focuses on the LFO).
- Histograms of player scores; story chapters.
