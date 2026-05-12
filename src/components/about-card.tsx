"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.1;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function AboutCard({ scrollContainerRef }: Props) {
  const cardRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;

    const apply = (p: number) => {
      card.style.setProperty(
        "--card-radius",
        `${envelope(p, RADIUS_DEAD_HALF) * MAX_RADIUS}px`,
      );
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [scrollYProgress]);

  return (
    <article
      ref={cardRef}
      className="relative w-[88vw] md:w-[70vw] max-w-[680px] mx-auto bg-paper text-ink shadow-card overflow-hidden p-8 md:p-12 rounded-[var(--card-radius,0px)] will-change-transform [contain:paint]"
    >
      <h2 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-6">
        About
      </h2>
      <div className="space-y-5 text-body leading-relaxed opacity-90">
        <p>
          Most studios are built for one of two extremes. Freelancers execute
          exactly what you ask — but they don&apos;t push back when you&apos;re
          wrong, and they disappear when you need them next quarter. Big
          agencies bring strategy and scale — but you&apos;ll spend half the
          budget on people who&apos;ll never touch your project, and the other
          half explaining your business from scratch every time someone gets
          reassigned.
        </p>
        <p>
          Studio Graffiti was built for the middle. We&apos;re a small
          European studio working with founders who treat their brand as the
          product, not as a deliverable. We do brand identity, websites,
          AI-driven visuals — the founders run every project end-to-end, so
          you talk to the people who do the work. Clients in Poland, the US
          and the UAE come back to us because we don&apos;t disappear after
          launch.
        </p>
        <p>
          When you work with us, your brand doesn&apos;t look like it was made
          by a 3-person studio. It looks like it was made by people who took
          it as seriously as you do.
        </p>
      </div>
    </article>
  );
}
