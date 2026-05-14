"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

// Stays at its natural size while sitting in the dead zone (center of
// the viewport); subtly zooms up toward 1.2× as it enters from below
// and as it leaves through the top. No translate, no rotate — the
// whole brand block (mark + headline) tracks straight up.
const DEAD_HALF = 0.3;
const MAX_SCALE_BOOST = 0.2;

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  as?: "h1" | "h2";
};

export function HeroTitle({ scrollContainerRef, children, as = "h2" }: Props) {
  const Heading = as;
  const ref = useRef<HTMLDivElement>(null);

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
    <div
      ref={ref}
      className="flex flex-col items-center gap-8 max-w-[680px] mx-auto px-6 will-change-transform"
    >
      <DotLottieReact
        src="/logo.lottie"
        autoplay
        loop
        aria-hidden
        className="w-16 h-16"
      />

      <Heading className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1] text-center">
        {children}
      </Heading>
    </div>
  );
}
