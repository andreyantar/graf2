/**
 * rAF-sampled scroll progress for the ["start end", "end start"] window:
 *   0 = target's top edge sits at the scroller's bottom edge (entering)
 *   1 = target's bottom edge sits at the scroller's top edge (exiting)
 *
 * Why not motion's `useScroll().on("change")`? motion recomputes progress
 * only inside its scroll-event listener. Safari scrolls overflow
 * containers on a separate thread and delivers `scroll` events at a
 * throttled, irregular cadence, so JS animations bound to those events lag
 * the real scroll position and read as stepped/choppy (Chrome syncs tighter
 * → looks smooth). Here we read `getBoundingClientRect` on every animation
 * frame *while the scroller is moving*, so progress tracks the actual
 * position at the display's refresh rate regardless of event cadence.
 *
 * rAF is gated on scroll activity: a `scroll` (or `resize`) event starts
 * the loop, which keeps sampling each frame until the scroll position has
 * been stable for a few frames, then sleeps — so it never spins while the
 * page is idle.
 *
 * Geometry matches motion's offset math exactly, so swapping this in
 * doesn't shift any visuals:
 *   p = (cTop + cH − rect.top) / (cH + rect.height)   (clamped to [0,1])
 */
export function subscribeScrollProgress(
  target: HTMLElement,
  scroller: HTMLElement | null,
  onProgress: (p: number) => void,
): () => void {
  const measure = (): number => {
    const rect = target.getBoundingClientRect();
    let cTop: number;
    let cH: number;
    if (scroller) {
      cTop = scroller.getBoundingClientRect().top;
      cH = scroller.clientHeight;
    } else {
      cTop = 0;
      cH = window.innerHeight;
    }
    const total = cH + rect.height;
    if (total <= 0) return 0;
    const p = (cTop + cH - rect.top) / total;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  };

  const readPos = () => (scroller ? scroller.scrollTop : window.scrollY);

  let raf = 0;
  let running = false;
  let lastPos = NaN;
  let stableFrames = 0;

  const frame = () => {
    const pos = readPos();
    if (pos !== lastPos) {
      lastPos = pos;
      stableFrames = 0;
    } else {
      stableFrames += 1;
    }
    onProgress(measure());
    // Sleep once the scroller has been still for ~8 frames. Sampling
    // outlives the (Safari-throttled) scroll events so the loop runs at
    // full refresh rate for the whole gesture, not just on each event.
    if (stableFrames > 8) {
      running = false;
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastPos = NaN;
    stableFrames = 0;
    raf = requestAnimationFrame(frame);
  };

  // Prime once so the initial frame is correct before any scroll.
  onProgress(measure());

  const evtTarget: EventTarget = scroller ?? window;
  evtTarget.addEventListener("scroll", start, { passive: true });
  window.addEventListener("resize", start);

  return () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    evtTarget.removeEventListener("scroll", start);
    window.removeEventListener("resize", start);
  };
}
