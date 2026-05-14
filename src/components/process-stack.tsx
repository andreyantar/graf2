"use client";

import { useScroll, useTransform, motion, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import manifest from "@/data/artworks.json";

const ART: string[] = (manifest as Array<{ url: string }>).map((m) => m.url);

type Step = { title: string; desc: string; img: string };

const STEPS: Step[] = [
  {
    title: "01. Brief & alignment",
    desc: "We start with a 30-min call. You tell us what's going on. We tell you if we're a fit.",
    img: ART[5],
  },
  {
    title: "02. Strategy & direction",
    desc: "Before pixels, we agree on what we're solving and how to measure it.",
    img: ART[22],
  },
  {
    title: "03. Design & build",
    desc: "Founders run the project end-to-end. You see progress weekly, not at the deadline.",
    img: ART[95],
  },
  {
    title: "04. Launch & after",
    desc: "We hand over a system you can run yourself. And we don't disappear when it ships.",
    img: ART[165],
  },
];

// Each newer card lands this far below the previous one (vh) — enough
// to expose the title row of every earlier card.
const TITLE_STRIP_VH = 7;
// Approximate body height of one card (vh), used only for centering math.
const CARD_BODY_VH = 26;
// Share of each card's slot used for the slide-in.
const ENTRY_FRACTION = 0.7;
// Stack-depth feedback (purely visual: older cards lean back).
const PER_DEPTH_SCALE = 0.025;
const PER_DEPTH_LIFT_VH = 0.6;
const MAX_DEPTH = 3;

// Per-card settled rotation. Subtle scatter so the stack reads as a
// casual pile rather than a perfect column. Each card rotates from 0
// to its target angle during slide-in.
const STACK_ROTATIONS = [-2, 1.5, -1, 2.5];

const MAX_RADIUS = 32;
// Vertical scroll budget per stack step. Lower = tighter, faster
// transitions; container height = STEPS.length * SLOT_HEIGHT_VH.
const SLOT_HEIGHT_VH = 60;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function ProcessStack({ scrollContainerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Entry / pinning phase — 0 at container-top hits viewport-top,
  // 1 at container-bottom hits viewport-bottom (= moment sticky releases).
  const { scrollYProgress: entryProgress } = useScroll({
    target: containerRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // Exit phase — 0 while pinning is still happening, ramps to 1 as the
  // pinned stack scrolls upward out of the viewport.
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["end end", "end start"],
  });

  const stackHeightVh = (STEPS.length - 1) * TITLE_STRIP_VH + CARD_BODY_VH;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${STEPS.length * SLOT_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-svh w-full flex items-center justify-center">
        <div
          className="relative w-[88vw] md:w-[70vw] max-w-[880px]"
          style={{ height: `${stackHeightVh}vh` }}
        >
          {STEPS.map((step, i) => (
            <ProcessCard
              key={i}
              step={step}
              index={i}
              total={STEPS.length}
              entryProgress={entryProgress}
              exitProgress={exitProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessCard({
  step,
  index,
  total,
  entryProgress,
  exitProgress,
}: {
  step: Step;
  index: number;
  total: number;
  entryProgress: MotionValue<number>;
  exitProgress: MotionValue<number>;
}) {
  const cardRef = useRef<HTMLElement>(null);

  const finalYVh = index * TITLE_STRIP_VH;
  const slotStart = index / total;
  const slotEntry = (index + ENTRY_FRACTION) / total;

  // Card 0 is the "anchor" — it's already sitting at its final position
  // the moment the section enters the viewport. Without this short-circuit
  // the user has to scroll ~45vh of empty viewport waiting for card 01 to
  // slide up from below.
  const isAnchor = index === 0;

  // y combines slide-in + tiny upward lift per stacked card on top.
  const y = useTransform(entryProgress, (p) => {
    if (!isAnchor && p < slotStart) return "100vh";
    if (!isAnchor && p < slotEntry) {
      const ep = (p - slotStart) / (slotEntry - slotStart);
      return `${(1 - ep) * 100 + ep * finalYVh}vh`;
    }
    const depth = Math.max(0, p * total - index - 1);
    const lift = -Math.min(depth, MAX_DEPTH) * PER_DEPTH_LIFT_VH;
    return `${finalYVh + lift}vh`;
  });

  // Scale: shrinks once newer cards land on top.
  const scale = useTransform(entryProgress, (p) => {
    if (!isAnchor && p < slotEntry) return 1;
    const depth = Math.max(0, p * total - index - 1);
    return 1 - Math.min(depth, MAX_DEPTH) * PER_DEPTH_SCALE;
  });

  // Rotation: ramps from 0 to the per-card scatter angle during the
  // entry window, then holds. Gives the deck a "casually placed" feel.
  const targetRotation = STACK_ROTATIONS[index] ?? 0;
  const rotate = useTransform(entryProgress, (p) => {
    if (isAnchor) return targetRotation;
    if (p < slotStart) return 0;
    if (p < slotEntry) {
      const ep = (p - slotStart) / (slotEntry - slotStart);
      return ep * targetRotation;
    }
    return targetRotation;
  });

  // Radius is driven by both phases:
  //  - During entry: round → sharp over this card's entry window
  //  - Settled & pinned: sharp
  //  - Exit: all cards round simultaneously, peaking at MAX_RADIUS
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;
    const apply = () => {
      const ep = entryProgress.get();
      const xp = exitProgress.get();
      let r: number;
      if (xp > 0) {
        r = MAX_RADIUS * Math.min(1, xp);
      } else if (isAnchor) {
        r = 0;
      } else if (ep < slotStart) {
        r = MAX_RADIUS;
      } else if (ep < slotEntry) {
        const t = (ep - slotStart) / (slotEntry - slotStart);
        r = MAX_RADIUS * (1 - t);
      } else {
        r = 0;
      }
      card.style.setProperty("--card-radius", `${r}px`);
    };
    apply();
    const u1 = entryProgress.on("change", apply);
    const u2 = exitProgress.on("change", apply);
    return () => {
      u1();
      u2();
    };
  }, [entryProgress, exitProgress, slotStart, slotEntry, isAnchor]);

  return (
    <motion.article
      ref={cardRef}
      style={{
        y,
        scale,
        rotate,
        zIndex: index,
        transformOrigin: "center top",
      }}
      className="absolute top-0 left-0 right-0 w-full flex bg-paper text-ink shadow-card overflow-hidden rounded-[var(--card-radius,0px)] min-h-[240px] [contain:paint] will-change-transform"
    >
      {/* Square cover on the left — visible from md+ only; on mobile the
          card is too narrow to share the row with content. */}
      <div className="hidden md:block relative w-[240px] aspect-square shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={step.img}
          alt={step.title}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 p-7 md:p-10 flex flex-col justify-center">
        <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1] mb-3">
          {step.title}
        </h3>
        <p className="text-body leading-snug opacity-80">{step.desc}</p>
      </div>
    </motion.article>
  );
}
