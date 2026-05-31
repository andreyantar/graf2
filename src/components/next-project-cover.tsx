"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useStageScrollRef } from "@/components/stage-scroll-context";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import { subscribeScrollProgress } from "@/lib/scroll-progress";

/**
 * Full-bleed cover for the "Next project" teaser, carrying the same
 * scroll-driven zoom as the homepage CaseCard and the case carousel:
 * scale 1.2 (block entering from the viewport bottom) → 1.0 (exiting at
 * the top). Images react to scroll across the whole site, never to hover.
 *
 * The (non-transformed) wrapper span is the scroll measurement target;
 * the image inside is the only thing that scales — keeping the transform
 * off the measured element so getBoundingClientRect stays stable.
 *
 * On subpages the page scrolls inside SiteHeader's stage container, read
 * from context rather than the window.
 */
export function NextProjectCover({ src }: { src: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const stageScrollRef = useStageScrollRef();
  const container = (stageScrollRef ?? undefined) as
    | RefObject<HTMLElement>
    | undefined;

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    if (prefersReducedMotion()) return;

    const apply = (p: number) => {
      img.style.transform = `scale(${1.2 - 0.2 * p})`;
    };
    // rAF-sampled progress (see scroll-progress.ts). The wrapper span is
    // the (untransformed) measurement target; the image is what scales.
    return subscribeScrollProgress(wrap, container?.current ?? null, apply);
  }, [container]);

  return (
    <span
      ref={wrapRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="block h-full w-full object-cover opacity-40 will-change-transform"
      />
    </span>
  );
}
