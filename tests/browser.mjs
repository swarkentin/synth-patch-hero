// Minimal headless-Chrome driver over the DevTools protocol. No dependencies (Node 22+).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [process.env.CHROME_PATH, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'sph-chrome-'));
  const bin = CANDIDATES.find(c => c.includes('/') ? existsSync(c) : true);
  // Port 0 lets Chrome pick a free port; it writes the choice to DevToolsActivePort in the profile.
  const proc = spawn(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio',
    '--remote-debugging-port=0', '--enable-logging=stderr', '--v=0', `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = ''; proc.stderr.on('data', d => { stderr = (stderr + d).slice(-4000); });
  let exited = null; proc.on('exit', code => { exited = code; });
  let targets, port;
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 300 && !targets && exited == null; i++) {
    try {
      if (!port && existsSync(portFile)) port = +readFileSync(portFile, 'utf8').split('\n')[0];
      if (port) targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {}
    if (!targets) await sleep(100);
  }
  if (!targets) { proc.kill(); throw new Error(`Could not start Chrome (${bin}${exited != null ? ', exit ' + exited : ''}). Set CHROME_PATH.\n${stderr}`); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0, crashed = false; const pending = new Map(); let errors = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    // A crashed page never answers: fail every pending call instead of hanging the run.
    if (d.method === 'Inspector.targetCrashed') { crashed = true; for (const [, r] of pending) r({ crashed: true }); pending.clear(); }
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Inspector.enable');

  const page = {
    // Each step gets a time limit, so a stuck page fails the run with the step's first line instead of hanging forever.
    async evaluate(expr, timeout = 480000) {
      if (crashed) throw new Error('The page crashed earlier in the run.');
      let timer; const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
        new Promise(res => { timer = setTimeout(() => res({ timedOut: true }), timeout); })]); clearTimeout(timer);
      const head = expr.replace(/\s+/g, ' ').slice(0, 140);
      if (r.crashed) throw new Error('The page crashed during: ' + head + '\nChrome said: ' + stderr.slice(-1500));
      if (r.timedOut) throw new Error(`Step took over ${timeout / 1000}s: ` + head);
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
    // Run src before any page script on every navigation (e.g. to mimic a browser without navigator.vibrate).
    async addInitScript(src) { await send('Page.addScriptToEvaluateOnNewDocument', { source: src }); },
    // A real touch tap through Chrome's input pipeline, so the page gets genuine user activation.
    async tap(x, y) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    },
    async screenshot() { const r = await send('Page.captureScreenshot', { format: 'png' }); return Buffer.from(r.result.data, 'base64'); },
    cdp: send,
    errors: () => errors.slice(),
  };
  return { page, async close() { try { ws.close(); } catch {} proc.kill(); await sleep(100); rmSync(profile, { recursive: true, force: true }); } };
}
