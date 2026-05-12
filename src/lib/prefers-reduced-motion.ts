/**
 * SSR-safe check for the user's reduced-motion preference.
 *
 * Returns `true` when the OS-level "Reduce motion" setting is on, so callers
 * can short-circuit decorative scroll-driven / cursor-driven animations.
 * Re-check on effect mount is enough — runtime toggling without page reload
 * is rare in practice and not worth a media-query subscription.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
