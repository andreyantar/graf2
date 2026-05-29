"use client";

import Link from "next/link";
import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import type { CaseData } from "@/components/case-card";
import { useStageScrollRef } from "@/components/stage-scroll-context";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import "swiper/css";

type Props = {
  cases: CaseData[];
};

/**
 * Single-row, infinitely looped marquee of case cards (continuous
 * linear auto-scroll). Horizontal motion comes from Swiper's autoplay;
 * hovering pauses, dragging is allowed.
 *
 * The card images carry the SAME scroll-driven zoom as the homepage
 * CaseCard — scale 1.3 (section entering from the viewport bottom) →
 * 1.0 (exiting at the top) — so the whole site shares one image
 * behaviour: images react to scroll, never to hover. Since every card
 * sits in the same vertical band of a horizontal marquee, one shared
 * section progress drives all of them (published via a CSS var the
 * slides — including Swiper's loop clones — inherit).
 *
 * On subpages the page scrolls inside SiteHeader's stage container, so
 * we read that container from context rather than tracking the window.
 */
export function CaseCarousel({ cases }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageScrollRef = useStageScrollRef();
  const container = (stageScrollRef ?? undefined) as
    | RefObject<HTMLElement>
    | undefined;

  const { scrollYProgress } = useScroll({
    target: rootRef,
    container,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const apply = (p: number) => {
      root.style.setProperty("--card-img-scale", String(1.3 - 0.3 * p));
    };
    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [scrollYProgress]);

  if (cases.length === 0) return null;

  return (
    <div ref={rootRef}>
      <Swiper
        modules={[Autoplay, FreeMode]}
        slidesPerView="auto"
        spaceBetween={24}
        loop
        loopAdditionalSlides={cases.length}
        freeMode
        allowTouchMove
        speed={6000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        // Linear timing turns the per-slide tween into a constant-speed
        // conveyor instead of an ease that visibly stutters every slide.
        onSwiper={(swiper) => {
          swiper.wrapperEl.style.transitionTimingFunction = "linear";
        }}
        className="!overflow-visible"
      >
        {cases.map((c) => (
          <SwiperSlide
            key={c.href}
            className="!w-[300px] sm:!w-[360px] !h-auto"
          >
            <article className="h-full flex flex-col bg-paper text-ink shadow-card overflow-hidden rounded-[16px]">
              <Link href={c.href} className="group flex flex-col h-full">
                <div className="relative h-[220px] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.title}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    style={{ transform: "scale(var(--card-img-scale, 1))" }}
                    className="block w-full h-full object-cover will-change-transform"
                  />
                </div>
                <div className="px-6 pb-6 pt-6 flex flex-col flex-1">
                  <h3 className="font-archivo text-card-h3 tracking-[-0.02em] leading-[1.1] mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity">
                    {c.title}
                  </h3>
                  <p className="text-body leading-snug opacity-80 mb-4 line-clamp-3">
                    {c.desc}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-body group-hover:opacity-60 transition-opacity">
                    View case →
                  </span>
                </div>
              </Link>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
