/* Synth Patch Hero · Haptic feedback on touch devices. (iPhone notes below; see also docs/design.md.)
   Android and most browsers: navigator.vibrate. iPhone (Safari and Chrome, both WebKit) has no vibrate(), so on iOS 18+
   we toggle a hidden <input type="checkbox" switch>, which plays the system switch haptic. WebKit only does that right
   after a real tap/release (transient user activation): a finger sliding across a knob does not count, and neither do
   timers or async work. So on iOS we fire only while activation is live (one tick, no delayed pulses), and knobs give a
   tick on release instead of during the drag. Older iOS: silently does nothing. */
'use strict';
const Haptics = (() => {
  const touch = window.matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  const canVibrate = typeof navigator.vibrate === 'function';
  // iPhone playtest (2026-11-22): only a real finger tap on a switch ticks; switches flipped from code never do.
  // So on iOS every tap target carries an invisible switch under the finger, and code-triggered haptics are off.
  const iosMode = !canVibrate && touch;
  let enabled = store.get('haptics', true), last = 0;
  // pattern: vibrate() pattern (ms on/off). minGap: throttle so fast knob turns don't blur into one buzz.
  function fire(pattern, minGap = 30) {
    if (!enabled || !touch || !canVibrate) return;
    const t = performance.now(); if (t - last < minGap) return; last = t;
    try { navigator.vibrate(pattern); } catch (_) {}
  }
  const isOff = el => el.getAttribute('aria-disabled') === 'true';
  /* Give a <label> an invisible switch so the finger's tap toggles it natively (iOS ticks). Clicks that the label
     forwards to the switch are swallowed, so handlers on the label still run once per tap. */
  function addSwitch(el) {
    if (!iosMode || !el || el.tagName !== 'LABEL') return el;
    if (!el.querySelector(':scope > input.hapSw')) {
      const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.className = 'hapSw';
      i.tabIndex = -1; i.setAttribute('aria-hidden', 'true'); i.disabled = !enabled || isOff(el); el.appendChild(i);
    }
    if (!el.dataset.hapGuard) {
      el.dataset.hapGuard = '1';
      el.addEventListener('click', e => {
        if (e.target !== el && e.target.classList && e.target.classList.contains('hapSw')) { e.stopImmediatePropagation(); return; }
        if (isOff(el)) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
    }
    return el;
  }
  /* Swap a <button> for a <label role="button"> with the same id, classes and content (iOS only). Call it before
     attaching handlers. Keeps a .disabled property so existing code can still enable/disable it. */
  function upgrade(btn) {
    if (!iosMode || !btn || btn.tagName !== 'BUTTON') return btn;
    const l = document.createElement('label');
    for (const a of btn.attributes) if (a.name !== 'type' && a.name !== 'disabled') l.setAttribute(a.name, a.value);
    l.setAttribute('role', 'button'); l.innerHTML = btn.innerHTML;
    Object.defineProperty(l, 'disabled', {
      get() { return isOff(l); },
      set(v) { l.setAttribute('aria-disabled', v ? 'true' : 'false'); const i = l.querySelector(':scope > input.hapSw'); if (i) i.disabled = !!v || !enabled; },
    });
    l.disabled = btn.disabled;
    if (btn.parentNode) btn.replaceWith(l);
    return addSwitch(l);
  }
  return {
    available: touch,
    continuous: canVibrate,             // false on iPhone: ticks only on taps
    ios: iosMode,
    method: canVibrate ? 'vibration' : iosMode ? 'iPhone: a switch under your finger' : 'none',
    get enabled() { return enabled; },
    set(on) { enabled = on; store.set('haptics', on);
      document.querySelectorAll('input.hapSw').forEach(i => { i.disabled = !on || isOff(i.parentElement); }); },
    addSwitch, upgrade,
    /* iOS flips the switch only after the tap's click handlers finish. If a handler rebuilds the tapped element, the
       switch is gone before it can flip and there's no tick. later() runs such work a moment after the tap instead. */
    later(fn) { if (iosMode) setTimeout(fn, 0); else fn(); },
    /* A new tap target: <label role="button"> that runs fn on tap (and ticks on iPhone or buzzes on Android). */
    tapTarget(html, cls, fn) {
      const l = document.createElement('label'); l.className = cls; l.setAttribute('role', 'button'); l.innerHTML = html;
      addSwitch(l);
      l.addEventListener('click', e => { if (canVibrate) fire(10, 0); Haptics.later(() => fn(e)); });
      return l;
    },
    test() { const was = last; last = 0; fire([30], 0); if (!last) last = was; },
    detent: () => fire(9, 35),          // knob passes a step / notch
    release: () => fire(12, 0),         // finger lifts off a knob after turning it
    edge: () => fire(22, 40),           // knob hits its end stop
    select: () => fire(12, 50),         // choice button, jack picked
    plug: () => fire([16], 60),         // cable plugged in
    unplug: () => fire([8, 40, 8], 60), // cable pulled out
    thunk: () => fire([12, 50, 20], 80),// module added / moved / removed
    key: () => fire(6, 15),             // on-screen keyboard key
    success: () => fire([25, 70, 25, 70, 60], 0),
  };
})();
