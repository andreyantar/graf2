"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

// Stays at its natural size while sitting in the dead zone (center of
// the viewport); subtly zooms up toward 1.2× as it enters from below
// and as it leaves through the top. No translate, no rotate — the
// headline tracks straight up.
const DEAD_HALF = 0.3;
const MAX_SCALE_BOOST = 0.2;

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

    const apply = (p: number) => {
      const env = envelope(p, DEAD_HALF);
      const scale = 1 + env * MAX_SCALE_BOOST;
      el.style.transform = `scale(${scale})`;
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
