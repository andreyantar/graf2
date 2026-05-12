"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.1;

const EMAIL = "hello@studio-graffiti.pl";
const TELEGRAM_HANDLE = "studiograffiti";

type Props = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

export function ContactCard({ scrollContainerRef }: Props) {
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
      <h2 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-4">
        Have a brand worth building?
      </h2>
      <p className="text-body leading-relaxed opacity-90 mb-8">
        We respond within 24 hours. No agency forms, no qualification calls —
        just a quick chat.
      </p>

      <a
        href={`mailto:${EMAIL}`}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-paper text-body hover:opacity-90 transition-opacity"
      >
        Start a project →
      </a>

      <p className="font-mono text-mono uppercase tracking-widest opacity-50 mt-10 mb-3">
        Or write directly
      </p>
      <ul className="text-body leading-relaxed space-y-1">
        <li>
          <a
            href={`mailto:${EMAIL}`}
            className="hover:opacity-60 transition-opacity"
          >
            {EMAIL}
          </a>
        </li>
        <li>
          <a
            href={`https://t.me/${TELEGRAM_HANDLE}`}
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-60 transition-opacity"
          >
            t.me/{TELEGRAM_HANDLE}
          </a>
        </li>
      </ul>

      <hr className="my-8 border-current opacity-15" />

      <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">
        © Studio Graffiti — independent practice.
      </p>
      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] uppercase tracking-widest opacity-70">
        <a href="#" className="hover:opacity-100">
          Instagram ↗
        </a>
        <a href="#" className="hover:opacity-100">
          Are.na ↗
        </a>
        <a href="#" className="hover:opacity-100">
          LinkedIn ↗
        </a>
        <a href={`mailto:${EMAIL}`} className="hover:opacity-100">
          Email ↗
        </a>
      </div>
    </article>
  );
}
