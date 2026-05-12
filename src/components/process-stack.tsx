"use client";

import { useScroll, useTransform, motion } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { envelope } from "@/lib/scroll-envelope";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

type Step = { n: string; title: string; desc: string };

const STEPS: Step[] = [
  {
    n: "01",
    title: "Brief & alignment",
    desc: "We start with a 30-min call. You tell us what's going on. We tell you if we're a fit.",
  },
  {
    n: "02",
    title: "Strategy & direction",
    desc: "Before pixels, we agree on what we're solving and how to measure it.",
  },
  {
    n: "03",
    title: "Design & build",
    desc: "Founders run the project end-to-end. You see progress weekly, not at the deadline.",
  },
  {
    n: "04",
    title: "Launch & after",
    desc: "We hand over a system you can run yourself. And we don't disappear when it ships.",
  },
];

const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.15;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function ProcessStack({ scrollContainerRef }: Props) {
  return (
    <div className="relative w-[88vw] md:w-[70vw] max-w-[640px] mx-auto py-[15vh]">
      {STEPS.map((step, i) => (
        <ProcessCard
          key={i}
          step={step}
          index={i}
          scrollContainerRef={scrollContainerRef}
        />
      ))}
    </div>
  );
}

function ProcessCard({
  step,
  index,
  scrollContainerRef,
}: {
  step: Step;
  index: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  // Progress through the slot: 0 = slot top at viewport bottom, 1 = bottom
  // at viewport top. Past 0.5 the next slot starts entering — this card
  // gets covered, so we shrink and lift it slightly to fake a stack edge.
  const { scrollYProgress } = useScroll({
    target: slotRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0.5, 1], [1, 0.94]);
  const y = useTransform(scrollYProgress, [0.5, 1], [0, -16]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;
    const apply = (p: number) => {
      const r = envelope(p, RADIUS_DEAD_HALF) * MAX_RADIUS;
      card.style.setProperty("--card-radius", `${r}px`);
    };
    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <div ref={slotRef} className="h-[60vh]">
      <motion.article
        ref={cardRef}
        style={{ scale, y, zIndex: index, transformOrigin: "center top" }}
        className="sticky top-[18vh] w-full bg-paper text-ink shadow-card overflow-hidden p-7 md:p-10 rounded-[var(--card-radius,0px)] [contain:paint] will-change-transform"
      >
        <p className="font-mono text-mono uppercase tracking-widest opacity-50 mb-4">
          {step.n}
        </p>
        <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-3">
          {step.title}
        </h3>
        <p className="text-body-lg leading-snug opacity-80">
          {step.desc}
        </p>
      </motion.article>
    </div>
  );
}
