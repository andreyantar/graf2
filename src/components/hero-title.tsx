"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

// Same arc tunables as the card family.
const DEAD_HALF = 0.3;
const MAX_X = 60;
const MAX_ROT = 3;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

export function HeroTitle({ scrollContainerRef, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    // Treat the headline as a "left" column card: shifts left and tilts
    // at the viewport edges, sits perfectly still in the dead zone.
    const colSign = -1;

    const apply = (p: number) => {
      const env = envelope(p, DEAD_HALF);
      const verticalSign = p < 0.5 ? -1 : 1;
      const x = env * MAX_X * colSign;
      const rot = verticalSign * env * MAX_ROT * colSign;
      el.style.transform = `translate3d(${x}px, 0, 0) rotate(${rot}deg)`;
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [scrollYProgress]);

  return (
    <h2
      ref={ref}
      className="font-heavy text-card-title tracking-[-0.02em] leading-tight text-center max-w-[680px] mx-auto px-6 will-change-transform"
    >
      {children}
    </h2>
  );
}
