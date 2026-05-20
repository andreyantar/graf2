"use client";

import { useEffect, useState } from "react";

/**
 * Single-instance sticky CTA — there's no separate in-card Contact
 * button any more. Instead the Contact card renders a placeholder
 * `[data-cta-slot]` div with the size + position the button would
 * occupy, and this floating button tracks that slot's viewport-rect.
 *
 *   Slot far below viewport bottom  → button stays at sticky bottom
 *   Slot approaching sticky line    → button morphs (width / radius)
 *                                     to match the slot's natural
 *                                     shape, ready to settle in
 *   Slot at / above sticky line     → button follows the slot's top
 *                                     pixel-for-pixel (= scrolls with
 *                                     the contact card as one unit)
 *
 * Net effect: single visual button that floats at the viewport
 * bottom across Hero / Selected / WhatWeDo / Process / Journal, then
 * docks into the Contact card's slot and rides up out of frame with
 * the rest of the section. No double-up.
 */

const BOTTOM_OFFSET_PX = 32;     // 2rem default gap from viewport bottom
const BUTTON_HEIGHT_PX = 56;     // matches the px-6 py-4 + text height
const TRANSITION_RANGE_PX = 200; // morph window: slot 200px below sticky → fully morphed

const STICKY_WIDTH = "min(70vw, 320px)";
const STICKY_RADIUS = "1.75rem";
const SLOT_WIDTH = "min(88vw, 600px)";
const SLOT_RADIUS = "1.25rem";

export function FloatingCTA() {
  const [topPx, setTopPx] = useState<number | null>(null);
  const [morph, setMorph] = useState(0); // 0 = sticky default, 1 = settled

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;

    const update = () => {
      const slots = Array.from(
        document.querySelectorAll<HTMLElement>("[data-cta-slot]"),
      );
      const viewportH = window.innerHeight;
      const stickyTop = viewportH - BOTTOM_OFFSET_PX - BUTTON_HEIGHT_PX;

      if (slots.length === 0) {
        setTopPx(stickyTop);
        setMorph(0);
        return;
      }

      // Pick the slot whose top is closest to the sticky line, but
      // only among slots that are within tracking distance of the
      // viewport (the looped scroll renders three copies, only one
      // is ever within ~one viewport of the user at a time).
      let activeTop: number | null = null;
      for (const slot of slots) {
        const top = slot.getBoundingClientRect().top;
        if (top > viewportH + 400) continue; // far below
        if (top < -BUTTON_HEIGHT_PX - 400) continue; // far above
        if (
          activeTop === null ||
          Math.abs(top - stickyTop) < Math.abs(activeTop - stickyTop)
        ) {
          activeTop = top;
        }
      }

      if (activeTop === null) {
        setTopPx(stickyTop);
        setMorph(0);
        return;
      }

      const diff = activeTop - stickyTop;
      if (diff > TRANSITION_RANGE_PX) {
        // Slot still well below sticky line — stay sticky.
        setTopPx(stickyTop);
        setMorph(0);
      } else if (diff > 0) {
        // Slot inside the morph window — interpolate position +
        // morph progress. Button visually sits at sticky line and
        // grows/rounds toward the slot's shape.
        const t = 1 - diff / TRANSITION_RANGE_PX;
        setTopPx(stickyTop);
        setMorph(t);
      } else {
        // Slot is at or above the sticky line — button follows the
        // slot's actual position (= scrolls with the page).
        setTopPx(activeTop);
        setMorph(1);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();

    const scrollContainers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-container]"),
    );
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    scrollContainers.forEach((el) => {
      el.addEventListener("scroll", schedule, { passive: true });
    });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scrollContainers.forEach((el) => {
        el.removeEventListener("scroll", schedule);
      });
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (topPx === null) return null;

  const width = morph >= 0.99 ? SLOT_WIDTH : STICKY_WIDTH;
  const radius = morph >= 0.5 ? SLOT_RADIUS : STICKY_RADIUS;

  return (
    <a
      href="https://t.me/YuraShavrov"
      target="_blank"
      rel="noreferrer"
      data-floating-cta
      style={{
        position: "fixed",
        top: `${topPx}px`,
        left: "50%",
        transform: "translateX(-50%)",
        width,
        height: `${BUTTON_HEIGHT_PX}px`,
        borderRadius: radius,
        overflow: "hidden",
        transition:
          "width 450ms cubic-bezier(0.65, 0, 0.35, 1), border-radius 450ms cubic-bezier(0.65, 0, 0.35, 1)",
      }}
      className="z-40 flex items-center justify-center whitespace-nowrap"
    >
      {/* Animated colour-disc background — same as before. */}
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
