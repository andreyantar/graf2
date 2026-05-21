"use client";

import { useEffect, useRef, useState } from "react";
import { Orb } from "@/components/orb";
import { HERO_IMAGE_URLS } from "@/lib/hero-images";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

// Responsive — slightly bigger than the hero badge so it reads as
// the focal element during loading, but still scales with viewport.
const LOADING_ORB_SIZE = "clamp(42px, 4.8vw, 90px)";

const MIN_VISIBLE_MS = 800; // floor — avoid flash on fast networks
const MAX_VISIBLE_MS = 8000; // ceiling — never block the page
const FADE_MS = 600;
const FADE_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const SESSION_KEY = "sg-preloader-seen";

type Phase = "loading" | "fading" | "done";

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Session skip — if the user already saw the preloader this session,
  // bail out before any render so React doesn't flash a loading frame.
  const skipRef = useRef(false);
  if (typeof window !== "undefined" && !skipRef.current) {
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
      skipRef.current = true;
    }
  }

  useEffect(() => {
    if (skipRef.current) onDone();
  }, [onDone]);

  // Real progress: image decode share + document.readyState.
  useEffect(() => {
    if (skipRef.current) return;
    const start = Date.now();
    let loaded = 0;
    const total = Math.max(1, HERO_IMAGE_URLS.length);
    let docComplete = document.readyState === "complete";

    const recompute = () => {
      const imgShare = (loaded / total) * 0.85;
      const docShare = docComplete ? 0.15 : 0;
      const real = imgShare + docShare; // 0..1
      const elapsed = Date.now() - start;
      const timeFloor = Math.min(1, elapsed / MIN_VISIBLE_MS);
      const shown = Math.min(real, timeFloor);
      setProgress(Math.round(shown * 100));
      if (real >= 1 && elapsed >= MIN_VISIBLE_MS) {
        setProgress(100);
        setPhase("fading");
        return true;
      }
      return false;
    };

    for (const src of HERO_IMAGE_URLS) {
      preloadImage(src).then(() => {
        loaded += 1;
        recompute();
      });
    }

    const onLoad = () => {
      docComplete = true;
      recompute();
    };
    if (!docComplete) window.addEventListener("load", onLoad, { once: true });

    const interval = window.setInterval(() => {
      if (recompute()) window.clearInterval(interval);
    }, 60);

    const ceiling = window.setTimeout(() => {
      setProgress(100);
      setPhase("fading");
    }, MAX_VISIBLE_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(ceiling);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  // Fading phase: overlay (and the orb + text inside it, as children)
  // fade to opacity 0 in place. No position / scale animation — the
  // page underneath simply appears at the same speed as the overlay
  // dissolves, and the hero's own orb takes over at its natural spot.
  useEffect(() => {
    if (phase !== "fading") return;
    const overlay = overlayRef.current;
    if (!overlay) {
      setPhase("done");
      return;
    }
    const dur = prefersReducedMotion() ? 0 : FADE_MS;
    requestAnimationFrame(() => {
      if (dur > 0) {
        overlay.style.transition = `opacity ${dur}ms ${FADE_EASE}`;
      }
      overlay.style.opacity = "0";
    });
    const timer = window.setTimeout(() => setPhase("done"), dur + 50);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Done — flag the session and tell the host to unmount us.
  useEffect(() => {
    if (phase !== "done") return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage may be unavailable (private mode / disabled cookies);
      // not fatal — the preloader will simply re-run on next visit.
    }
    onDone();
  }, [phase, onDone]);

  if (skipRef.current || phase === "done") return null;

  return (
    <div
      ref={overlayRef}
      data-preloader-overlay
      className="fixed inset-0 z-[100] bg-[var(--frame)] text-[var(--color-ink)]"
      style={{ height: "100svh" }}
      aria-hidden={phase !== "loading"}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Orb size={LOADING_ORB_SIZE} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 font-archivo tabular-nums whitespace-nowrap"
        style={{
          // 3rem on desktop, less on mobile — sized in vh so the
          // gap scales with viewport height. Clamp floors it at
          // 1.5rem on tiny phones and caps at 3rem on large desks.
          bottom: "clamp(1.5rem, 4vh, 3rem)",
          color: "#070707",
          fontSize: "0.8rem",
          fontVariationSettings: '"wdth" 125, "wght" 450',
          lineHeight: "125%",
        }}
      >
        loading…{progress}%
      </div>
    </div>
  );
}
