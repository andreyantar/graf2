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

// Tunables for the stack physics. Tweak together — they describe one
// visual model (deck of cards, newest on top).
const ENTRY_FRACTION = 0.7; // how much of each slot is used for the slide-in
const PER_STACK_SCALE = 0.04; // each card behind shrinks by 4%
const PER_STACK_LIFT_VH = 1.2; // each card behind nudges up by 1.2vh
const MAX_VISIBLE_DEPTH = 3; // cap so the 5th-back card doesn't disappear
const MAX_RADIUS = 32;
const SLOT_HEIGHT_VH = 90; // scroll budget per card

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function ProcessStack({ scrollContainerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Progress through the entire stack: 0 = container top hits viewport top,
  // 1 = container bottom hits viewport bottom. With sticky wrapper inside,
  // this controls the whole deck timeline.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${STEPS.length * SLOT_HEIGHT_VH}vh` }}
    >
      {/* Sticky frame pinned to the viewport while the container scrolls
          through it. Inside: an auto-height stack of absolute cards. */}
      <div className="sticky top-0 h-svh w-full flex items-start justify-center pt-[18vh]">
        <div className="relative w-[88vw] md:w-[70vw] max-w-[640px]">
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

  // Slot windows in [0, 1] global progress.
  const slotStart = index / total;
  const slotEntry = (index + ENTRY_FRACTION) / total;

  // y combines slide-in from below (during entry) with a small lift once
  // newer cards land on top. Output kept in vh units so it scales with
  // viewport.
  const y = useTransform(stackProgress, (p) => {
    if (p < slotStart) return "100vh";
    if (p < slotEntry) {
      const ep = (p - slotStart) / (slotEntry - slotStart);
      return `${(1 - ep) * 100}vh`;
    }
    const depth = Math.max(0, p * total - index - 1);
    return `${-Math.min(depth, MAX_VISIBLE_DEPTH) * PER_STACK_LIFT_VH}vh`;
  });

  const scale = useTransform(stackProgress, (p) => {
    if (p < slotEntry) return 1;
    const depth = Math.max(0, p * total - index - 1);
    return 1 - Math.min(depth, MAX_VISIBLE_DEPTH) * PER_STACK_SCALE;
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;
    const apply = (p: number) => {
      let r = 0;
      if (p < slotStart) {
        r = MAX_RADIUS;
      } else if (p < slotEntry) {
        // Entry: round → sharp
        const ep = (p - slotStart) / (slotEntry - slotStart);
        r = MAX_RADIUS * (1 - ep);
      } else {
        // After entry: stays sharp while it's the top, slight round once
        // there's at least one card on top of it.
        const depth = Math.max(0, p * total - index - 1);
        r = Math.min(depth, 1) * MAX_RADIUS * 0.5;
      }
      card.style.setProperty("--card-radius", `${r}px`);
    };
    apply(stackProgress.get());
    const unsub = stackProgress.on("change", apply);
    return () => unsub();
  }, [stackProgress, slotStart, slotEntry, index, total]);

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
