"use client";

import gsap from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MenuPanel, type NavKey } from "@/components/menu-panel";
import { SiteLogo } from "@/components/site-logo";
import { FloatingCTA } from "@/components/floating-cta";
import { StageScrollContext } from "@/components/stage-scroll-context";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

// Where each menu item points from a subpage. The homepage reads the
// hash on first paint and scrolls to the matching section (see the
// hash-based deep-link effect in home-client.tsx), so `/#work` etc.
// land on the right section after navigating home.
const NAV_HREF: Record<NavKey, string> = {
  home: "/",
  work: "/#work",
  services: "/#services",
  blog: "/blog",
  contact: "/#contact",
};

/**
 * Layout chrome for standard-scroll subpages (e.g. /work/[slug]).
 *
 * Replicates the homepage's "stage" architecture so the menu opens with
 * the exact same motion: the page content lives inside a viewport-tall
 * stage with its own internal scroll, and opening the menu scales the
 * stage down, rounds its corners, and slides it left — leaving room for
 * the slide-in MenuPanel. (On the homepage this lives in home-client.tsx;
 * the GSAP tween below is a 1:1 copy so the two pages match.)
 *
 * Structure:
 *   MenuPanel                       (slides in from the right)
 *   toggle button                   (OUTSIDE the stage — never scaled)
 *   stage (scaled by GSAP)
 *     ├ logo                        (fixed, inside stage)
 *     ├ FloatingCTA                 (fixed; stage's transform makes it
 *     │                              the containing block, so it tracks
 *     │                              the stage on menu-open)
 *     └ scroll container (children) (inert while menu is open)
 */
export function SiteHeader({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!stageRef.current) return;
    if (typeof window === "undefined") return;

    const STAGE_SCALE_X = 0.85;
    const RIGHT_GAP_PX = 12; // visible gap between stage's right edge and menu
    const verticalMarginPx = 32; // 2rem

    // Mirror MenuPanel's responsive widths: w-[50vw] / min-[541px]:w-[33vw] / md:w-[280px].
    const menuWidthPx = (vw: number) => {
      if (vw >= 768) return 280;
      if (vw >= 541) return vw * 0.33;
      return vw * 0.5;
    };

    // Push the stage left so its right edge — after scaling — lands a
    // few pixels left of the menu's left edge.
    //   xPx = vw*(0.5 − scaleX/2) − menuW − gap
    const targetXPx = (vw: number) =>
      vw * (0.5 - STAGE_SCALE_X / 2) - menuWidthPx(vw) - RIGHT_GAP_PX;

    const tween = () => {
      const vw = window.innerWidth;
      const scaleY =
        (window.innerHeight - 2 * verticalMarginPx) / window.innerHeight;
      const tweenDuration = prefersReducedMotion() ? 0 : 0.85;
      gsap.to(stageRef.current, {
        scaleX: menuOpen ? STAGE_SCALE_X : 1,
        scaleY: menuOpen ? scaleY : 1,
        x: menuOpen ? targetXPx(vw) : 0,
        borderRadius: menuOpen ? "22px" : "0px",
        duration: tweenDuration,
        ease: "expo.inOut",
        overwrite: "auto",
      });
    };

    tween();

    if (!menuOpen) return;
    const onResize = () => tween();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <>
      <MenuPanel
        open={menuOpen}
        onNavigate={(key) => {
          setMenuOpen(false);
          router.push(NAV_HREF[key]);
        }}
      />

      {/* Toggle button stays at the viewport corner, never inside the
          transformed stage — otherwise it shrinks with the page. */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed top-4 right-6 md:right-10 z-50 mix-blend-difference text-white text-body flex items-center gap-2 cursor-pointer min-h-[44px] min-w-[44px] justify-end"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        <span aria-hidden>{menuOpen ? "✕" : "☰"}</span>
      </button>

      <div
        ref={stageRef}
        style={{ transformOrigin: "center center", willChange: "transform" }}
        className="relative z-10 h-svh w-full overflow-hidden bg-paper"
        onClick={() => menuOpen && setMenuOpen(false)}
      >
        <Link
          href="/"
          aria-label="Studio Graffiti — home"
          className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white flex items-center min-h-[44px]"
        >
          <SiteLogo className="h-[18px] w-auto" />
        </Link>

        {/* Floating CTA mounted INSIDE the stage so the transformed
            stage becomes its containing block for position:fixed — it
            tracks the stage when the menu scales + slides it. */}
        <FloatingCTA />

        <div
          ref={scrollRef}
          className="relative z-10 h-svh overflow-y-auto overscroll-none"
          style={{ overflowAnchor: "none" }}
          inert={menuOpen}
        >
          <StageScrollContext.Provider value={scrollRef}>
            {children}
          </StageScrollContext.Provider>
        </div>
      </div>
    </>
  );
}
