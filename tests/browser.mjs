// Minimal headless-Chrome driver over the DevTools protocol. No dependencies (Node 22+).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [process.env.CHROME_PATH, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch() {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), 'sph-chrome-'));
  const bin = CANDIDATES.find(c => c.includes('/') ? existsSync(c) : true);
  const proc = spawn(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 100 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(150); }
  }
  if (!targets) throw new Error(`Could not start Chrome (${bin}). Set CHROME_PATH.`);
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); let errors = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');

  const page = {
    async evaluate(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
      return r.result?.result?.value;
    },
    async open(url, { width = 1280, height = 800, mobile = false } = {}) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 3 : 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
      errors = [];
      await send('Page.navigate', { url });
      await page.waitFor("document.readyState==='complete'");
    },
    async waitFor(expr, timeout = 60000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) { try { const v = await page.evaluate(expr); if (v) return v; } catch {} await sleep(100); }
      throw new Error('Timed out waiting for: ' + expr);
    },
    async screenshot() { const r = await send('Page.captureScreenshot', { format: 'png' }); return Buffer.from(r.result.data, 'base64'); },
    errors: () => errors.slice(),
  };
  return { page, async close() { try { ws.close(); } catch {} proc.kill(); await sleep(100); rmSync(profile, { recursive: true, force: true }); } };
}
