"use client";

import { useEffect, useRef } from "react";

export type Palette = { bg: string };

type Props = {
  index: number;
  palette: Palette;
  /** Massive word painted edge-to-edge as the section background. */
  bgWord: string;
  /** Render bg word as outline only via -webkit-text-stroke. */
  outlined?: boolean;
  children?: React.ReactNode;
};

export function SectionColor({
  index,
  palette,
  bgWord,
  outlined = false,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty("--bg", palette.bg);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.55) apply();
        }
      },
      { threshold: [0.55, 0.8] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [palette]);

  return (
    <section
      ref={ref}
      data-section-index={index}
      className="relative h-svh snap-start flex items-center justify-center px-6 md:px-10 overflow-hidden"
    >
      {/* Massive background word — fills the viewport */}
      <span
        aria-hidden
        className={[
          "pointer-events-none select-none absolute inset-0 flex items-center justify-center",
          "font-archivo whitespace-nowrap leading-[0.78] tracking-[-0.06em]",
          "text-[clamp(7rem,28vw,22rem)]",
          outlined
            ? "text-transparent [-webkit-text-stroke:2px_currentColor] md:[-webkit-text-stroke:4px_currentColor]"
            : "",
        ].join(" ")}
      >
        {bgWord}
      </span>

      {/* Floating white content card */}
      {children && (
        <div className="relative z-10 w-full max-w-[360px] scale-[0.85] md:scale-[0.95]">
          <div className="rounded-[20px] bg-white text-[#121212] p-6 md:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] text-body-lg leading-snug font-medium whitespace-pre-wrap text-pretty">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
