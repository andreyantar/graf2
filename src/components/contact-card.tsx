"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";

const MAX_RADIUS = 32;
const MIN_RADIUS = 16; // settled state — softer than fully square
const RADIUS_DEAD_HALF = 0.1;

const EMAIL = "hello@studio-graffiti.pl";
const TELEGRAM_HANDLE = "studiograffiti";

type Props = {
  // Optional: the homepage passes its custom snap-scroll container.
  // On standard-scroll subpages (e.g. /work/[slug]) it's omitted and
  // the radius animation tracks the window scroll instead.
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

export function ContactCard({ scrollContainerRef }: Props) {
  const cardRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement> | undefined,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;

    const apply = (p: number) => {
      card.style.setProperty(
        "--card-radius",
        `${MIN_RADIUS + envelope(p, RADIUS_DEAD_HALF) * (MAX_RADIUS - MIN_RADIUS)}px`,
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
      className="relative w-[88vw] md:w-[70vw] max-w-[680px] mx-auto bg-paper text-ink shadow-card overflow-hidden p-8 md:p-12 rounded-[var(--card-radius,1rem)] will-change-transform [contain:paint]"
    >
      <h2 className="font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mb-4">
        Have a brand worth building?
      </h2>
      <p className="text-body leading-relaxed opacity-90 mb-8">
        We respond within 24 hours. No agency forms, no qualification calls —
        just a quick chat.
      </p>

      {/* Placeholder slot for the single sticky CTA (FloatingCTA
          docks here when this section enters viewport). Reserves
          the same vertical space + width as the real button so the
          card layout doesn't shift when the floating button settles
          in. The button itself lives in `<FloatingCTA/>` mounted at
          the page root and tracks `[data-cta-slot]` rects. */}
      <div
        data-cta-slot
        aria-hidden
        className="w-full"
        style={{ height: "56px", borderRadius: "1.25rem" }}
      />

      <p className="text-[13px] opacity-50 mt-10 mb-3">
        Or write directly
      </p>
      <ul className="text-body leading-relaxed flex flex-col gap-y-2 min-[481px]:flex-row min-[481px]:justify-between min-[481px]:gap-x-6 min-[481px]:gap-y-0 lg:grid lg:grid-cols-2">
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

      <div className="flex justify-between gap-2 xl:grid xl:grid-cols-3 text-body opacity-70">
        <a href="#" className="hover:opacity-100">
          Instagram ↗
        </a>
        <a href="#" className="hover:opacity-100">
          Are.na ↗
        </a>
        <a href="#" className="hover:opacity-100">
          LinkedIn ↗
        </a>
      </div>
    </article>
  );
}
