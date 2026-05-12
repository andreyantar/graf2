"use client";

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
};

export function HeroTitle({ scrollContainerRef, children }: Props) {
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
      <svg
        viewBox="0 0 50 50"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="w-16 h-16 text-ink"
      >
        <g clipPath="url(#hero-mark-clip)">
          <path d="M15.4623 16.6644V49.9928H0V33.3286C0 30.2927 0.75443 27.4506 2.06949 24.9965C3.42608 22.4678 5.38483 20.3568 7.73117 18.8948C10.0083 17.4775 12.6453 16.6644 15.4623 16.6644Z" />
          <path d="M30.9247 0C30.9247 3.03595 30.1703 5.87796 28.8553 8.33209C27.4987 10.8608 25.5399 12.9718 23.1936 14.4338C20.9164 15.8511 18.2794 16.6642 15.4624 16.6642V0H30.9247Z" />
          <path d="M34.5371 33.3284V0H49.9995V16.6642C49.9995 19.7001 49.245 22.5421 47.93 24.9963C46.5734 27.525 44.6146 29.636 42.2683 31.098C39.9912 32.5153 37.3541 33.3284 34.5371 33.3284Z" />
          <path d="M19.0757 49.9997C19.0757 46.9637 19.8301 44.1217 21.1452 41.6676C22.5018 39.1389 24.4605 37.0279 26.8069 35.5659C29.084 34.1486 31.721 33.3355 34.538 33.3355V49.9997H19.0757Z" />
        </g>
        <defs>
          <clipPath id="hero-mark-clip">
            <rect width="50" height="50" fill="white" />
          </clipPath>
        </defs>
      </svg>

      <h2 className="font-heavy text-card-title tracking-[-0.02em] leading-tight text-center">
        {children}
      </h2>
    </div>
  );
}
