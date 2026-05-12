"use client";

import Link from "next/link";
import { useScroll } from "motion/react";
import { useEffect, useRef } from "react";
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
  column?: "left" | "right";
};

export function BlogCard({ post, column = "left" }: Props) {
  const cardRef = useRef<HTMLElement>(null);

  // Window-scroll based — no container prop. Page scrolls natively here.
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (prefersReducedMotion()) return;

    const colSign = column === "right" ? 1 : -1;
    const rotFlip = FLIP_ROTATION ? -1 : 1;

    const apply = (p: number) => {
      const env = envelope(p, DEAD_HALF);
      const verticalSign = p < 0.5 ? -1 : 1;
      const x = env * MAX_X * colSign;
      const rot = verticalSign * env * MAX_ROT * colSign * rotFlip;
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
              src={coverUrl}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="block w-full h-full object-cover"
            />
          </div>
        )}
        <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7">
          <p className="font-mono text-mono uppercase tracking-widest opacity-50 mb-3">
            {date}
          </p>
          <h3 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-2 group-hover:opacity-80 transition-opacity">
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
