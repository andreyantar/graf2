"use client";

import { useEffect, useRef, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import { HERO_IMAGE_URLS } from "@/lib/hero-images";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

const MIN_VISIBLE_MS = 800; // floor — avoid flash on fast networks
const MAX_VISIBLE_MS = 8000; // ceiling — never block the page
const LOGO_HOLD_MS = 450;
const MORPH_MS = 900;
const MORPH_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const SESSION_KEY = "sg-preloader-seen";

type Phase = "loading" | "logo" | "morph" | "done";

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
  const logoWrapRef = useRef<HTMLDivElement>(null);
  // First-render guards. If the user has seen the preloader this
  // session, or prefers reduced motion, we skip all phases and call
  // onDone on mount — but render nothing this pass so React doesn't
  // flash the loading frame.
  const skipRef = useRef(false);
  if (typeof window !== "undefined" && !skipRef.current) {
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
      skipRef.current = true;
    }
  }

  useEffect(() => {
    if (skipRef.current) {
      onDone();
      return;
    }
  }, [onDone]);

  // Real progress: image decode + document.readyState.
  // Loaded image share contributes 0..0.85, readyState='complete'
  // adds 0.15. Both → 1.0.
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
      // Progress never exceeds the time floor — keeps the bar moving
      // visibly even if the network resolves before MIN_VISIBLE_MS.
      const shown = Math.min(real, timeFloor);
      setProgress(Math.round(shown * 100));
      if (real >= 1 && elapsed >= MIN_VISIBLE_MS) {
        setProgress(100);
        setPhase("logo");
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
      setPhase("logo");
    }, MAX_VISIBLE_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(ceiling);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (phase !== "logo") return;
    const id = window.setTimeout(() => setPhase("morph"), LOGO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "morph") return;
    const overlay = overlayRef.current;
    const logoWrap = logoWrapRef.current;
    const target = document.querySelector<HTMLElement>("[data-hero-badge]");
    if (!overlay || !logoWrap || !target) {
      setPhase("done");
      return;
    }
    const r = target.getBoundingClientRect();
    // Honour reduced-motion: snap to final state, no morph.
    const reduce = prefersReducedMotion();
    const dur = reduce ? 0 : MORPH_MS;
    requestAnimationFrame(() => {
      if (!reduce) {
        overlay.style.transition = `all ${dur}ms ${MORPH_EASE}`;
        logoWrap.style.transition = `transform ${dur}ms ${MORPH_EASE}`;
      }
      overlay.style.top = `${r.top}px`;
      overlay.style.left = `${r.left}px`;
      overlay.style.width = `${r.width}px`;
      overlay.style.height = `${r.height}px`;
      overlay.style.borderRadius = `${r.height / 2}px`;
      logoWrap.style.transform = "scale(1)";
    });
    const timer = window.setTimeout(() => setPhase("done"), dur + 50);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage may be unavailable (private mode / disabled cookies);
      // not fatal — the preloader simply re-runs next visit.
    }
    onDone();
  }, [phase, onDone]);

  if (skipRef.current || phase === "done") return null;

  const showLogo = phase === "logo" || phase === "morph";
  const initialScale = 6;

  return (
    <div
      ref={overlayRef}
      data-preloader-overlay
      className="fixed z-[100] flex items-center justify-center bg-[var(--frame)] text-[var(--color-ink)] overflow-hidden"
      style={{
        top: 0,
        left: 0,
        width: "100vw",
        height: "100svh",
        borderRadius: 0,
      }}
      aria-hidden={phase !== "loading"}
    >
      {showLogo ? (
        <div
          ref={logoWrapRef}
          style={{
            transform: `scale(${initialScale})`,
            transformOrigin: "center",
          }}
        >
          <SiteLogo className="h-[1rem] w-auto" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="preloader-spinner" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} style={{ ["--i" as never]: i }} />
            ))}
          </div>
          <div className="font-archivo text-body opacity-80 tabular-nums">
            loading… {progress}%
          </div>
        </div>
      )}
    </div>
  );
}
