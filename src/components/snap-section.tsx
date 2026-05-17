"use client";

import { useEffect, useRef } from "react";

export type Palette = { bg: string };

type Props = {
  index: number;
  palette: Palette;
  isHero?: boolean;
  /** Skip the default rounded-white card wrap — children render raw. */
  bare?: boolean;
  /** Override the section's horizontal padding class.
   *  Default: "px-6 md:px-10". Sections with viewport-scaled card rows
   *  pass their own (e.g. "px-4 lg:px-0", "px-0 md:px-10") so the
   *  section padding doesn't fight the content width. */
  xPadding?: string;
  children?: React.ReactNode;
};

export function SnapSection({
  index,
  palette,
  isHero,
  bare,
  xPadding = "px-6 md:px-10",
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
          if (e.isIntersecting && e.intersectionRatio > 0.5) apply();
        }
      },
      { threshold: [0.5, 0.75] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [palette]);

  return (
    <section
      ref={ref}
      data-section-index={index}
      data-hero={isHero ? "true" : undefined}
      className={`relative min-h-screen flex items-center justify-center py-24 ${xPadding}`}
    >
      {children &&
        (bare ? (
          children
        ) : (
          <div className="relative w-full max-w-[420px]">
            <div className="rounded-[20px] bg-white text-[#121212] p-6 md:p-7 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] text-body-lg leading-snug font-medium whitespace-pre-wrap text-pretty">
              {children}
            </div>
          </div>
        ))}
    </section>
  );
}
