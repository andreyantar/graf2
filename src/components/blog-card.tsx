"use client";

import Link from "next/link";
import { useScroll } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { envelope } from "@/lib/scroll-envelope";
import { urlFor } from "@/sanity/image";
import type { PostSummary } from "@/sanity/queries";

// Same tunables as CaseCard so the two card types feel like one family.
const DEAD_HALF = 0.3;
const MAX_X = 60;
const MAX_ROT = 3;
const FLIP_ROTATION = false;
const MAX_RADIUS = 32;
const RADIUS_DEAD_HALF = 0.1;

type Props = {
  post: PostSummary;
  /** "center" disables the outward translate + tilt, leaving only the
   *  border-radius envelope. Used for the middle column in 3-card rows. */
  column?: "left" | "right" | "center";
  /** Optional custom scroll container. If omitted, useScroll uses
   *  the window — used on /blog where the page scrolls natively. On
   *  the home page we pass the looped scroll-container ref. */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Position in the row (0 = first). On ≤767px every card past the
   *  first stays static so the mobile stack reads as a calm list. */
  cardIndex?: number;
};

export function BlogCard({
  post,
  column = "left",
  scrollContainerRef,
  cardIndex = 0,
}: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [mobileSkip, setMobileSkip] = useState(false);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef as RefObject<HTMLElement> | undefined,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    if (cardIndex === 0) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobileSkip(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [cardIndex]);

  useEffect(() => {
    const card = cardRef.current;
    const img = imgRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;
    if (mobileSkip) {
      card.style.transform = "";
      card.style.setProperty("--card-radius", "0px");
      if (img) img.style.transform = "";
      return;
    }

    const isCenter = column === "center";
    const colSign = column === "right" ? 1 : -1; // unused when center
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
      // Scroll-driven image zoom — linear 1.3 → 1.0 across the card's
      // bottom-to-top traversal of the viewport.
      if (img) img.style.transform = `scale(${1.3 - 0.3 * p})`;
    };

    apply(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", apply);
    return () => {
      unsub();
    };
  }, [column, mobileSkip, scrollYProgress]);

  const coverUrl = post.cover
    ? urlFor(post.cover).width(880).fit("max").auto("format").url()
    : null;

  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article
      ref={cardRef}
      className="w-full max-w-[600px] bg-paper text-ink shadow-card overflow-hidden will-change-transform rounded-[var(--card-radius,0px)] [contain:paint]"
    >
      <Link href={`/blog/${post.slug}`} className="group block">
        {coverUrl && (
          <div className="relative h-[280px] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={coverUrl}
              alt={post.title}
              draggable={false}
              loading="lazy"
              decoding="async"
              className="block w-full h-full object-cover will-change-transform"
            />
          </div>
        )}
        <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7">
          <p className="text-body opacity-50 mb-3">
            {date}
          </p>
          <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-[1.1] mb-2 group-hover:opacity-80 transition-opacity">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-body leading-snug opacity-80 mb-4 line-clamp-3">
              {post.excerpt}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-body group-hover:opacity-60 transition-opacity">
            Read article →
          </span>
        </div>
      </Link>
    </article>
  );
}
