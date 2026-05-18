"use client";

import { useEffect, useRef, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import { HERO_IMAGE_URLS } from "@/lib/hero-images";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

const MIN_VISIBLE_MS = 800; // floor — avoid flash on fast networks
const MAX_VISIBLE_MS = 8000; // ceiling — never block the page
const LOGO_HOLD_MS = 350;
const MORPH_MS = 900;
const MORPH_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const SESSION_KEY = "sg-preloader-seen";
const INITIAL_SCALE = 6;

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
  const panelRef = useRef<HTMLDivElement>(null);

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
      // Progress never exceeds the time floor — keeps the counter
      // moving visibly even if the network resolves before MIN_VISIBLE_MS.
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

  // Logo phase: brief hold before morph kicks in.
  useEffect(() => {
    if (phase !== "logo") return;
    const id = window.setTimeout(() => setPhase("morph"), LOGO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Morph phase: panel animates from screen-centre / scale(6) to the
  // hero badge's exact rect / scale(1). Border-radius is pill-shaped
  // throughout (rounded-full = 9999px → always pill regardless of
  // current box height), so the panel never reads as a sharp rectangle
  // mid-flight. Overlay opacity fades to 0 in parallel so the live
  // Hero page underneath fades in cleanly.
  useEffect(() => {
    if (phase !== "morph") return;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const target = document.querySelector<HTMLElement>("[data-hero-badge]");
    if (!overlay || !panel || !target) {
      setPhase("done");
      return;
    }
    const rect = target.getBoundingClientRect();
    const dur = prefersReducedMotion() ? 0 : MORPH_MS;
    requestAnimationFrame(() => {
      if (dur > 0) {
        panel.style.transition = `top ${dur}ms ${MORPH_EASE}, left ${dur}ms ${MORPH_EASE}, transform ${dur}ms ${MORPH_EASE}`;
        overlay.style.transition = `opacity ${dur}ms ${MORPH_EASE}`;
      }
      panel.style.top = `${rect.top}px`;
      panel.style.left = `${rect.left}px`;
      // Both transforms keep the same function list (translate + scale)
      // so the interpolation between them is well-defined in every browser.
      panel.style.transform = "translate(0, 0) scale(1)";
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

  const showPanel = phase === "logo" || phase === "morph";

  return (
    <div
      ref={overlayRef}
      data-preloader-overlay
      className="fixed inset-0 z-[100] bg-[var(--frame)] text-[var(--color-ink)]"
      style={{ width: "100vw", height: "100svh" }}
      aria-hidden={phase !== "loading"}
    >
      {/* Loading phase: SVG goo-blob spinner centred, progress text
          near the bottom. Vector — feGaussianBlur stdDeviation 8 +
          feColorMatrix alpha-sharpen fuse the 8 orbiting circles
          into a single morphing liquid shape. */}
      {phase === "loading" && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="preloader-spinner"
              viewBox="0 0 200 200"
              aria-hidden
            >
              <defs>
                <filter
                  id="preloader-goo"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                  <feColorMatrix
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 20 -10"
                  />
                </filter>
              </defs>
              <g filter="url(#preloader-goo)">
                {Array.from({ length: 8 }).map((_, i) => (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r="10"
                    fill="#070707"
                    style={{ ["--i" as never]: i } as React.CSSProperties}
                  />
                ))}
              </g>
            </svg>
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
        </>
      )}

      {/* Logo phase + morph: a pill-shaped panel mirroring the hero
          badge's intrinsic structure. Starts at viewport centre scaled
          ×6, animates to the badge's exact rect at scale 1. rounded-full
          keeps the corners pill the entire flight. */}
      {showPanel && (
        <div
          ref={panelRef}
          className="fixed inline-flex items-center bg-[var(--frame)] text-[var(--color-ink)] rounded-full"
          style={{
            top: "50%",
            left: "50%",
            paddingTop: "max(0.31vw, 5px)",
            paddingBottom: "max(0.31vw, 5px)",
            paddingLeft: "max(0.88vw, 14px)",
            paddingRight: "max(0.62vw, 10px)",
            transform: `translate(-50%, -50%) scale(${INITIAL_SCALE})`,
            transformOrigin: "center",
            willChange: "transform, top, left",
          }}
        >
          <SiteLogo className="h-[1rem] w-auto" />
        </div>
      )}
    </div>
  );
}
