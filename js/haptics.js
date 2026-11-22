/* Synth Patch Hero · Haptic feedback on touch devices.
   Android and most browsers: navigator.vibrate. iPhone (Safari and Chrome, both WebKit) has no vibrate(), so on iOS 18+
   we toggle a hidden <input type="checkbox" switch>, which plays the system switch haptic. WebKit only does that right
   after a real tap/release (transient user activation): a finger sliding across a knob does not count, and neither do
   timers or async work. So on iOS we fire only while activation is live (one tick, no delayed pulses), and knobs give a
   tick on release instead of during the drag. Older iOS: silently does nothing. */
'use strict';
const Haptics = (() => {
  const touch = window.matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  const canVibrate = typeof navigator.vibrate === 'function';
  let enabled = store.get('haptics', true), last = 0, sw = null;
  function iosTick() {
    if (!sw) {
      sw = document.createElement('label'); sw.setAttribute('aria-hidden', 'true');
      sw.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
      sw.appendChild(i); document.body.appendChild(sw);
    }
    try { sw.click(); } catch (_) {}
  }
  const gestureLive = () => { const ua = navigator.userActivation; return !ua || ua.isActive; };
  // pattern: vibrate() pattern (ms on/off). minGap: throttle so fast knob turns don't blur into one buzz.
  function fire(pattern, minGap = 30) {
    if (!enabled || !touch) return;
    if (!canVibrate && !gestureLive()) return;      // iOS would ignore it anyway
    const t = performance.now(); if (t - last < minGap) return; last = t;
    if (canVibrate) { try { navigator.vibrate(pattern); } catch (_) {} return; }
    iosTick();
  }
  return {
    available: touch,
    continuous: canVibrate,             // false on iPhone: no ticks while a finger slides, only on taps/releases
    get enabled() { return enabled; },
    set(on) { enabled = on; store.set('haptics', on); },
    detent: () => fire(9, 35),          // knob passes a step / notch
    release: () => fire(12, 0),         // finger lifts off a knob after turning it (the iPhone-friendly knob tick)
    edge: () => fire(22, 40),           // knob hits its end stop
    select: () => fire(12, 50),         // choice button, jack picked
    plug: () => fire([16], 60),         // cable plugged in
    unplug: () => fire([8, 40, 8], 60), // cable pulled out
    thunk: () => fire([12, 50, 20], 80),// module added / moved / removed
    key: () => fire(6, 15),             // on-screen keyboard key
    success: () => fire([25, 70, 25, 70, 60], 0),
  };
})();
