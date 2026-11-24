# CLAUDE.md

Synth Patch Hero: a synth-patching puzzle game that teaches synthesis. Repo: https://github.com/swarkentin/synth-patch-hero (`main` is the source of truth). The linked claude.ai project tracks design notes in `design/game-design-v0.1.md`, mirrored here as `docs/design.md`.

## Ground rules
- **No build step, no dependencies.** Plain HTML/CSS/JS loaded by `index.html` as classic scripts, in this order: `data → store → audio → analysis → ui-core → portrait → haptics → keys → ui → gear → help → selftest → main`. Top-level `const`/`function`s are shared across files, so keep names unique.
- **Run `npm test` before every commit.** It needs Node 22+ and Chrome. It covers scoring calibration bands, every gig opening cleanly at desktop (1280×800) and phone (390×664) sizes with OUTPUT in view, focus mode, every gig being solvable by its reference patch, Help rescuing every gig from an untouched rack, and the curriculum structure.
- **Don't loosen calibration bands to make a change pass.** If scoring changes on purpose, update the bands in `tests/run.mjs` and the numbers in `docs/design.md` in the same commit.
- In docs, copy and commit messages, describe the game on its own terms. Don't call it "X-style" or name-drop other games or studios.
- Park future ideas in `docs/ideas.md` (the roadmap bucket). When one is built, record the decision in `docs/design.md` and tick it in ideas.md.
- Keep `docs/design.md` current when a design decision changes. Regenerate the README screenshots with `npm run screenshots` after visible UI changes.

## Design constraints (from playtesting)
- The compare panel (▶ Target / ▶ Yours, match %, scope/loudness/spectrum) is always visible. Never put it behind tabs or scrolling.
- OUTPUT is always in the top-right slot and must be in view at the default fit.
- The on-screen keyboard stays hidden by default (puzzle mode first).
- Phones (iPhone 13 class, ~390px wide) are a first-class target: tap-to-patch, a tap-a-knob value sheet, pinch zoom. Mind `devicePixelRatio` when sizing canvases.
- Missing parts must be obvious: parts chips, pulsing empty slots, and a first hint naming the part.
- Help explains before it acts: it names the problem first, and only patches or locks when the player confirms. Locked knobs always explain why.
- Knobs must be precise on trackpads: wheel input follows scroll distance, and a click opens the fine editor.

## Routing and storage
- Screens have hash routes: `#/` (board), `#/gig/<id>`, `#/jam`. `openLevel`/`showBoard` push history; `popstate` applies the route. Keep Back inside the game.
- All saved data goes through `store` (`localStorage`, `sph.*` keys) and must stay local. If you add a new key, list it in Settings → Your data (`openDataSheet`) and in `docs/design.md`.

## Gig data (`js/data.js`)
`LEVELS[]` entries: `id, title, concept, client, role, unlock[], palette{type:max}, note, gate, dur, brief, manual (HTML), target{mods[], cables['a.out>b.in']}, reply`. Optional fields:
- `tol`: scoring tolerance.
- `slots`: board size.
- `start[]`: presets `{id?, type, slot, locked?, p?}`.
- `startCables[]`.
- `presetNote`.
- `seq`: `[[semitones, start, gate], …]` for multi-note targets.
- `studio:'ladder'`: use the 4-pole ladder low-pass (for squelchy, resonant gigs). Otherwise the 12 dB filter.

`GEAR{}` and `GEAR_GUIDES{gigId:{gearId:{steps[], words[], prewired[], note}}}` hold the "On your box" guides for real instruments (format in the comment above them). Use names from the maker's manual, give positions as rough fractions, and keep the not-affiliated line.

`CHAPTERS[]` entries: `id, title, short, blurb`, plus optional `level:'advanced'` (badge) or `bonus:true` (badge; exempt from the one-challenge-per-theme rule).

Slot `S.slots-1` is reserved for OUTPUT.

## Commits
Small, descriptive commits on `main` (or a branch + PR for larger changes). After pushing UI changes, republish the claude.ai artifact from these files: `index.html`, `favicon.svg`, `apple-touch-icon.png`, `css/style.css` and `js/*.js`, publishing each at the same path.
