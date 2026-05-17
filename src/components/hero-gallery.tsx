"use client";

import { useEffect, useRef, useState } from "react";
import manifest from "@/data/artworks.json";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { SiteLogo } from "@/components/site-logo";

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
  const [{ R, cardW, cardH, N, angleStepDeg, durationSec }, setParams] =
    useState<RingParams>(() => computeRingParams(1280));
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = () => setParams(computeRingParams(window.innerWidth));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // WAAPI continuous rotation. Lives on the compositor thread — no
  // main-thread work per frame, no motion subscription, no scroll
  // coupling. Pauses when the gallery leaves the viewport so it's not
  // burning GPU cycles while the user is reading other sections.
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (prefersReducedMotion()) return;

    const anim = ring.animate(
      [
        { transform: "translate(-50%, -50%) rotateY(0deg)" },
        { transform: "translate(-50%, -50%) rotateY(360deg)" },
      ],
      {
        duration: durationSec * 1000,
        iterations: Infinity,
        easing: "linear",
      },
    );

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) anim.play();
          else anim.pause();
        }
      },
      { threshold: 0 },
    );
    io.observe(ring);

    return () => {
      io.disconnect();
      anim.cancel();
    };
  }, [durationSec]);

  const heroRing = Array.from(
    { length: N },
    (_, i) => HERO_IMAGES_SOURCE[i % HERO_IMAGES_SOURCE.length],
  );

  return (
    <div
      className="relative w-full flex flex-col items-center"
      style={{ minHeight: "100svh" }}
    >
      {/* Logo badge — wordmark + icon in a soft pill, sits above the
          tagline. Padding values are vw so the pill scales with the
          viewport; the SVG inside uses currentColor and rem-based
          height so the type stays legible on small screens. */}
      <div
        className="inline-flex items-center bg-[var(--frame)] rounded-full text-[var(--color-ink)]"
        style={{
          marginTop: "30vh",
          // Pin a floor (figma px values @ ~1600vw) so the pill
          // doesn't collapse to invisible padding on narrow viewports.
          // Above ~1600px the vw values take over and the pill scales
          // proportionally.
          paddingTop: "max(0.31vw, 5px)",
          paddingBottom: "max(0.31vw, 5px)",
          paddingLeft: "max(0.88vw, 14px)",
          paddingRight: "max(0.62vw, 10px)",
        }}
      >
        <SiteLogo className="h-[1rem] w-auto" />
      </div>

      <h1
        className="text-center px-6 font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mt-[1.25rem] min-[413px]:mt-[1.4vw] md:mt-[0.8vw]"
        style={{
          width: "min(720px, 100vw)",
        }}
      >
        A small independent studio. We design brands, interfaces, and the
        edges in between
      </h1>

      <div
        className="relative w-screen"
        style={{
          marginTop: "-3vh",
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
            transform: "translate(-50%, -50%)",
            transformStyle: "preserve-3d",
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
    </div>
  );
}
