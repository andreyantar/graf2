"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import manifest from "@/data/artworks.json";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

type Artwork = { url: string; width: number; height: number };

// Different slice than the canvas planes so the two layers don't echo
const TRAIL_URLS: string[] = (manifest as Artwork[])
  .slice(40, 80)
  .map((m) => m.url);

const IMAGE_WIDTH_PX = 220;
/** Hard floor on time between two spawns — prevents bursty multi-image clusters
 * when the cursor flies across the screen. Together with the distance gate this
 * gives a steady one-at-a-time stream instead of "burst, pause, burst". */
const MIN_INTERVAL_MS = 520;

type Props = { disabled?: boolean };

export function MouseTrail({ disabled = false }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    if (!layerRef.current) return;
    // Reduced-motion: no decorative trail at all.
    if (prefersReducedMotion()) return;
    const layer: HTMLDivElement = layerRef.current;

    let imgIndex = 0;
    let lastX = 0;
    let lastY = 0;
    let cursorInHero = false;

    function isOverHero(clientX: number, clientY: number): boolean {
      const heroes = document.querySelectorAll<HTMLElement>(
        'section[data-hero="true"]',
      );
      for (const sec of heroes) {
        const r = sec.getBoundingClientRect();
        if (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom
        ) {
          return true;
        }
      }
      return false;
    }

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      cursorInHero = isOverHero(e.clientX, e.clientY);
    };

    // Steady drip: fires at MIN_INTERVAL_MS regardless of movement, so a
    // resting cursor still keeps the stream alive (random rotation/offset
    // in the entry tween scatters successive spawns visually).
    const drip = window.setInterval(() => {
      if (disabledRef.current || !cursorInHero) return;
      spawn(lastX, lastY);
    }, MIN_INTERVAL_MS);

    const spawn = (x: number, y: number) => {
      const img = document.createElement("img");
      img.decoding = "async";
      img.loading = "lazy";
      img.src = TRAIL_URLS[imgIndex];
      img.draggable = false;
      img.style.position = "absolute";
      img.style.top = "0";
      img.style.left = "0";
      img.style.width = `${IMAGE_WIDTH_PX}px`;
      img.style.height = "auto";
      img.style.pointerEvents = "none";
      img.style.userSelect = "none";
      img.style.willChange = "transform";
      layer.appendChild(img);

      const tl = gsap.timeline({
        onComplete: () => {
          if (img.parentNode === layer) layer.removeChild(img);
          tl.kill();
        },
      });

      // Entry: smooth ease-out, no spring.
      tl.fromTo(
        img,
        {
          x,
          y,
          yPercent: -50 + (Math.random() - 0.5) * 10,
          xPercent: -50 + (Math.random() - 0.5) * 80,
          rotation: (Math.random() - 0.5) * 20,
          scaleX: 1.1,
          scaleY: 1.1,
          opacity: 0,
          borderRadius: "0px",
        },
        {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ease: "power2.out",
          duration: 0.35,
        },
      );

      // Exit: 1.5s soft fade. Radius stays 0 for the first 1.0s of the exit
      // and only animates to 1rem during the final 0.5s — so when total exit
      // time hits 1.5s the image is gone and corners are fully rounded.
      tl.to(
        img,
        {
          opacity: 0,
          duration: 1.5,
          ease: "none",
        },
        "+=0.75",
      );
      tl.to(
        img,
        {
          borderRadius: "16px",
          duration: 0.5,
          ease: "power2.in",
        },
        "-=0.5",
      );

      imgIndex = (imgIndex + 1) % TRAIL_URLS.length;
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.clearInterval(drip);
      gsap.killTweensOf(layer.children);
      while (layer.firstChild) layer.removeChild(layer.firstChild);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[25] overflow-hidden"
    />
  );
}
