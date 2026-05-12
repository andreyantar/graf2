"use client";

import { useScroll, useTransform, motion, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

type Step = { title: string; desc: string };

const STEPS: Step[] = [
  {
    title: "01. Brief & alignment",
    desc: "We start with a 30-min call. You tell us what's going on. We tell you if we're a fit.",
  },
  {
    title: "02. Strategy & direction",
    desc: "Before pixels, we agree on what we're solving and how to measure it.",
  },
  {
    title: "03. Design & build",
    desc: "Founders run the project end-to-end. You see progress weekly, not at the deadline.",
  },
  {
    title: "04. Launch & after",
    desc: "We hand over a system you can run yourself. And we don't disappear when it ships.",
  },
];

// Each newer card lands this far below the previous one (in vh) — just
// enough to expose the title row of every earlier card.
const TITLE_STRIP_VH = 7;
// Estimate of one card's body height (vh) for centering the whole deck.
const CARD_BODY_VH = 26;
// Share of each card's scroll slot used for the slide-in.
const ENTRY_FRACTION = 0.7;
// How much each card behind shrinks (per card on top of it).
const PER_DEPTH_SCALE = 0.025;
// Slight upward nudge per depth so older cards "lean back" subtly.
const PER_DEPTH_LIFT_VH = 0.6;
// Cap so 5th+ card behind doesn't collapse into nothing.
const MAX_DEPTH = 3;

const MAX_RADIUS = 32;
const SLOT_HEIGHT_VH = 90;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function ProcessStack({ scrollContainerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // Approx visible height of the full stack: titles ladder + last card body.
  const stackHeightVh = (STEPS.length - 1) * TITLE_STRIP_VH + CARD_BODY_VH;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${STEPS.length * SLOT_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-svh w-full flex items-center justify-center">
        <div
          className="relative w-[88vw] md:w-[70vw] max-w-[640px]"
          style={{ height: `${stackHeightVh}vh` }}
        >
          {STEPS.map((step, i) => (
            <ProcessCard
              key={i}
              step={step}
              index={i}
              total={STEPS.length}
              stackProgress={scrollYProgress}
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
  stackProgress,
}: {
  step: Step;
  index: number;
  total: number;
  stackProgress: MotionValue<number>;
}) {
  const cardRef = useRef<HTMLElement>(null);

  // Final resting Y once fully entered. Newer cards settle further down,
  // exposing the title strips of older cards above.
  const finalYVh = index * TITLE_STRIP_VH;

  const slotStart = index / total;
  const slotEntry = (index + ENTRY_FRACTION) / total;
  const nextSlotStart = (index + 1) / total;
  const nextSlotEntry = (index + 1 + ENTRY_FRACTION) / total;

  // y combines: slide-in from below, target Y, and tiny upward lift as
  // newer cards land on top (depth-driven).
  const y = useTransform(stackProgress, (p) => {
    if (p < slotStart) return "100vh";
    if (p < slotEntry) {
      const ep = (p - slotStart) / (slotEntry - slotStart);
      return `${(1 - ep) * 100 + ep * finalYVh}vh`;
    }
    const depth = Math.max(0, p * total - index - 1);
    const lift = -Math.min(depth, MAX_DEPTH) * PER_DEPTH_LIFT_VH;
    return `${finalYVh + lift}vh`;
  });

  // Scale: 1 while top of stack, shrinks once newer cards arrive.
  const scale = useTransform(stackProgress, (p) => {
    if (p < slotEntry) return 1;
    const depth = Math.max(0, p * total - index - 1);
    return 1 - Math.min(depth, MAX_DEPTH) * PER_DEPTH_SCALE;
  });

  // Radius: rounded → sharp during entry; once settled, stays sharp while
  // this card is the front. When the next card starts entering, this one
  // rounds back up to MAX_RADIUS over that next card's entry window.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;
    const apply = (p: number) => {
      let r: number;
      if (p < slotStart) {
        r = MAX_RADIUS;
      } else if (p < slotEntry) {
        const ep = (p - slotStart) / (slotEntry - slotStart);
        r = MAX_RADIUS * (1 - ep);
      } else if (p < nextSlotStart || index === total - 1) {
        // We're the active front (or there's no next card).
        r = 0;
      } else {
        const ep = Math.min(
          1,
          (p - nextSlotStart) / (nextSlotEntry - nextSlotStart),
        );
        r = MAX_RADIUS * ep;
      }
      card.style.setProperty("--card-radius", `${r}px`);
    };
    apply(stackProgress.get());
    const unsub = stackProgress.on("change", apply);
    return () => unsub();
  }, [
    stackProgress,
    slotStart,
    slotEntry,
    nextSlotStart,
    nextSlotEntry,
    index,
    total,
  ]);

  return (
    <motion.article
      ref={cardRef}
      style={{ y, scale, zIndex: index, transformOrigin: "center top" }}
      className="absolute top-0 left-0 right-0 w-full bg-paper text-ink shadow-card overflow-hidden p-7 md:p-10 rounded-[var(--card-radius,0px)] min-h-[240px] [contain:paint] will-change-transform"
    >
      <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-3">
        {step.title}
      </h3>
      <p className="text-body leading-snug opacity-80">{step.desc}</p>
    </motion.article>
  );
}
