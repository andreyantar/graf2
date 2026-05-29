"use client";

import { useEffect, useRef } from "react";

/**
 * Single-instance sticky CTA — there's no separate in-card Contact
 * button. The Contact card renders a placeholder `[data-cta-slot]`
 * div with the size + position the button would occupy, and this
 * floating button continuously tracks that slot's viewport-rect.
 *
 * Three logical states driven by the slot's distance from the
 * sticky line at the viewport bottom:
 *
 *   Slot far below viewport bottom  → button stays at sticky bottom
 *                                     (narrow pill)
 *   Slot inside the morph window    → button widens / squares its
 *                                     corners to match the slot's
 *                                     shape, ready to dock
 *   Slot at or above sticky line    → button follows the slot's top
 *                                     pixel-for-pixel (= scrolls with
 *                                     the contact card)
 *
 * Implementation uses a continuous requestAnimationFrame loop with
 * direct DOM writes (no React state for top / width / radius). This:
 *   1. catches GSAP-driven stage transforms (menu open shrinks the
 *      stage; slot rect changes without firing scroll events), so
 *      the button stays glued to the slot even mid-tween;
 *   2. avoids React re-renders at 60 fps;
 *   3. eliminates jitter from CSS transitions overlapping each other
 *      during fast scrolls — values snap each frame.
 *
 * The width / radius morph is driven continuously by the slot's
 * distance from the sticky line (not a binary threshold + CSS
 * transition), so it tracks the scroll exactly, eases smoothly, and
 * can't flip-flop / "breathe" when the user lingers near a boundary.
 */

const BOTTOM_OFFSET_PX = 32; // 2rem default gap from viewport bottom
const BUTTON_HEIGHT_PX = 56; // matches the py-4 + text height
const MORPH_RANGE_PX = 220; // distance over which the pill morphs into the slot shape

const STICKY_WIDTH = "min(70vw, 320px)";
const STICKY_RADIUS = "1.75rem";
const SLOT_RADIUS = "1.25rem";
// Numeric forms of the radii for the per-frame interpolation.
const STICKY_RADIUS_REM = 1.75;
const SLOT_RADIUS_REM = 1.25;

type Mode = "sticky" | "morphing" | "settled";

export function FloatingCTA() {
  const anchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const anchor = anchorRef.current;
    if (!anchor) return;

    // Root font size for the rem→px radius interpolation below.
    const rootPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    let raf = 0;
    let mounted = true;
    let mode: Mode = "sticky";
    let lastTop = -1;
    let lastWidth = "";
    let lastRadius = "";
    // Visibility handoff between the floating pill and the in-flow dock
    // button. Tracked so we only touch the DOM when state flips.
    let pillVisible = true;
    let visibleSlot: HTMLElement | null = null;

    const setElVisible = (el: HTMLElement, visible: boolean) => {
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
      el.setAttribute("aria-hidden", visible ? "false" : "true");
    };

    const setPillVisible = (visible: boolean) => {
      if (visible === pillVisible) return;
      setElVisible(anchor, visible);
      pillVisible = visible;
    };

    // Reveal `slot` (the active dock button) and hide whichever slot was
    // shown before. Pass null to hide all and restore the floating pill.
    const dockTo = (slot: HTMLElement | null) => {
      if (slot === visibleSlot) return;
      if (visibleSlot) setElVisible(visibleSlot, false);
      if (slot) setElVisible(slot, true);
      visibleSlot = slot;
    };

    const setStyle = (
      top: number,
      width: string,
      radius: string,
    ) => {
      if (top !== lastTop) {
        anchor.style.top = `${top}px`;
        lastTop = top;
      }
      if (width !== lastWidth) {
        anchor.style.width = width;
        lastWidth = width;
      }
      if (radius !== lastRadius) {
        anchor.style.borderRadius = radius;
        lastRadius = radius;
      }
    };

    const tick = () => {
      if (!mounted) return;

      const viewportH = window.innerHeight;
      const stickyTop = viewportH - BOTTOM_OFFSET_PX - BUTTON_HEIGHT_PX;

      const slots = document.querySelectorAll<HTMLElement>("[data-cta-slot]");

      // Among the 3 looped copies, pick the slot that is closest to —
      // but still below or equal to — the sticky line. This keeps the
      // selection stable as the user scrolls; the previously-active
      // slot only loses its turn once it scrolls past sticky and the
      // next copy crosses into range.
      // NOTE on width: the floating button lives inside the stage,
      // which GSAP scales down when the side menu opens. The slot is
      // also inside the stage. `rect.width` is the post-transform
      // width — if we wrote it onto the button, the transform would
      // apply *again* and the button would shrink by scale². So we
      // read `offsetWidth` (logical, pre-transform) for the width
      // we write. `rect.top` is used only to *compare* slots in
      // viewport space, not to write — that comparison is consistent
      // because all slots share the same transform.
      let activeTop: number | null = null;
      let activeWidth = 0;
      let activeSlot: HTMLElement | null = null;
      slots.forEach((slot) => {
        const rect = slot.getBoundingClientRect();
        if (rect.top < -BUTTON_HEIGHT_PX - 800) return;
        if (rect.top > viewportH + 800) return;
        if (rect.top >= stickyTop) {
          if (activeTop === null || rect.top < activeTop) {
            activeTop = rect.top;
            activeWidth = slot.offsetWidth;
            activeSlot = slot;
          }
        }
      });
      // Fallback: if no slot is below sticky, take the highest one
      // that's still on screen (== the just-scrolled-past slot whose
      // settled mode is still relevant for one more frame).
      if (activeTop === null) {
        slots.forEach((slot) => {
          const rect = slot.getBoundingClientRect();
          if (rect.top < -BUTTON_HEIGHT_PX - 800) return;
          if (rect.top > viewportH + 800) return;
          if (activeTop === null || rect.top > activeTop) {
            activeTop = rect.top;
            activeWidth = slot.offsetWidth;
            activeSlot = slot;
          }
        });
      }

      if (activeTop === null) {
        setStyle(stickyTop, STICKY_WIDTH, STICKY_RADIUS);
        mode = "sticky";
      } else {
        const diff = activeTop - stickyTop;
        const slotWidthPx = `${Math.round(activeWidth)}px`;

        if (diff > 0) {
          // Slot still below sticky line — pin to sticky and morph
          // continuously toward the slot shape as it approaches.
          // t: 0 (far, full pill) → 1 (at the sticky line, slot shape),
          // smoothstepped. Computed per frame (no CSS transition) so the
          // morph is a pure function of scroll position and can't
          // oscillate near a threshold the way a width transition did.
          const tRaw = Math.min(1, 1 - diff / MORPH_RANGE_PX);
          if (tRaw <= 0) {
            setStyle(stickyTop, STICKY_WIDTH, STICKY_RADIUS);
            mode = "sticky";
          } else {
            const t = tRaw * tRaw * (3 - 2 * tRaw); // smoothstep
            const stickyW = Math.min(0.7 * window.innerWidth, 320);
            const w = Math.round(stickyW + (activeWidth - stickyW) * t);
            const r =
              (STICKY_RADIUS_REM +
                (SLOT_RADIUS_REM - STICKY_RADIUS_REM) * t) *
              rootPx;
            setStyle(stickyTop, `${w}px`, `${r}px`);
            mode = "morphing";
          }
        } else {
          // Slot at or above sticky: hand off to the real in-flow dock
          // button. It rides the page natively (compositor-driven), so
          // it can't jitter — unlike a `fixed` element whose top we'd
          // rewrite every frame from a scroll-lagged rect read. We keep
          // the (now hidden) pill tracking the slot so it's co-located
          // for a seamless swap back when the user scrolls up.
          setStyle(activeTop, slotWidthPx, SLOT_RADIUS);
          mode = "settled";
        }
      }

      // Reconcile which element is visible. Settled → the in-flow dock
      // button takes over and the floating pill hides; otherwise the
      // pill is the CTA and no dock button shows.
      if (mode === "settled") {
        setPillVisible(false);
        dockTo(activeSlot);
      } else {
        dockTo(null);
        setPillVisible(true);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <a
      ref={anchorRef}
      href="https://t.me/YuraShavrov"
      target="_blank"
      rel="noreferrer"
      data-floating-cta
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        height: `${BUTTON_HEIGHT_PX}px`,
        overflow: "hidden",
        // Initial sane values so the button isn't visible at (0,0)
        // before the first RAF tick lands.
        top: "-100vh",
        width: STICKY_WIDTH,
        borderRadius: STICKY_RADIUS,
      }}
      className="z-40 flex items-center justify-center whitespace-nowrap"
    >
      <span
        aria-hidden
        className="contact-orb-bg"
        style={{ borderRadius: "inherit" }}
      >
        <span className="contact-orb-bg__disc contact-orb-bg__disc--green" />
        <span className="contact-orb-bg__disc contact-orb-bg__disc--blue" />
      </span>
      <span
        style={{
          fontVariationSettings: '"wdth" 125, "wght" 800',
          color: "#ffffff",
        }}
        className="relative font-archivo text-body leading-[1.1] tracking-[-0.02em]"
      >
        Start a project →
      </span>
    </a>
  );
}
