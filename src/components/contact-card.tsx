"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";
import { useStageScrollRef } from "@/components/stage-scroll-context";

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

  // On the homepage the snap-scroll container is passed explicitly; on
  // subpages the card is rendered inside SiteHeader's stage, whose
  // internal scroll container we pick up from context.
  const stageScrollRef = useStageScrollRef();
  const container = (scrollContainerRef ?? stageScrollRef) as
    | RefObject<HTMLElement>
    | undefined;

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container,
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
      <p className="text-body leading-relaxed opacity-90 mb-4">
        We respond within 24 hours. No agency forms, no qualification calls —
        just a quick chat.
      </p>

      {/* Dock slot for the sticky CTA. This is a *real* in-flow button:
          while the card is below the viewport the floating `fixed`
          pill (<FloatingCTA/>) is the visible CTA; the instant the
          card docks at the sticky line, FloatingCTA hides the pill and
          reveals this one. Because this button lives in the normal
          scroll flow it's moved by the compositor along with the page
          — no per-frame JS positioning, so it can't jitter on fast
          scroll the way a JS-tracked `fixed` element does. Starts
          hidden + non-focusable; FloatingCTA toggles it on dock. */}
      <a
        data-cta-slot
        href="https://t.me/YuraShavrov"
        target="_blank"
        rel="noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        className="relative flex w-full items-center justify-center overflow-hidden whitespace-nowrap"
        style={{
          height: "56px",
          borderRadius: "1.25rem",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <span
          aria-hidden
          className="contact-orb-bg"
          style={{ borderRadius: "inherit" }}
        >
          <span className="contact-orb-bg__disc contact-orb-bg__disc--green" />
          <span className="contact-orb-bg__disc contact-orb-bg__disc--blue" />
        </span>
        <span
          style={{
            fontVariationSettings: '"wdth" 125, "wght" 800',
            color: "#ffffff",
          }}
          className="relative font-archivo text-body leading-[1.1] tracking-[-0.02em]"
        >
          Start a project →
        </span>
      </a>

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
