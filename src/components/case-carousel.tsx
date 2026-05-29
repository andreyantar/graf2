"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import type { CaseData } from "@/components/case-card";
import "swiper/css";

type Props = {
  cases: CaseData[];
};

/**
 * Single-row, infinitely looped marquee of case cards (continuous
 * linear auto-scroll). Unlike the homepage CaseCard — which animates
 * a scroll-driven arc inside a custom snap container — these cards are
 * static; the motion comes entirely from Swiper's autoplay. Hovering
 * pauses; dragging is allowed.
 */
export function CaseCarousel({ cases }: Props) {
  if (cases.length === 0) return null;

  return (
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
                  className="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
  );
}
