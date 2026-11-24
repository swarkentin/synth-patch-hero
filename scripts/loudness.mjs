// Measures every gig's demo song (reference patch, no level applied) and writes SONG_GAIN in js/data.js,
// so songs, notes and keys play at a similar loudness and bright sounds aren't piercing on phones.
// Usage: npm run loudness   (needs Chrome, like the tests)
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { launch } from '../tests/browser.mjs';
const root = new URL('..', import.meta.url).pathname;
const { page, close } = await launch();
try {
  await page.open(pathToFileURL(root + 'index.html').href, { width: 1280, height: 800 });
  await page.waitFor("document.querySelector('.gig')");
  const table = JSON.parse(await page.evaluate(`(async()=>{ const o={};
    for(const L of LEVELS){ const m=await songLoudness(await renderSong(targetPatch(L),L,true)); o[L.id]=Math.round(loudnessGainDb(m)*2)/2; }
    return JSON.stringify(o); })()`));
  const body = 'const SONG_GAIN={\n' + Object.entries(table).map(([k, v]) => `  ${JSON.stringify(k)}:${v},`).join('\n') + '\n};';
  const p = root + 'js/data.js', src = readFileSync(p, 'utf8');
  const out = src.replace(/(\/\* SONG_GAIN:start \*\/\n)[\s\S]*?(\n\/\* SONG_GAIN:end \*\/)/, `$1${body}$2`);
  if (out === src && !src.includes(body)) throw new Error('SONG_GAIN markers not found');
  writeFileSync(p, out);
  const v = Object.values(table).sort((a, b) => a - b);
  console.log(`SONG_GAIN: ${v.length} gigs, ${v[0]} to +${v[v.length - 1]} dB, median ${v[v.length >> 1]} dB`);
} finally { await close(); }
