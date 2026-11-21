// npm run screenshots: regenerate the README images in docs/screenshots/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../tests/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = pathToFileURL(join(ROOT, 'index.html')).href;
const OUT = join(ROOT, 'docs', 'screenshots'); mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Gig 9 (Wow Bass), mid-solve: the filter is in, its envelope is not yet patched.
const SETUP = `(async()=>{ progress.unlockAll=true; LEVELS.forEach(L=>store.del('draft2.'+L.id)); openLevel(LEVELS.findIndex(l=>l.id==='wow-bass')); closeSide();
  S.patch.cables=S.patch.cables.filter(c=>!(c.from.m==='p1'&&c.to.m==='p2'));
  addModule('filter',1); const f=S.patch.modules.find(m=>m.type==='filter');
  S.patch.cables.push({from:{m:'p1',p:'out'},to:{m:f.id,p:'in'}},{from:{m:f.id,p:'out'},to:{m:'p2',p:'in'}});
  Object.assign(f.params,{cutoff:300,res:0.5}); renderRack(); scheduleAnalyze(); await new Promise(r=>setTimeout(r,900)); return 1; })()`;

const { page, close } = await launch();
try {
  await page.open(URL, { width: 1440, height: 860 }); await page.waitFor("document.querySelector('.gig')");
  writeFileSync(join(OUT, 'board.png'), await page.screenshot());
  await page.evaluate(SETUP); await sleep(300);
  writeFileSync(join(OUT, 'desktop.png'), await page.screenshot());
  await page.open(URL, { width: 390, height: 760, mobile: true }); await page.waitFor("document.querySelector('.gig')");
  await page.evaluate(SETUP); await sleep(300);
  writeFileSync(join(OUT, 'phone.png'), await page.screenshot());
  console.log('Wrote docs/screenshots/{board,desktop,phone}.png');
} finally { await close(); }
