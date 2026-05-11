"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";

export type ServiceData = {
  n: string;
  title: string;
  desc: string;
  href: string;
};

type Props = {
  data: ServiceData;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

const MAX_RADIUS = 20;
const RADIUS_DEAD_HALF = 0.1;

function radiusEnvelope(p: number): number {
  const d = Math.abs(p - 0.5);
  const t = Math.max(
    0,
    Math.min(1, (d - RADIUS_DEAD_HALF) / (0.5 - RADIUS_DEAD_HALF)),
  );
  return t * t * (3 - 2 * t);
}

export function ServiceCard({ data, scrollContainerRef }: Props) {
  const cardRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const apply = (p: number) => {
      card.style.borderRadius = `${radiusEnvelope(p) * MAX_RADIUS}px`;
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
      className="flex flex-col bg-white text-[#121212] p-7 md:p-8 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] overflow-hidden will-change-transform"
    >
      <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-6">
        {data.n}
      </p>
      <h3 className="font-clash text-[1.75rem] leading-tight font-bold mb-3">
        {data.title}
      </h3>
      <p className="text-[14px] leading-snug opacity-70 mb-8 flex-1">
        {data.desc}
      </p>
      <a
        href={data.href}
        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest border-b border-current pb-0.5 self-start hover:opacity-60 transition-opacity"
      >
        See ↗
      </a>
    </article>
  );
}
