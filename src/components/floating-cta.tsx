"use client";

import { useEffect, useState } from "react";

/**
 * Floating "Start a project" CTA — pinned to the bottom-centre of
 * the viewport across Hero / Selected / WhatWeDo / Process / Journal.
 *
 * Two scroll-driven states besides the static default:
 *
 *  - `morphing` — when the in-card Contact CTA is approaching (within
 *    ~half a viewport from below), the floating pill widens and
 *    drops its corner radius so by the time the Contact CTA is fully
 *    in view, both buttons sit at the same width / radius, and the
 *    hand-off looks like one button settling into place.
 *
 *  - `hidden`   — once the Contact CTA is more than half visible,
 *    fade the floater out so it doesn't double up.
 *
 * Opacity fade is 500 ms (≈ "пол секунды") so re-entry from the
 * Contact section back into Hero feels like the pill is just
 * proying through.
 */
export function FloatingCTA() {
  const [hidden, setHidden] = useState(true);
  const [morphing, setMorphing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-contact-cta]"),
    );
    if (targets.length === 0) {
      setHidden(false);
      return;
    }

    // Hide once the in-card Contact CTA is meaningfully in view.
    const hideObserver = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting);
        setHidden(anyVisible);
      },
      { threshold: 0.5 },
    );

    // Morph when the Contact CTA is within ~50% of the viewport
    // below — i.e. approaching from below as the user scrolls down,
    // or approaching from above as the user scrolls up out of footer.
    const morphObserver = new IntersectionObserver(
      (entries) => {
        const anyClose = entries.some((e) => e.isIntersecting);
        setMorphing(anyClose);
      },
      { rootMargin: "50% 0% 50% 0%", threshold: 0 },
    );

    targets.forEach((t) => {
      hideObserver.observe(t);
      morphObserver.observe(t);
    });
    setHidden(false);
    return () => {
      hideObserver.disconnect();
      morphObserver.disconnect();
    };
  }, []);

  // Width + radius set inline so they can transition smoothly between
  // the compact default and the wide Contact-matched morph state.
  const width = morphing ? "min(88vw, 600px)" : "min(70vw, 320px)";
  const radius = morphing ? "1.25rem" : "1.75rem";

  return (
    <a
      href="https://t.me/YuraShavrov"
      target="_blank"
      rel="noreferrer"
      data-floating-cta
      aria-hidden={hidden}
      style={{
        fontVariationSettings: '"wdth" 125, "wght" 800',
        // Exact CSS from the Bespalov CodePen reference — nothing
        // layered on top of the warp filter, low-opacity fill so the
        // backdrop reads clearly through the lens.
        // SVG warp + explicit blur. The SVG filter's internal
        // feGaussianBlur stdDeviation=0.02 (2% bbox) gets dropped by
        // Chromium when used as backdrop-filter, so we layer a real
        // CSS blur after the warp.
        backdropFilter: "url(#frosted) blur(10px)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        background: "rgba(255, 255, 255, 0.08)",
        border: "2px solid transparent",
        boxShadow:
          "0 0 0 2px rgba(255, 255, 255, 0.6), 0 16px 32px rgba(0, 0, 0, 0.12)",
        bottom: "clamp(1rem, 3vh, 2rem)",
        width,
        borderRadius: radius,
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition:
          "opacity 500ms ease, width 450ms cubic-bezier(0.65, 0, 0.35, 1), border-radius 450ms cubic-bezier(0.65, 0, 0.35, 1)",
      }}
      className="fixed left-1/2 -translate-x-1/2 z-40 text-center text-ink font-archivo text-body leading-[1.1] tracking-[-0.02em] whitespace-nowrap py-3"
    >
      Start a project →
    </a>
  );
}
