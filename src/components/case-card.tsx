"use client";

import Link from "next/link";
import { useScroll } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

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
  /** Position in the row (0 = first). On ≤767px every card past the
   *  first stays static — no transform, no radius envelope — so the
   *  mobile stack doesn't feel like five separate scroll-driven loops
   *  competing for attention. */
  cardIndex?: number;
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

export function CaseCard({
  data,
  scrollContainerRef,
  column = "left",
  cardIndex = 0,
}: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [mobileSkip, setMobileSkip] = useState(false);

  // 0 = card top at viewport bottom (entering), 1 = card bottom at viewport top (exiting)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  // Watch the ≤767 breakpoint — only relevant past the first card.
  useEffect(() => {
    if (cardIndex === 0) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobileSkip(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [cardIndex]);

  useEffect(() => {
    const card = cardRef.current;
    const img = imgRef.current;
    if (!card) return;
    // Respect OS-level reduced-motion: card stays in its natural grid slot,
    // sharp corners, no scroll-driven arc.
    if (prefersReducedMotion()) return;
    // On mobile every card past the first sits in its natural place.
    if (mobileSkip) {
      card.style.transform = "";
      card.style.setProperty("--card-radius", "0px");
      if (img) img.style.transform = "";
      return;
    }

    const colSign = column === "right" ? 1 : -1; // outward direction per column
    const rotFlip = FLIP_ROTATION ? -1 : 1;

    const apply = (p: number) => {
      const env = envelope(p, DEAD_HALF);
      const verticalSign = p < 0.5 ? -1 : 1; // bottom / top half of traversal

      const x = env * MAX_X * colSign;
      const rot = verticalSign * env * MAX_ROT * colSign * rotFlip;
      const radius = envelope(p, RADIUS_DEAD_HALF) * MAX_RADIUS;

      // border-radius is consumed via CSS var (see className) — keeps the
      // shape mutation separate from the transform write and lets the
      // browser optimize the paint hint.
      card.style.transform = `translate3d(${x}px, 0, 0) rotate(${rot}deg)`;
      card.style.setProperty("--card-radius", `${radius}px`);
      // Scroll-driven image zoom: linear 1.3 (card at viewport bottom)
      // → 1.0 (card at viewport top). Symmetric in scroll direction
      // because it tracks card position, not scroll velocity.
      if (img) img.style.transform = `scale(${1.3 - 0.3 * p})`;
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [column, mobileSkip, scrollYProgress]);

  return (
    <article
      ref={cardRef}
      className="w-full max-w-[600px] bg-paper text-ink shadow-card overflow-hidden will-change-transform rounded-[var(--card-radius,0px)] [contain:paint]"
    >
      <Link href={data.href} className="group block">
        <div className="relative h-[280px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={data.img}
            alt={data.title}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="block w-full h-full object-cover will-change-transform"
          />
        </div>
        <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7">
          <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1] mb-2 group-hover:opacity-80 transition-opacity">
            {data.title}
          </h3>
          <p className="text-body leading-snug opacity-80 mb-4 line-clamp-4">
            {data.desc}
          </p>
          <span className="inline-flex items-center gap-1 text-body group-hover:opacity-60 transition-opacity">
            View case →
          </span>
        </div>
      </Link>
    </article>
  );
}
