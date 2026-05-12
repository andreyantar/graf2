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

// Each newer card lands this far below the previous one. Sized to expose
// roughly the title strip (h3 + its padding) of every earlier card.
const TITLE_STRIP_VH = 7;

// What share of each card's scroll slot is spent sliding in from below.
const ENTRY_FRACTION = 0.7;

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

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${STEPS.length * SLOT_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-svh w-full flex items-start justify-center pt-[15vh]">
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

  // Where this card lands once it's fully entered. Newer cards (higher
  // index) settle further down, so the title strip of each earlier card
  // stays visible above this one.
  const finalYVh = index * TITLE_STRIP_VH;

  // Slot windows in [0, 1] global progress.
  const slotStart = index / total;
  const slotEntry = (index + ENTRY_FRACTION) / total;

  // y goes from 100vh (off-screen below) to finalYVh during the entry
  // window. After entry it stays at finalYVh. Reverse for scroll-back.
  const y = useTransform(stackProgress, (p) => {
    if (p < slotStart) return "100vh";
    if (p < slotEntry) {
      const ep = (p - slotStart) / (slotEntry - slotStart);
      const v = (1 - ep) * 100 + ep * finalYVh;
      return `${v}vh`;
    }
    return `${finalYVh}vh`;
  });

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
      } else {
        r = 0;
      }
      card.style.setProperty("--card-radius", `${r}px`);
    };
    apply(stackProgress.get());
    const unsub = stackProgress.on("change", apply);
    return () => unsub();
  }, [stackProgress, slotStart, slotEntry]);

  return (
    <motion.article
      ref={cardRef}
      style={{ y, zIndex: index }}
      className="absolute top-0 left-0 right-0 w-full bg-paper text-ink shadow-card overflow-hidden p-7 md:p-10 rounded-[var(--card-radius,0px)] min-h-[240px] [contain:paint] will-change-transform"
    >
      <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-3">
        {step.title}
      </h3>
      <p className="text-body leading-snug opacity-80">{step.desc}</p>
    </motion.article>
  );
}
