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
 * Hysteresis on the morph threshold (50 px buffer between enter /
 * exit) keeps the width / radius from flipping back and forth when
 * the slot oscillates around the boundary.
 */

const BOTTOM_OFFSET_PX = 32; // 2rem default gap from viewport bottom
const BUTTON_HEIGHT_PX = 56; // matches the py-4 + text height
const MORPH_ENTER_PX = 200; // slot must be within 200px of sticky to enter morph
const MORPH_EXIT_PX = 250; // and outside 250px to exit (hysteresis)

const STICKY_WIDTH = "min(70vw, 320px)";
const STICKY_RADIUS = "1.75rem";
const SLOT_RADIUS = "1.25rem";

type Mode = "sticky" | "morphing" | "settled";

export function FloatingCTA() {
  const anchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const anchor = anchorRef.current;
    if (!anchor) return;

    let raf = 0;
    let mounted = true;
    let mode: Mode = "sticky";
    let lastTop = -1;
    let lastWidth = "";
    let lastRadius = "";

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
      let activeTop: number | null = null;
      let activeWidth = 0;
      slots.forEach((slot) => {
        const rect = slot.getBoundingClientRect();
        if (rect.top < -BUTTON_HEIGHT_PX - 800) return;
        if (rect.top > viewportH + 800) return;
        if (rect.top >= stickyTop) {
          if (activeTop === null || rect.top < activeTop) {
            activeTop = rect.top;
            activeWidth = rect.width;
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
            activeWidth = rect.width;
          }
        });
      }

      if (activeTop === null) {
        setStyle(stickyTop, STICKY_WIDTH, STICKY_RADIUS);
        mode = "sticky";
      } else {
        const diff = activeTop - stickyTop;
        const slotWidthPx = `${Math.round(activeWidth)}px`;

        // Hysteresis on width/radius mode: enter morph when diff
        // crosses 200, exit when diff crosses 250 going the other way.
        const wantMorph =
          mode === "sticky" ? diff <= MORPH_ENTER_PX : diff <= MORPH_EXIT_PX;

        if (diff > 0) {
          // Slot still below sticky line — pin to sticky, optionally morph.
          const targetWidth = wantMorph ? slotWidthPx : STICKY_WIDTH;
          const targetRadius = wantMorph ? SLOT_RADIUS : STICKY_RADIUS;
          setStyle(stickyTop, targetWidth, targetRadius);
          mode = wantMorph ? "morphing" : "sticky";
        } else {
          // Slot at or above sticky — follow the slot 1-to-1, matching
          // its exact pixel width so the button sits flush inside the
          // card with no horizontal gap.
          setStyle(activeTop, slotWidthPx, SLOT_RADIUS);
          mode = "settled";
        }
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
