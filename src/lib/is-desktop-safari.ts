/**
 * True only for *desktop* Safari (macOS) — NOT iOS/iPadOS.
 *
 * Empirically the stepped/choppy stage-zoom on menu open happens only on
 * desktop Safari: it re-rasterizes the heavy stage layer (WebGL hero + goo
 * SVG filter) every frame while it scales. iOS WebKit composites the same
 * animation smoothly (verified down to an iPhone X), so we keep the full
 * zoom there. Chromium (Chrome/Edge/Opera) and Firefox return false too.
 *
 * Detection: WebKit-not-Chromium, then exclude touch/iOS. iOS UAs carry
 * "Mobile"/iPhone/iPad; iPadOS in desktop mode reports "Macintosh" but,
 * unlike a real Mac, exposes touch points — so we also bail on
 * maxTouchPoints.
 */
export function isDesktopSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const webkitNonChromium =
    /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
  if (!webkitNonChromium) return false;
  const isMobileOrIOS =
    /iPhone|iPad|iPod|Mobile/.test(ua) || navigator.maxTouchPoints > 1;
  return !isMobileOrIOS;
}
