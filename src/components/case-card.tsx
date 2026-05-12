"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

export type CaseData = {
  n: string;
  title: string;
  desc: string;
  href: string;
  img: string;
};

type Props = {
  data: CaseData;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  column?: "left" | "right";
};

// ─── Tunables ──────────────────────────────────────────────────────────
// While the card sits between DEAD_HALF·2 of viewport center it stays
// perfectly upright and at its natural grid position. Outside that band
// it ramps outward along the arc with smoothstep easing.
const DEAD_HALF = 0.3; // 0.5 ± 0.3  → dead zone covers progress [0.2, 0.8]

// Peak shift / tilt at the very edges of viewport (progress 0 or 1).
// Ratio kept around ~10 px / deg so the arc reads as physically coherent
// (a card sliding along a large-radius tangent, not whipping around its own center).
const MAX_X = 60; // px outward push at progress 0 / 1
const MAX_ROT = 3; // deg tilt at progress 0 / 1

// Reverse the tilt direction without touching anything else.
const FLIP_ROTATION = false;

// Corner radius uses its own, narrower dead zone — corners should already be
// rounding once the card visibly approaches the viewport edge, well before
// the tilt/translate envelope kicks in.
const MAX_RADIUS = 32; // px at progress 0 / 1
const RADIUS_DEAD_HALF = 0.1; // sharp only inside [0.4, 0.6]

// ───────────────────────────────────────────────────────────────────────

function envelope(p: number, deadHalf: number = DEAD_HALF): number {
  // 0 inside the dead zone, smoothly ramps to 1 at progress 0 or 1.
  const d = Math.abs(p - 0.5);
  const t = Math.max(0, Math.min(1, (d - deadHalf) / (0.5 - deadHalf)));
  return t * t * (3 - 2 * t); // smoothstep
}

export function CaseCard({
  data,
  scrollContainerRef,
  column = "left",
}: Props) {
  const cardRef = useRef<HTMLElement>(null);

  // 0 = card top at viewport bottom (entering), 1 = card bottom at viewport top (exiting)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    // Respect OS-level reduced-motion: card stays in its natural grid slot,
    // sharp corners, no scroll-driven arc.
    if (prefersReducedMotion()) return;

    const colSign = column === "right" ? 1 : -1; // outward direction per column
    const rotFlip = FLIP_ROTATION ? -1 : 1;

    const apply = (p: number) => {
      const env = envelope(p);
      const verticalSign = p < 0.5 ? -1 : 1; // bottom / top half of traversal

      const x = env * MAX_X * colSign;
      const rot = verticalSign * env * MAX_ROT * colSign * rotFlip;
      const radius = envelope(p, RADIUS_DEAD_HALF) * MAX_RADIUS;

      // border-radius is consumed via CSS var (see className) — keeps the
      // shape mutation separate from the transform write and lets the
      // browser optimize the paint hint.
      card.style.transform = `translate3d(${x}px, 0, 0) rotate(${rot}deg)`;
      card.style.setProperty("--card-radius", `${radius}px`);
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [column, scrollYProgress]);

  return (
    <article
      ref={cardRef}
      className="w-full max-w-[600px] bg-white text-[#121212] shadow-[0_0_50px_0_rgba(0,0,0,0.10)] overflow-hidden will-change-transform rounded-[var(--card-radius,0px)]"
    >
      <div className="relative h-[280px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="block w-full h-full object-cover"
        />
      </div>
      <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7">
        <h3 className="font-heavy text-[34px] tracking-[-0.02em] leading-tight mb-2">
          {data.title}
        </h3>
        <p className="text-[14px] leading-snug opacity-80 mb-4 line-clamp-4">
          {data.desc}
        </p>
        <a
          href={data.href}
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          View case →
        </a>
      </div>
    </article>
  );
}
