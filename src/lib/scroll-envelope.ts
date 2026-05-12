/**
 * Smoothstep envelope around the middle of a [0, 1] progress range.
 *
 * Returns 0 while `p` is within ±deadHalf of 0.5 (the "dead zone"), then
 * ramps smoothly to 1 as `p` approaches 0 or 1. Used by CaseCard / ServiceCard
 * to drive scroll-driven transforms and corner-radius animations: cards stay
 * still in the middle of the viewport and only deform near the edges.
 *
 * @param p        Scroll progress (0..1). Treated as 0 outside that range.
 * @param deadHalf Half-width of the dead zone, in progress units.
 *                 e.g. 0.3 → dead zone covers [0.2, 0.8].
 */
export function envelope(p: number, deadHalf: number): number {
  const d = Math.abs(p - 0.5);
  const t = Math.max(0, Math.min(1, (d - deadHalf) / (0.5 - deadHalf)));
  return t * t * (3 - 2 * t); // smoothstep
}
