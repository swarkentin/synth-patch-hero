# Synth Patch Hero — Design notes (v0.1)

- **Repo (source of truth):** https://github.com/swarkentin/synth-patch-hero (`main`)
- **Playable build:** https://claude.ai/artifact/LntpV9NeJ5v3HUeZpdTfDn, plus GitHub Pages once enabled
- **Stack:** plain HTML/CSS/JS with Web Audio and no build step. `index.html` loads `css/style.css` and `js/*.js`.

## Core loop
Gig board (▶ on each card plays a short demo song on the client's sound) → client brief + manual page → fill the slot board with modules and patch them → compare against the target in the always-visible compare panel → match ≥ 90% → Send → paid → optimize cost ($) to beat par.

## Screen layout (since 2026-11-21)
Feedback that drove it: too much scrolling between panels; you must always be able to compare yours with the target and see the scope; the keyboard was a distraction while solving; the board needed zoom; OUTPUT should never need hunting for; it should be obvious when a module is missing.
- **Desktop (≥1100px):** brief + manual on the left (280px) · board in the middle · compare panel on the right (300px).
- **Tablet (761–1099px):** brief becomes a drawer (Brief button); board + compare panel.
- **Phone (≤760px):** compare strip at the top (▶ Target / ▶ Yours / match % / Send, top hint, one graph with Scope · Loudness · Spectrum tabs, "More" for sub-scores and all hints) · toolbar (Brief, palette, Keys, Reset) · board fills the rest. No tabs.
- **Compare panel:** match bar, Spectrogram/Tone/Shape sub-scores, hints (a missing part is always listed first), an **oscilloscope** (3 cycles of the held note, zero-crossing aligned, target dashed), loudness over time, and the spectrum.
- **Focus mode** (⛶ Focus button or Shift+F; uses the browser's full screen where available, otherwise CSS only on iPhone): hides the top bar and brief (the Brief button opens it as a drawer), and turns the compare panel into a compact bar above the board. On desktop the bar holds ▶ Target / ▶ Yours / match % / Send, the top two hints, and scope + loudness + spectrum side by side. On phones it holds the same strip with scope and loudness side by side. The board gets the rest of the screen. Esc, ✕ or leaving the gig exits focus mode.
- **Keyboard:** hidden by default behind **♪ Keys** (the choice is remembered). MIDI and computer keys play while it's hidden.

**The brief opens with every gig on phones and tablets** (playtest 2026-11-23: mobile players went straight to the puzzle and missed the client and the story). Before, it only opened for a gig with no saved rack. Now it opens every time unless focus mode is on, with a **Take the gig ▶** button at the end of the brief (**Back to the rack ▶** once you've started). Wide screens show the brief beside the rack, so the button is hidden there.

## Slot board
- The board is a grid of slots. Slot count = target modules + OUTPUT + 2 spares, rounded to even, 4–8 (Free Jam: 12). Desktop uses 1–2 rows; phones use 2 columns.
- **OUTPUT is always in the top-right slot**, so it's in view at the default zoom.
- **Presets:** a level can define `start` modules (slot, params, `locked`) and `startCables`. Locked presets can't be moved or deleted, but their knobs can be turned. They're marked PRESET and are free (cost excludes them; par = target cost − preset cost). Used in Dial Tone (OSC), Wow Bass (OSC→VCA→OUT + amp ENV; the player adds FILTER + filter ENV), and Kick It (OSC→VCA→OUT + amp ENV; the player adds the pitch ENV).
- **Parts list:** derived from the target patch, e.g. `OSC ✓ · FILTER 0/1 · ENV 1/2`. When parts are missing, empty slots pulse "NEEDS A MODULE", the palette buttons for the missing types get a dot, and the first hint names the part.
- Adding: tap an empty slot (picker) or a palette button (first empty slot).
- **Moving** (playtest 2026-11-22: "having them stuck in slots is annoying"; dragging wasn't discoverable). Movable modules show a ⠿ grip on the name bar. Drag the name bar to another slot, or **tap** it to pick the module up: free slots show MOVE HERE and other movable modules show SWAP HERE. Tap one to move or swap. Tap the name bar again, or press Esc, to cancel. Presets and OUTPUT stay put. A dragged module lands in the slot nearest **its own centre**, not the pointer's. The pointer sits on the name bar at the module's top, so lining a module up with a slot often left the pointer in the gap above, and the module snapped back (playtest, 2026-11-23). Drops on OUTPUT or a preset now say why they were refused.
- **Free placement** (playtest 2026-11-23: "more of a free form movement, with optional snapping to boxes"):
  - The board's **⊞ SNAP** toggle (next to zoom; **off by default**; saved as `snapOn` only when tapped) decides where a dropped module goes. Playtest 2026-11-23: with Snap on by default, modules "kind of snap back and don't stay where I put them". A short move dropped a module back into its own box. Free placement is now the default, and the old `snap` key (saved as on for everyone) is removed on load. With Snap on, it drops into the nearest box. With Snap off, it stays exactly where it's dropped (`m.slot=null`, `m.x`/`m.y` in board units), anywhere on the board.
  - Holding **Alt** or **Shift** while dragging flips snapping for that drag.
  - The board grows in every direction to hold floating modules, including up and left of the boxes (playtest 2026-11-23: dragging up or far left kept "pulling back", because positions were clamped to the board's corner). Floating positions are grid coordinates and may be negative. `S.grid.off` shifts the board, and the view moves by the same amount, so nothing jumps on screen. Fit includes everything.
  - A floating module doesn't hold a box. A box it mostly covers goes quiet (no "add module") and isn't used for new modules. When every box is taken or covered, new modules (and Help's) float below the board.
  - OUTPUT can't be covered, and presets stay put.
  - Tap-to-move with Snap off: pick a module up, then tap anywhere on the board to put it there.
  - Positions are saved with the patch.
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
- **Jingle = the demo song** (playtest 2026-11-23: "be able to test the song jingle while building"). On Send, the result screen plays the gig's demo song on the player's own patch (a copy), with note markers that light in time (one per note, or one per beat for busy songs) and a ♫ Replay song button. It stops when the dialog closes. It's the same song ♫ Song mode plays on ▶ Yours while building, so players can preview exactly what they'll hear when paid. The separate per-chapter jingle phrases were removed. Test: jingle and song render identically.

## Controls layout (playtest 2026-11-23: "buttons are kind of all over the place")
- **Rule:** keep what plays, how you're doing, and how the screen looks in separate, consistent places, in normal and focus mode.
- **Compare panel, Listen group:** ▶ Target and ▶ Yours, plus a **Note | Song** switch directly under them. It decides what ▶ plays: one held note, or the demo song that's also the end-of-gig jingle.
- **Compare panel, Score group:** match %, **Send** and **Help**, under a divider. In focus mode on wide screens, Listen | Score | hints | graphs run left to right in one bar.
- **Toolbar right side, view switches only:** ▦ Box (only on gigs with a guide for the player's gear; see On your box), ♪ Keys and ⛶ Focus (✕ Exit focus while focused, amber). **Reset** moved to ⚙ Settings → Reset this rack, so a destructive button doesn't sit beside view toggles.
- **Phones:** keep the compact strip (▶ Target · ▶ Yours · % · Send · ?). Song mode stays as the ♫ icon beside Keys and Focus for space.
- **No layout jump on open:** graphs are sized when the panel renders, and on phones the hint area reserves two lines. Before this, the first analysis resized both, shifting the toolbar 31 px about 250 ms after a gig opened, so taps could land on the wrong control. Test: the phone layout holds still.

## Browser history and links
- Playtest, 2026-11-22: pressing Back left the site. Now each screen has an address:
  - the gig board is `#/`;
  - a gig is `#/gig/<id>`;
  - Free Jam is `#/jam`.
- Opening a gig pushes a history entry, so Back returns to the board and Forward reopens the gig.
- **← Gigs** calls `history.back()` when the gig was opened from the board, so entries don't pile up.
- Loading a gig link opens it directly, with the board put underneath in history, so Back still stays in the game.
- `#selftest` is left alone.
- Back from the board itself leaves the site, as expected for the first page.

## Your data (Settings → Your data)
Playtest, 2026-11-22: it was unclear where and what session data is stored.
- **Where it lives:** everything is in `localStorage` under `sph.*` keys, in this browser only. There are no accounts, nothing is uploaded, and there are no analytics or cookies.
- **What's stored:**
  - `progress`: paid gigs with cost and match %, `played` (the note was played), `helped`;
  - `draft2.<gig>`: each gig's rack in progress;
  - preferences: `haptics`, `keysOpen`, `songMode`, `boardView`, `midiAuto`, `snapOn`, `gear` (instruments picked in My gear), `midiIn` and `midiCh` (the MIDI device and channel to listen to). (An old `engine` key from the A/B toggle is removed on load.)
- **The panel** explains this in plain words, shows counts and size, and offers:
  - **Export:** a JSON file `{game, version, exported, data}`;
  - **Import:** replaces everything from such a file;
  - **Delete everything.**
- **Separate copies:** each browser, device and host (GitHub Pages vs. claude.ai) keeps its own progress.
- **Storage blocked:** if the browser blocks storage (private mode), the Settings row says progress only lasts until the page closes.

## Demo songs and ♫ Song mode
- Each gig has a short demo song: a few bars of club music built around the gig's sound. Playtest 2026-11-23: the first songs (major-key climbs over a plain kick and hat) sounded "corny", so they were rebuilt around dance-music grooves, minor keys and rests. All phrases are original; none copy existing tracks.
- **Styles** (`SONGS` in audio.js): acid house (303-style 16ths with accents and octave jumps), house bass (offbeat, with octave pops), techno bass (syncopated offbeat stabs with room to breathe; the first rolling-16ths version sounded harsh on the gritty sync and fold patches), drum & bass (long subs at 172), jungle (sub stabs under a chopped break at 165), half-time wobble at 180 (the wobble gigs' LFOs run at 3 and 6 Hz, which land on quarter and eighth notes at 180, and each note restarts its LFO, so the wobble locks to the beat; at 140 it drifted), a techno lead riff, a melodic-techno arpeggio, deep-house minor-9 chord stabs, lo-fi chords on a swung boom-bap beat, dub-techno chord stabs, a sparse bell riff over dub techno, ambient minor-9 pads (no drums), and held notes alone or over a groove for sounds that move by themselves. Sequencer gigs hold notes at the patch's own SEQ tempo over a groove.
- **Grooves** (`GROOVES`): house, deep house, techno, acid, dub techno, D&B, jungle, half-time and boom bap, written as 16-step lanes (x accent, o normal, . ghost) with optional swing. The kit (`DRUM_KIT`) is built from the game's own modules: a kick (a sine dropping 2.5 octaves, a little drive, a click), a flammed clap, a snare, closed and open hats, a shaker and a rimshot.
- **Percussion gigs** put the player's drum in the groove: the kick gig plays its kick in a boom-bap beat with the backing kick left out, the snare gig plays on 2 and 4 with the clap left out, the hat gig plays 16ths with the hats left out.
- Chosen per chapter (`SONG_BY_CH`), with per-gig overrides that follow the client (`SONG_BY_GIG`, or a `song` field on the gig): the D&B crew gets D&B, the sound-system builder gets jungle, the house DJ gets house, and so on.
- On the gig board, ▶ plays the song on the target. Inside a gig, the **Note | Song** switch makes ▶ Target and ▶ Yours (and Space / Shift+T) play the song instead of one note, so the player can compare their patch in a musical context. It's also the end-of-gig jingle.
- Test: every gig's song renders audible and finite (2–9 s; they run 3–6.5 s).
- **Even levels** (playtest 2026-11-23: some demos, like Pixel Knight, were "way too loud and shrill on a phone"). Before, songs varied by about 25 dB in loudness. Now each gig has a playback level in `SONG_GAIN` (data.js), applied to its demo song, ▶ Target / ▶ Yours notes and keys/MIDI, so target and player stay comparable.
  - `songLoudness` (analysis.js) measures the gig's song on its reference patch two ways: overall loudness with a K-style weighting (rumble below 60 Hz ignored, highs count a bit more), gated like LUFS; and loudness through a phone-speaker curve (no bass below ~350 Hz, 2–5 kHz counted extra).
  - The level brings the song to −22 overall and no louder than −23 through the phone curve, whichever needs more cut, within −15 to +6 dB (quiet bass sounds aren't blown up). Pixel Knight now plays 11 dB quieter; kick and harp get +5 and +6.
  - The table is generated by `npm run loudness`. Measuring live took about half a second per gig on a desktop, too slow before a preview on a phone. `npm test` fails if any entry is more than 1 dB out, or if any song is still above the common level or piercing through the phone curve.
## Sound engine (Studio)
Playtest, 2026-11-23: "the ideas are right, but most sound like a pretty cheap old Casio".
- **A/B first:** Acid Test and Neon Avenue were A/B'd against the browser's stock parts (OscillatorNode, 12 dB biquad, linear envelopes). Studio won, so it's now the only engine.
- **No toggle:** "too much for users to worry about".
- **Fallback:** if a browser can't load the AudioWorklet, oscillators and filters fall back to the stock nodes. Envelopes still curve. Scoring stays fair because target and player always render the same way.
- **Oscillators:** PolyBLEP band-limited oscillators (AudioWorklet `va-osc`) with a slow, seeded analog drift of a few cents. The seed comes from the oscillator's settings, the note and its ordinal, so identical patches render identically and scoring stays exact.
- **Filter:**
  - 12 dB/oct low-pass by default. The supersaw A/B preferred it, because a supersaw needs its bright top.
  - A 4-pole zero-delay-feedback **ladder** (`ladder`) is used on gigs marked `studio:'ladder'`, where squelch is the point: Squelch, Acid Test, Wobble, Random Filter, Tidal Wobble, Warehouse Line and Total Wreck. It's 2× oversampled, with tanh saturation in the feedback loop. Makeup gain of 1 + 1.25·res keeps loudness within about ±20%.
  - HP/BP/notch use the biquad.
- **Envelopes:** an RC-style attack that curves up to full at A, then exponential decay and release (time constant = knob time / 3.5). SEQ-retriggered envelopes curve too. Voices ring for 2× R so the curved tail isn't cut.
- **Studio finish:** live playback only, never scoring. Gentle tanh saturation, glue compression (2.5:1), and a short seeded stereo room at 16%.
- **Processor lifetime:** `va-osc`, `ladder` and `sync-osc` get their note's start time and sleep until then. `stop(t)` sends `{stopAt:t}` and the processor returns false at exactly t. The earliest stop wins, because multi-note gigs stop each note and then the whole render; when two stop times raced, renders weren't repeatable. Without the start-time sleep, a demo song's dozens of pre-created voices all ran from the first beat, which wasted CPU and silenced songs after a bar.
- **Calibration on Studio:**
  - Curved decays made **Pluck** too forgiving of a long decay (0.5 s vs 0.35 s scored 92), so Pluck got `tolShape:0.45` (now 0.5 s → 80, 0.4 s → 91).
  - Bands moved on purpose: supersaw with no detune now 58 (was ≥ 60; Studio makes plain unison more obvious), so the band is 40–89.9. Bonk with a halved decay is 54 (band 0–60).
  - Every gig still passes: reference = 100, untouched < 80, Help rescues in ≤ 16 steps, bypassing any module fails.
  - Acid Test on the ladder: cutoff +0.2 oct 86, square 38.
- `STUDIO` in audio.js switches parts (ladder, drift, finish) one at a time for listening tests.

## Modules (cost)
Prices are in dollars, roughly what the real module would cost new (playtest 2026-11-23: at 1–3¢ the parts were "way too cheap"). Cost still works as before: the patch's total, compared with par (the reference patch minus presets). Costs saved before the change were in cents, so they're dropped from saved progress; match % and cables stay. Palette chips show the price, with how many are left in a small corner badge, so the toolbar doesn't grow.

- OSC $240: wave, oct, semi, fine, pitch MOD AMT (bipolar, ±48 st), and an **FM** audio input with FM AMT (linear FM, ± Hz).
- NOISE $90.
- FILTER $220: LP/HP/BP/**notch**, cutoff, res, cutoff MOD AMT (bipolar, ±6 oct).
- VCA $110: level, CV in.
- ENV $140: ADSR, linear segments.
- LFO $130: wave, rate.
- **MIXER** $90: three inputs, three levels.
- **HARMONIC** $320: additive oscillator with six drawbars (H1–H6, sine partials at 1×–6×).
- **DELAY** $290: MS/NOTE sync, time, feedback, mix, tone (low-pass in the feedback loop, peak-free so the loop gain stays below 1), and a TIME mod input with MOD depth (chorus). NOTE sync sets the time to one period of the played note, which gives Karplus–Strong strings. Web Audio's minimum delay inside a feedback loop is 128 frames (5.8 ms at the 22.05 kHz scoring rate), so string gigs keep notes at or below about 170 Hz.
- **REVERB** $340: size (seconds), mix. The impulse response is generated from seeded noise, so renders are deterministic.
- **DRIVE** $160: tanh waveshaper, drive, level.
- **Advanced tier:**
  - **SYNC OSC** $280: hard-sync oscillator (saw/square, oct, RATIO 1–8×, SWEEP input + amount). Hard sync needs per-sample phase resets, so it runs in a small AudioWorklet (4× oversampled) loaded from a Blob URL, or a data: URL on `file://`. Offline renders await the worklet; until it's ready, live playback falls back to a plain saw. RATIO and SWEEP move in 0.05 steps because sync timbre is very sensitive to ratio.
  - **RING MOD** $120: multiplies inputs A and B (silent without both).
  - **FUNC** $260: function generator. RISE/FALL, ONCE (one AD shape per note, ignores the hold) or LOOP (a drawable LFO).
  - **MOD VCA** $100: a VCA for control signals with a bipolar AMOUNT (attenuverter). Used for modulation controlling modulation, e.g. delayed vibrato.
  - **FOLDER** $230: sine wavefolder (FOLD 1–8×, CV with MOD AMT, LEVEL), 4× oversampled.
  - **LPG** $210: low-pass gate. One CV drives the volume and the cutoff (8 octaves) together. OPEN sets the resting state.
  - **FILTER KEY TRK** (feature `keytrk`): the cutoff follows the note relative to middle C. Only the bonus gig uses it.
- **SEQ** $380: 8-step sequencer of 16th notes. Step values are bipolar drawbars (±12 st); STEPS, BPM, GATE %, GLIDE. PITCH out is in octaves and connects straight to an oscillator's detune, so it's followed exactly (MOD AMT doesn't apply). Into a filter's CUT it goes through MOD AMT as usual. GATE out is 0/1 for GATE % of each step. ENV gains a **TRIG** input (feature `seq`): a SEQ GATE there restarts the ADSR on every step instead of once per note. Steps run while the note is held (30 s horizon for live notes).
- **S&H** $150: sample and hold. Random steps from a fixed 32-step seeded sequence, so targets are repeatable. Rate is stepped at 0.5 Hz, so exact values are reachable.
- **COMB** $250: a feedback comb filter (a tuned resonator). HZ or NOTE tuning (NOTE follows the played note), FREQ, bipolar FDBK (positive rings on every harmonic, like a pipe or metal; negative keeps only the odd ones, an octave down: hollow, like a clarinet), TONE (damping in the loop), MIX (about 50% plus a moving tuning is a flanger), and a FREQ CV input with MOD AMT in octaves. It runs in an AudioWorklet (`comb`) with a fractional, sample-accurate delay, because a DelayNode can't be shorter than 128 frames inside a feedback loop, which would cap a comb at about 170 Hz. The wet signal is scaled by √(1−fb²), so noise going in keeps about the same level. Without worklets it falls back to a DelayNode loop. It also matches the Digitone II's Comb−/Comb+ filter machines.

Yellow cables = audio, blue = control. Modulation depth lives on the destination (MOD AMT knobs). Bipolar knobs fill from the centre. Knobs and jacks unlock per lesson. Modules with five or more knobs use a denser knob layout so they fit a slot.

## Curriculum (89 gigs in 21 chapters + Free Jam)
Structure: **Basics** (7 gigs) is the suggested starting point, followed by sixteen **themes**, three **advanced** chapters (marked ADVANCED on the board, `level:'advanced'`) and a **Bonus** chapter (`bonus:true`, exempt from the one-challenge rule). **Every gig is open from the start** (playtest, 2026-11-22: let people explore and skip ahead); progress is still recorded per gig. **Browsing: a lesson tree** (playtest 2026-11-23: the chips were "really cheesy", took up space and made it hard to see where to start and how to explore). Wide screens get a sticky sidebar beside the gigs:
  - A **Start here / Next up** card opens the earliest unsolved gig.
  - A compact **All / To do / Done** switch, and a **▦ My box** toggle that keeps only gigs with an On your box guide for your gear. With no gear picked, it says **My gear…** and opens that sheet.
  - The tree: All lessons, then chapters grouped START · THEMES · ADVANCED · EXTRAS, each with a done/total count and a thin progress line, and Free Jam last. Picking a chapter shows just that chapter and opens its gigs in the tree (✓ done, ● next, ○ to do, ★ challenge, ▦ has a guide); tapping a gig opens it. Each gig in the tree has its own small ▶ to preview its demo song right there (playtest 2026-11-23: picking the chapter, then finding ▶ on the card, was one step too many). The cards keep their ▶ too. Chapters with nothing left under the current filters are dimmed.
  - The view is saved (`boardView`: chapter, status, My box). Filtering only hides cards, so a playing preview keeps going.
  - **Phones:** everything collapses into one bar: a chapter picker (name and count, ▾) beside the filters and My box. The picker opens the tree as a dropdown; picking a chapter closes it.

Each gig card has a round **▶ preview** button that plays a short **demo song** on the target patch right on the board, so players can browse by ear before picking a gig. Tap again to stop. Starting another preview or opening a gig stops the current one. It sits beside the card rather than inside it, so it never opens the gig, and on iPhone it's its own haptic tap target. The board suggests an order: each chapter marks its first unsolved gig as **NEXT**, and the ledger's "Next lesson" is the earliest unsolved gig. Each theme ends in exactly one **challenge** gig (`challenge:true`), which hides the parts list and missing-part names (showing only "N/M modules") and gives guiding questions instead of steps.
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
- **Comb Lab** (playtest 2026-11-23: "we should also have some comb filter lessons"): Tuned Pipe (noise through a comb comes out pitched) · Hollow Reed (negative feedback: odd harmonics, an octave down) · Jet Stream (an LFO sweeping a half-mixed comb: flanging) · ★ Tunnel Chimes (a tick rings a comb that follows the note, into reverb)
- **Industrial** (playtest 2026-11-23: "and some industrial patch lessons"): Factory Floor (a kick driven into grit) · Sheet Metal (inharmonic ring-mod clang) · Grinder (dissonant ring mod, drive, then a filter to tame it) · ★ Machine Room (S&H jumps a comb's tuning, through drive)
- **Step Sequencer:** First Steps (pitch + gate) · Pluck Every Step (retriggered envelope) · Slide (glide, legato gate) · ★ Warehouse Line (acid bassline: resonant filter with a per-step envelope, gate fanned out to the VCA and the ENV TRIG)
- **Random & Generative:** Computer Bleeps (sample & hold) · Random Filter · ★ Robot Babble
- **Repair Shop:** broken, unlocked presets to diagnose. No Signal (signal flow) · Muffled Mess (diagnosing tone) · Wrong Jack (audio vs. control) · Seasick (modulation depth) · ★ Total Wreck
- **Sync & Ring** (advanced): Torn Edge (hard sync) · Sync Sweep (envelope → ratio) · Robot Voice (ring modulation) · ★ Screamer
- **Modulation Deep Dive** (advanced): Strike Once (function generator, ignores the hold) · Pump (looping custom LFO shape) · Late Vibrato (MOD VCA: an envelope controls vibrato depth) · ★ Tidal Wobble
- **West Coast** (advanced): Fold (wavefolding) · Bloom (enveloped folding) · Bonk (low-pass gate) · ★ Wooden Toy (one FUNC feeds both the folder and the LPG)
- **Bonus:** Even Keel (key tracking). The target is a fixed four-note run (A1 → A4, via the `seq` field), so no keyboard is needed. The manual suggests trying it on ♪ Keys or MIDI afterwards. Key tracking otherwise stays out of the curriculum, because most players won't have a keyboard.

**Features** (which knobs/jacks are visible): in Basics they unlock lesson by lesson (`unlock`). In themes the player gets everything from Basics plus waveform/resonance/filter type, plus whatever the chapter's gigs so far use (derived from their reference patches: `fine`, `noise`, `mod`, …).

**Multi-note targets:** `seq:[[semitones, start, gate], …]` renders several notes of the same patch (each ending after its own gate + release). The brief shows `NOTES A1 → A2 → …` instead of NOTE/HOLD.

**Quality checks per gig** (`npm test`): the reference patch scores 100%; an untouched rack scores under 80%; ids are unique; every theme ends in one challenge; every gig is open; NEXT points at each chapter's earliest unsolved gig, even when later gigs were solved out of order. When authoring, also check that removing any module from the reference patch (bypassing it, so the chain stays connected) scores under 90%, so a gig can't be passed by skipping its lesson, and that the knob a lesson teaches fails when it's clearly wrong.

## Icon
`favicon.svg` (an amber knob and a teal patch cable on the dark panel colour) for browser tabs, `apple-touch-icon.png` (180 px, rendered from the SVG) for phone home screens, and a `theme-color` matching the background.

## Client portraits
Playtest 2026-11-23: the briefs should feel like a character asking for help. Every client has a 32×32 pixel-art portrait drawn in code (`js/portrait.js`, no image files), shown beside their name in the brief and on the Patch accepted screen. The brief and the reply sit in speech bubbles that point at the portrait.
- The client's name seeds the look (skin, hair style and colour, shirt, background, expression), so a returning client looks the same every time.
- Props come from the client's first role: headphones (DJs, producers, promoters), a mic (singers, hosts, podcasts), a guitar neck, drumsticks, keys, a flute, shades (synthwave, acid), glasses (professors, doctors), a clerical collar or veil, a bow tie (orchestra, theatre), a patch cable (modular artists), a cap, closed eyes for the calm ones, and a robot head for robot acts.
- Duos get one dimmed bandmate behind them; bands, crews and trios get two.

## Offline render memory
Chrome keeps every OfflineAudioContext that has loaded AudioWorklet code (about 0.5 MB each, plus its output buffer; details in ideas.md). To keep that down:
- **Help's knob trials** render together in one context, one patch per channel (`renderPatches`, up to 32 per context). Each channel is bit-identical to rendering that patch alone, because everything is built before rendering starts.
- **Match updates** remember the last 24 versions of the player's patch (`renderMine`, keyed by gig, modules, params and cables, not positions), so undo or moving a knob back needs no new render.

## Matching
Offline render at 22.05 kHz, then: spectrogram distance (per-frame normalized, loudness-weighted, 1/36-oct bands) 50%, average-spectrum tone 20%, perceptual loudness envelope 30%. Score = exp(-d/K) per part, geometric mean. Per-level `tol` multiplies K, so above 1 is more forgiving and below 1 stricter. Movement-based gigs get more (vibrato, wobble, detune, chorus, Seasick = 3; fast LFO gigs Siren and Close Encounter, and the S&H gigs = 5; percussive, Temple Gong, Harp, Bonk and Wooden Toy = 1.5; sync gigs = 2, because sync timbre shifts sharply with ratio). The drawbar lessons get 0.7, so a harmonic that's clearly off fails. `tolShape` optionally sets a separate, stricter loudness-shape tolerance (1.2 on slow-movement pads/leads/FX), so a gig can't be passed by leaving out its volume envelope. Calibration: `index.html#selftest`, enforced by `npm test`.
Calibrated outcomes: exact = 100; cutoff +0.2 oct ≈ 94; decay −9% ≈ 88; wrong waveform 10–35; 1 semitone off < 7.

## Touch details
- Tap-to-patch: tap a jack, then the destination. A bar at the bottom offers Unplug and Done.
- Tap a knob to open a bottom sheet: large slider, −/+ steps, Reset, ▶ Yours. Finger-dragging a knob is about 2.7× less sensitive than mouse dragging.
- On iOS, `navigator.audioSession.type = 'playback'` so sound plays with the silent switch on.

## Keyboards and "play the note"
- The keyboard highlights the client's note and describes it relative to middle C ("the third A below middle C"). Wrong notes get coaching by semitones or octaves. Success saves `progress.played[gig]` and adds ♪ to the gig card. After that, every key plays the patch.
- MIDI, on-screen keys and computer keys share one `keyDown`/`keyUp` path. Velocity maps to loudness 0.35–1.0. Sustain pedal (CC64) and all-notes-off are supported.
- **Settings → MIDI** (playtest 2026-11-23: "no clue how it is supposed to work"). Also opened from the MIDI chip under the keyboard. It says in plain words what MIDI does today (notes from a keyboard, synth or groovebox play your patch; nothing is sent back yet), and shows:
  - status with Connect / Reconnect;
  - **Device:** All devices or one of the connected ones (saved as `midiIn`; a saved device that's unplugged stays listed as "not plugged in");
  - **Channel:** All channels or 1–16 (saved as `midiCh`);
  - a light that flashes on every note or knob move, saying which note, channel and device it came from. Messages that don't match the chosen device or channel flash amber and say **ignored**, with what the game is listening to, so a wrong channel is obvious;
  - tips: start on All channels to find your box's channel; grooveboxes often send per track and need MIDI or USB MIDI out switched on; knob moves aren't used yet; if MIDI is blocked on claude.ai, play on GitHub Pages instead.
  - Clock, start/stop and other system messages are ignored.
- Web MIDI works in Chrome/Edge/Opera/Firefox desktop and Chrome on Android; iOS Safari has none. The hosted artifact frame may block MIDI, so GitHub Pages (or opening `index.html` directly) works around that.

## On your box (first cut, 2026-11-23)
The game stays a modular synth. A standalone synth or groovebox is the affordable way to practise the same ideas, so a gig can carry a guide for making its sound on a real instrument. Design mockup: `docs/mockups/real-gear/`.
- **Settings → My gear** (saved as `gear`): a modular rack (later), then standalone boxes: Digitone II (live), MiniFreak and MC-707 (later). Nothing is picked by default.
- **Gig board:** gigs with a guide for your gear get a small teal badge (e.g. `DT II`).
- **In a gig:** a ▦ **Box** button appears in the toolbar's view switches, only on gigs with a guide. It opens a drawer under the rack (like the keyboard), closed by default, so the default fit and OUTPUT are unchanged. The compare panel stays put.
  - Steps on the left. The current step has its text, the game's own words for it, Back and **Done on my box**. Step ticks last until you leave the gig; nothing new is saved.
  - A wireframe panel: a copy of the box's screen (same page layout and parameter names, in the game's type, values to change shown inverted), the page keys with the current one lit, and the eight knobs A–H with the ones to turn lit and a pointer at roughly where to aim.
  - A "Same idea, its words" row, a note about which cables the box already has inside, and the source manual with a not-affiliated line.
  - Cables the box has built in (on the Digitone II, envelope → filter CUT and envelope → VCA gain) get a dashed teal overlay and an **IN YOUR BOX** tag on the rack while the drawer is open. Matching is by module type and jack, so it works on the player's own patch.
- **Honesty:** names come from the maker's manual; positions are rough ("~1/4"), and the drawer says ROUGH POSITIONS. Where we haven't confirmed which knob a value sits on, the order is our best reading of the manual.
- **Layout:** with ▦ Box showing on screens under 1400 px, Keys and Focus go icon-only so the toolbar doesn't grow. Phones show only the current step, the screen, page keys and knobs; the drawer caps at 46% of the height.
- **Data:** `GEAR` and `GEAR_GUIDES` in `js/data.js`, the drawer in `js/gear.js`. Tests check every guide points at a real gig, real jacks and the box's own page keys, and that the drawer works on desktop and phone.
- **Guides so far (Digitone II):**
  - Thin Walls: Wavetone → Multi-Mode at LP, FREQ down → keep the AMP envelope out of the way.
  - Acid Test: Wavetone → Lowpass 4 → its filter envelope → AMP.
  - Neon Avenue: the Swarmer machine stands in for two detuned oscillators (MIX, DET) → Multi-Mode, fairly open.
- **Comparing for now:** without MIDI out, a guide's last step says to play a short A2 on the box and flip with ▶ Target set to Note. (The song's notes aren't shown, so "play along with the song" isn't possible yet; see ideas.md, MIDI.)

## Roadmap / open ideas
See **[docs/ideas.md](ideas.md)**. It's the single ideas bucket, including the real-gear track (Digitone II, MiniFreak, MC-707): concept→gear map, panel maps that show where to reach on the real box, device racks, MIDI knob reading, and a stretch "listening mode" that scores the real box.
