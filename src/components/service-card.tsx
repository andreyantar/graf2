"use client";

import Link from "next/link";
import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

export type ServiceData = {
  title: string;
  desc: string;
  href: string;
  img: string;
};

type Props = {
  data: ServiceData;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.1;

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
      className="relative min-h-[280px] md:min-h-[360px] shadow-card overflow-hidden will-change-transform rounded-[var(--card-radius,0px)] [contain:paint]"
    >
      <Link href={data.href} className="group block w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark gradient for white-text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/15" />

        <div className="relative z-10 flex flex-col h-full min-h-[280px] md:min-h-[360px] p-7 md:p-8 text-white">
          <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-3">
            {data.title}
          </h3>
          <p className="text-body leading-snug opacity-90">{data.desc}</p>
        </div>
      </Link>
    </article>
  );
}
