"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import manifest from "@/data/artworks.json";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

const ART_URLS: string[] = (manifest as Array<{ url: string }>).map(
  (m) => m.url,
);

const HERO_INDICES = [7, 18, 33, 44, 51, 62, 88, 112, 145, 178];
const HERO_IMAGES_SOURCE = HERO_INDICES.map((i) => ART_URLS[i]).filter(Boolean);

const PERSPECTIVE_PX = 900;
const ARC_GAP_PX = 16; // 1rem fixed gap between cards on the cylinder surface
const CARD_ASPECT = 240 / 180; // height / width

// Tier-based responsive params. Smaller viewports get fewer cards on
// the ring — bigger angular step per card → the cylinder curvature
// reads visibly on narrow screens instead of collapsing into a flat
// row of 2-3 cards.
//
// R is computed from the viewport so the cylinder rim always sits at
// ~96% of the half-viewport (no awkward empty margins on the sides).
// cardW is then derived from R + N + gap so the on-cylinder arc
// length between neighbours stays exactly CARD_W + ARC_GAP_PX.
//
// durationSec is the full-revolution time. It's tier-specific because
// the visual horizontal velocity of a card on screen scales with R —
// keeping the same N·k formula made the narrow-viewport cylinder feel
// almost frozen. Hand-picked durations restore a consistent perceived
// scroll speed across devices.
const TIERS = [
  { maxW: 640, N: 8, durationSec: 10, cardWMin: 110 }, // mobile: 4 visible front
  { maxW: 1024, N: 12, durationSec: 16, cardWMin: 140 }, // tablet: 6 visible front
  { maxW: Infinity, N: 18, durationSec: 39, cardWMin: 160 }, // desktop: 9 visible front
] as const;

type Tier = (typeof TIERS)[number];

type RingParams = {
  R: number;
  cardW: number;
  cardH: number;
  N: number;
  angleStepDeg: number;
  durationSec: number;
};

const R_VIEWPORT_FACTOR = 0.48; // rim sits at ±48% of viewport width

function computeRingParams(viewportW: number): RingParams {
  const tier: Tier =
    TIERS.find((t) => viewportW <= t.maxW) ?? TIERS[TIERS.length - 1];
  const N = tier.N;
  const stepRad = (2 * Math.PI) / N;
  const R = Math.max(viewportW * R_VIEWPORT_FACTOR, 180);
  // Derive cardW so the arc-length gap equals ARC_GAP_PX regardless
  // of viewport. Cap to a sane minimum so cards never become tiny.
  const cardW = Math.max(tier.cardWMin, R * stepRad - ARC_GAP_PX);
  const cardH = cardW * CARD_ASPECT;
  return {
    R,
    cardW,
    cardH,
    N,
    angleStepDeg: 360 / N,
    durationSec: tier.durationSec,
  };
}

export function HeroGallery() {
  const ringRef = useRef<HTMLDivElement>(null);
  // Initialise with a sensible mid-size guess; recompute on mount and
  // every resize. N changes across tiers → image array regenerates.
  const [{ R, cardW, cardH, N, angleStepDeg, durationSec }, setParams] =
    useState<RingParams>(() => computeRingParams(1280));

  useEffect(() => {
    const apply = () => setParams(computeRingParams(window.innerWidth));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (prefersReducedMotion()) return;
    // Plain continuous rotation. Earlier iterations paused/resumed
    // the tween via IntersectionObserver to relieve the Chromium
    // compositor, but the pause/resume + wall-clock re-sync each
    // produced a tiny visible snap on the moment the hero re-entered
    // view, which the client read as jitter. Let GSAP just run.
    const tween = gsap.to(ring, {
      rotateY: 360,
      duration: durationSec,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [N, durationSec]);

  const heroRing = Array.from(
    { length: N },
    (_, i) => HERO_IMAGES_SOURCE[i % HERO_IMAGES_SOURCE.length],
  );

  // DIAGNOSTIC: toggle to false to render the page without the
  // cylindrical gallery, isolating whether the client-reported
  // freeze comes from the gallery's compositing cost.
  const RENDER_GALLERY = false;

  return (
    <div
      className="relative w-full flex flex-col items-center"
      style={{ minHeight: "100svh" }}
    >
      {/* Title is pushed down ~30vh from the top of the hero. The gap
          to the gallery below is a fixed 5vh on every viewport so the
          composition reads the same on mobile, tablet, and desktop —
          even though the wrapped title height varies between tiers. */}
      <h1
        className="text-center px-6 font-heavy text-card-title tracking-[-0.02em] leading-[1.1]"
        style={{
          marginTop: "40vh",
          width: "min(720px, 100vw)",
        }}
      >
        A small independent studio. We design brands, interfaces, and the
        edges in between.
      </h1>

      {RENDER_GALLERY && (
      <div
        className="relative w-screen"
        style={{
          marginTop: "-10vh",
          height: cardH + 120,
          perspective: `${PERSPECTIVE_PX}px`,
          perspectiveOrigin: "50% 50%",
        }}
        aria-hidden
      >
        <div
          ref={ringRef}
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            // Safari sometimes drops the 3D context (cards bunch at
            // the rim, centre empty) without the explicit WebKit
            // prefix on preserve-3d. willChange already promotes the
            // ring to its own compositing layer — don't write a fixed
            // transform here, GSAP owns ring.style.transform.
            WebkitTransformStyle: "preserve-3d",
            willChange: "transform",
          } as React.CSSProperties}
        >
          {heroRing.map((src, i) => (
            <div
              key={i}
              className="absolute overflow-hidden rounded-[14px] bg-paper"
              style={{
                width: cardW,
                height: cardH,
                left: -cardW / 2,
                top: -cardH / 2,
                transform: `rotateY(${i * angleStepDeg}deg) translateZ(${-R}px)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform",
              } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                className="block w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
