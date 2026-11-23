# Mockup: real-gear training (Acid Test on Digitone II and MiniFreak)

Design mockup for the "On your box" track in [`docs/ideas.md`](../../ideas.md). This isn't game code: nothing here is loaded by `index.html`.

**View it:** https://claude.ai/artifact/1pE43QM3CdVrQ13h5jBucY (a design canvas with all five screens). The files here are its source. They need the canvas runtime (`support.js`), so they won't render properly opened straight from disk.

| File | Screen |
|---|---|
| `Gear.dc.html` | Settings → My gear: a modular rack, or a standalone box as the affordable way in. Gig cards show badges for the gear that fits. |
| `Main.dc.html` | The Acid Test gig with the "On your box" drawer (Digitone II): steps, a wireframe panel with a copy of the 128 × 64 OLED, a table of matching terms, and "IN YOUR BOX" tags on pre-wired cables. |
| `MiniFreak.dc.html` | The same drawer on the MiniFreak tab: live MIDI readout, an overview strip for the wide panel with a window that follows each step, and a pinned screen copy. |
| `OnYourBox.dc.html` | After getting paid: make the sound on your box by ear, with live knobs over MIDI, or by listening (stretch). |
| `Phone.dc.html` | Phone (390 × 844): an "On your box" bottom sheet under the compact compare strip. |
| `canvas.json` | The canvas layout and notes. |

**What's real and what's a draft:**
- **Digitone II:** the screen, page keys, Lowpass 4 and Wavetone parameter names, and AMP parameter names are from the manual (OS 1.12).
- **Not yet confirmed:** which knob letter each value is on, value ranges and knob layout.
- **MiniFreak:** control names are from spec sheets, and the section order on the overview strip is a guess.
- **Values:** the values on the box are rough knob positions.

If the design changes, edit these files and republish them to the canvas at the same paths (`project/<file>`).
