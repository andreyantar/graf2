"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import manifest from "@/data/artworks.json";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

const ART_URLS: string[] = (manifest as Array<{ url: string }>).map(
  (m) => m.url,
);

// Curated indices into the artworks manifest. The 4 anchor indices
// (7 / 33 / 51 / 62) match the Selected Work case images so the hero
// previews the studio's actual gallery.
const HERO_INDICES = [7, 18, 33, 44, 51, 62, 88, 112, 145, 178];
const HERO_IMAGES = HERO_INDICES.map((i) => ART_URLS[i]).filter(Boolean);

// Per-card geometry. The strip is rendered twice for a seamless wrap.
const CARD_W = 220; // px
const CARD_H = 280; // px
const GAP = 24; // px
const STEP = CARD_W + GAP;

// Per-frame arc shaping: a card sitting at the viewport center peaks
// in scale and rotates to 0°; cards toward the edges tilt outward and
// drop slightly, drawing a fan.
const ARC_SPAN_PX = 900; // distance from center where arc still affects the card
const MAX_LIFT = 28; // px upward at center
const MAX_TILT = 16; // deg at the far edge
const MAX_SCALE_BOOST = 0.08; // +8% at center

export function HeroGallery() {
  const stripRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const wrap = wrapRef.current;
    if (!strip || !wrap) return;

    const reduceMotion = prefersReducedMotion();
    const singleSetWidth = HERO_IMAGES.length * STEP;

    // Continuous leftward scroll. Speed is tuned so a full set traverses
    // roughly every 40s; ease "none" keeps it linear.
    const tween = reduceMotion
      ? null
      : gsap.to(strip, {
          x: -singleSetWidth,
          duration: HERO_IMAGES.length * 4,
          ease: "none",
          repeat: -1,
        });

    const cards = Array.from(strip.children) as HTMLElement[];
    const apply = () => {
      const wrapRect = wrap.getBoundingClientRect();
      const wrapCenter = wrapRect.left + wrapRect.width / 2;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const d = (cx - wrapCenter) / ARC_SPAN_PX; // -1 .. 1 inside the arc
        const clamped = Math.max(-1, Math.min(1, d));
        const lift = -(1 - clamped * clamped) * MAX_LIFT;
        const tilt = clamped * MAX_TILT;
        const scale = 1 + (1 - clamped * clamped) * MAX_SCALE_BOOST;
        card.style.transform = `translateY(${lift}px) rotate(${tilt}deg) scale(${scale})`;
      }
    };

    apply();
    if (reduceMotion) {
      return;
    }
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
      tween?.kill();
    };
  }, []);

  // Render the image set twice so the GSAP translate can wrap without
  // a visible seam. The second copy lives off the right edge until the
  // first scrolls off the left.
  const looped = [...HERO_IMAGES, ...HERO_IMAGES];

  return (
    <div className="relative w-full flex flex-col items-center gap-10 md:gap-14">
      <div className="text-center px-6 max-w-[720px]">
        <p className="font-mono text-mono uppercase tracking-widest opacity-50 mb-4">
          Studio Graffiti
        </p>
        <h1 className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1]">
          A small independent studio. We design brands, interfaces, and the
          edges in between.
        </h1>
      </div>

      <div
        ref={wrapRef}
        className="relative w-screen overflow-hidden"
        style={{ height: CARD_H + 80 }}
        aria-hidden
      >
        <div
          ref={stripRef}
          className="absolute top-1/2 left-0 -translate-y-1/2 flex"
          style={{ gap: `${GAP}px`, willChange: "transform" }}
        >
          {looped.map((src, i) => (
            <div
              key={i}
              className="relative shrink-0 overflow-hidden rounded-[14px] shadow-card bg-paper"
              style={{
                width: CARD_W,
                height: CARD_H,
                transformOrigin: "center center",
                willChange: "transform",
              }}
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
