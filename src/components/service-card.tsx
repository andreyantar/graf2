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
  /** "center" disables the outward translate + tilt, leaving only the
   *  border-radius envelope. Used for the middle column in 3-card rows. */
  column?: "left" | "right" | "center";
};

// Same arc tunables as BlogCard so the families read as one system.
const DEAD_HALF = 0.3;
const MAX_X = 60;
const MAX_ROT = 3;
const FLIP_ROTATION = false;
const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.1;

export function ServiceCard({
  data,
  scrollContainerRef,
  column = "left",
}: Props) {
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

    const isCenter = column === "center";
    const colSign = column === "right" ? 1 : -1;
    const rotFlip = FLIP_ROTATION ? -1 : 1;

    const apply = (p: number) => {
      const env = envelope(p, DEAD_HALF);
      const verticalSign = p < 0.5 ? -1 : 1;
      const x = isCenter ? 0 : env * MAX_X * colSign;
      const rot = isCenter
        ? 0
        : verticalSign * env * MAX_ROT * colSign * rotFlip;
      const radius = envelope(p, RADIUS_DEAD_HALF) * MAX_RADIUS;
      card.style.transform = `translate3d(${x}px, 0, 0) rotate(${rot}deg)`;
      card.style.setProperty("--card-radius", `${radius}px`);
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [column, scrollYProgress]);

  return (
    <article
      ref={cardRef}
      className="relative min-h-[280px] md:min-h-[360px] shadow-card overflow-hidden will-change-transform rounded-[var(--card-radius,0px)] [contain:paint]"
    >
      <Link href={data.href} className="group block w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt={data.title}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark gradient for white-text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/15" />

        <div className="relative z-10 flex flex-col h-full min-h-[280px] md:min-h-[360px] p-7 md:p-8 text-white">
          <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1] mb-3">
            {data.title}
          </h3>
          <p className="text-body leading-snug opacity-90">{data.desc}</p>
        </div>
      </Link>
    </article>
  );
}
