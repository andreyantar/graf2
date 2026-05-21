"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue } from "motion/react";
import type { WordSpec } from "@/components/goo-backdrop";
import gsap from "gsap";
import { BlogCard } from "@/components/blog-card";
import { CaseCard } from "@/components/case-card";
import { ContactCard } from "@/components/contact-card";
// HeroTitle is the previous hero (Lottie + headline). Kept in the
// repo for quick rollback while the gallery hero is in client review.
// import { HeroTitle } from "@/components/hero-title";
import { HeroGallery } from "@/components/hero-gallery";
import { SiteLogo } from "@/components/site-logo";
import { ProcessStack } from "@/components/process-stack";
import { ServiceCard } from "@/components/service-card";
import { GooBackdrop } from "@/components/goo-backdrop";
import { MenuPanel } from "@/components/menu-panel";
import { FloatingCTA } from "@/components/floating-cta";
import { Preloader } from "@/components/preloader";
// MouseTrail (hover-spawn canvases on hero) disabled per client v2 spec.
// Component file kept in repo for quick rollback.
// import { MouseTrail } from "@/components/mouse-trail";
import { SnapSection, type Palette } from "@/components/snap-section";
import manifest from "@/data/artworks.json";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";
import type { PostSummary } from "@/sanity/queries";

const ART_URLS: string[] = (manifest as Array<{ url: string }>).map((m) => m.url);

const selectedCases = [
  {
    n: "01",
    title: "Volta",
    desc: "Brand identity and packaging system for an independent battery startup. Four years of work across hardware, voice, and retail surfaces.",
    href: "/work/volta",
    img: "/cases/case_mabudo.png",
  },
  {
    n: "02",
    title: "Lighthouse",
    desc: "Digital archive for a regional maritime museum. One editorial system from a single object up to a 19th-century expedition.",
    href: "/work/lighthouse",
    img: "/cases/case_sora.png",
  },
  {
    n: "03",
    title: "Modal",
    desc: "Product design for a privacy-first chat application. Identity, interface, and onboarding shipped with a small distributed team.",
    href: "/work/modal",
    img: "/cases/case_tripple_a.png",
  },
  {
    n: "04",
    title: "Halftone",
    desc: "Editorial system and digital archive for a small independent print magazine. Long-form layout, archive search, and a quiet subscription flow.",
    href: "/work/halftone",
    img: "/cases/case_zen.png",
  },
];

const whitePalette: Palette = { bg: "#ffffff" };

const SELECTED_WORK_INDEX = 1;
const WHAT_WE_DO_INDEX = 2;
const PROCESS_INDEX = 3;
const BLOG_INDEX = 4;
const CONTACT_INDEX = 5;

const services = [
  {
    title: "Brand",
    desc: "Identity, naming, brand systems.",
    href: "/services/brand",
    img: "/wedo/branding.png",
  },
  {
    title: "Web",
    desc: "Framer websites, landing pages, UI design.",
    href: "/services/web",
    img: "/wedo/web.png",
  },
  {
    title: "Digital & AI",
    desc: "AI visuals, content direction, campaigns.",
    href: "/services/ai",
    img: "/wedo/digital+ai.png",
  },
];

const sections: Array<{
  word: string;
  body: React.ReactNode | null;
  bare?: boolean;
}> = [
  {
    // Hero v2 has its own gallery layout — no goo backdrop word.
    word: "",
    bare: true,
    body: null,
  },
  {
    word: "Selected\nwork",
    bare: true,
    // Body is rendered inline in the JSX below so each CaseCard can subscribe
    // to scroll progress against the actual scroll container ref.
    body: null,
  },
  {
    word: "What we do",
    bare: true,
    body: null,
  },
  {
    word: "How we work",
    bare: true,
    // Rendered inline below (ProcessStack needs scrollContainerRef).
    body: null,
  },
  {
    word: "Journal",
    bare: true,
    // Body is rendered inline below so BlogCard can subscribe to scroll.
    body: null,
  },
  {
    word: "Have a brand worth building?",
    bare: true,
    // Body rendered inline below — needs scrollContainerRef for the
    // radius envelope.
    body: null,
  },
];

// Menu navigation: indices map to the sections array above.
// Section 3 (Process) intentionally has no menu item.
const NAV_INDICES = {
  home: 0,
  work: 1,
  services: 2,
  blog: 4,
  contact: 5,
} as const;

type HomeProps = {
  latestPosts: PostSummary[];
};

export default function Home({ latestPosts }: HomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  useEffect(() => {
    // Pre-hydration inline script in layout.tsx flips this attribute
    // when the session flag is present. Unmount the Preloader on
    // mount in that case so it never runs its phases on repeat visits.
    if (document.documentElement.hasAttribute("data-preloader-seen")) {
      setPreloaderDone(true);
    }
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Local 0..1 progress within a single loop block. The goo backdrop
  // uses this instead of the global scrollYProgress so the teleport
  // wrap at Contact doesn't make scrollYProgress jump by ~0.333 in one
  // frame — which previously dragged every word's plateau across the
  // viewport in a single tick, flashing the whole stack of section
  // labels as one smear. Local progress stays continuous across wraps.
  const gooProgress = useMotionValue(0);
  // Word specs anchored to actual section positions in the DOM.
  // Rebuilt on layout change so each word peaks exactly when its
  // section's cards are centred — not at uniform 1/N intervals, which
  // made the tall Process section flash by while its label barely had
  // time to read. Initial value is the uniform fallback used until the
  // first measurement lands.
  const [gooSpecs, setGooSpecs] = useState<WordSpec[]>(() =>
    sections.map((s, i) => ({
      word: s.word,
      peakCenter: i / Math.max(sections.length - 1, 1),
      plateauHalf: 0.05,
      fadeHalf: 0.12,
    })),
  );

  // Lock body overflow only while the home page is mounted. Subpages
  // (blog, work, services) rely on natural document scroll.
  useEffect(() => {
    document.body.classList.add("home-locked");
    return () => {
      document.body.classList.remove("home-locked");
    };
  }, []);

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
    // few pixels left of the menu's left edge. Without this the menu
    // visually clips the stage's rounded right corners on narrower
    // viewports, which read as "square cut" of an otherwise rounded
    // shape. Formula:
    //   right_edge_after = vw*(0.5 + scaleX/2) + xPx
    //   want right_edge_after = (vw − menuW) − gap
    //   ⇒ xPx = vw*(0.5 − scaleX/2) − menuW − gap
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

    // While the menu is open, recompute on resize so the stage tracks
    // the menu's responsive width (50vw / 33vw / 280px). When closed
    // the tween targets are static (scale 1, x 0) — no need to re-fire.
    if (!menuOpen) return;
    const onResize = () => tween();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  // Triple the sections so the user can wrap from end → start invisibly.
  const looped = [...sections, ...sections, ...sections];

  // Smooth-scroll the inner container to a section in the 3rd copy of
  // the loop. The safe-zone after wrap-Contact is [middle_contact_center,
  // 3rd_contact_center) — i.e. it spans the 3rd copy. Targeting the
  // middle copy means the smooth scroll crosses wrapUp mid-animation,
  // the scroll handler teleports +block, and the user lands on the
  // 3rd-copy Contact (visually the footer) instead of the requested
  // section. Sections aren't all the same height (Process is a tall
  // sticky stack), so we resolve the target by querying the DOM node.
  const scrollToSection = (sectionIndex: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const targetIndex = 2 * sections.length + sectionIndex; // 3rd copy
    const section = el.querySelector<HTMLElement>(
      `[data-section-index="${targetIndex}"]`,
    );
    if (!section) return;
    const sectionRect = section.getBoundingClientRect();
    const containerRect = el.getBoundingClientRect();
    const target = el.scrollTop + sectionRect.top - containerRect.top;
    el.scrollTo({
      top: target,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    setMenuOpen(false);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // The looped sections are rendered three times so the user can
    // scroll past either end without seeing a real edge. The teleport
    // happens at a fixed scroll-distance `block` between identical
    // positions across copies.
    //
    // The seam is anchored *inside the Contact section* rather than at
    // the hero boundary. Contact is static — no goo backdrop animation
    // on this section, no GSAP-driven hero ring, no scroll-driven card
    // arcs — so the instant scrollTop jump is invisible. At the hero
    // boundary the wrap exposed brief misalignments in the hero
    // gallery (three independent ring tweens) every full cycle, which
    // read as a jitter the moment Contact looped back to Hero.
    let block = el.scrollHeight / 3;
    let wrapDown = 2 * block; // fallback before sections are measured
    let wrapUp = block;

    // Use the middle-copy Contact section centre as the "safe spot",
    // its 3rd-copy twin as the lower teleport, and its 1st-copy twin
    // as the upper teleport. recompute() refreshes after any layout
    // change (image load, viewport resize, etc.).
    const recompute = () => {
      block = el.scrollHeight / 3;
      const cH = el.clientHeight;
      const ref = el.querySelector<HTMLElement>(
        // 3rd copy of Contact (looped index 2*sections.length + 5).
        `[data-section-index="${2 * sections.length + 5}"]`,
      );
      if (ref) {
        // Use the scrollTop at which Contact is *visually centred* in
        // the viewport, not the section's centre in scroll coords.
        // The previous formula put wrapDown past the max scrollTop
        // (scrollHeight - clientHeight) on tall sections, which meant
        // the wrap could never fire going down — the page just ran out
        // at the bottom of the 3rd copy.
        const visualCenter =
          ref.offsetTop + ref.offsetHeight / 2 - cH / 2;
        // 3rd-copy Contact sits at the very tail of scrollHeight, so
        // visualCenter can land at or above maxScrollTop. Floating-
        // point in scrollTop means `>= wrapDown` then never fires and
        // the wrap-down breaks while wrap-up keeps working (asymmetric
        // because wrapUp has slack above 0). Clamp wrapDown a few px
        // below maxScrollTop so it's always reachable.
        const maxScrollTop = el.scrollHeight - cH;
        wrapDown = Math.min(visualCenter, maxScrollTop - 4);
        wrapUp = wrapDown - block;
      } else {
        wrapDown = 2 * block;
        wrapUp = block;
      }

      // Build goo word specs anchored to first-copy section positions.
      // For each section: peak = scrollTop where its centre sits in the
      // middle of the viewport; plateau extends across the section's
      // pinned/visible window (so Process keeps its label up while its
      // sticky stack is pinned across ~240vh).
      const FADE_TAIL_VH = 0.35; // 35vh fade margin past the plateau
      const SIDE_MARGIN_VH = 0.3; // 30vh of plateau outside the section
      if (block > 0) {
        const specs: WordSpec[] = sections.map((s, idx) => {
          const section = el.querySelector<HTMLElement>(
            `[data-section-index="${idx}"]`,
          );
          if (!section) {
            return {
              word: s.word,
              peakCenter: idx / Math.max(sections.length - 1, 1),
              plateauHalf: 0.05,
              fadeHalf: 0.12,
            };
          }
          const sectionH = section.offsetHeight;
          const centerPx = section.offsetTop + sectionH / 2 - cH / 2;
          // Plateau half = half the "extra" tall-section pinning time
          // plus a small margin past the section edges. For a 100vh
          // section this is ~30vh; for the 240vh Process it's ~100vh.
          const plateauHalfPx =
            Math.max(0, (sectionH - cH) / 2) + cH * SIDE_MARGIN_VH;
          const fadeHalfPx = plateauHalfPx + cH * FADE_TAIL_VH;
          return {
            word: s.word,
            // Wrap into [0,1) — Hero is at scrollTop 0 in copy 1, so
            // its centerPx can be slightly negative; modulo keeps it
            // consistent with the circular dist in BlobWord.
            peakCenter: ((centerPx % block) + block) % block / block,
            plateauHalf: plateauHalfPx / block,
            fadeHalf: fadeHalfPx / block,
          };
        });
        setGooSpecs(specs);
      }
    };
    recompute();

    // Start the user at the 3rd-copy Hero — this is the only copy that
    // actually renders the 3D gallery (the others are placeholders),
    // and it sits inside the safe zone [wrapUp, wrapDown).
    const hero3 = el.querySelector<HTMLElement>(
      `[data-section-index="${2 * sections.length}"]`,
    );
    el.scrollTop = hero3?.offsetTop ?? 2 * block;

    const onScroll = () => {
      if (el.scrollTop >= wrapDown) el.scrollTop -= block;
      else if (el.scrollTop < wrapUp) el.scrollTop += block;
      // Local progress inside one block. Modulo math means the wrap
      // teleport produces zero change in goo progress → no smear of
      // every section's label flashing in one frame.
      const b = block || 1;
      gooProgress.set((((el.scrollTop % b) + b) % b) / b);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Prime once so the goo aligns with the initial scrollTop set above.
    onScroll();

    const ro = new ResizeObserver(recompute);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Hash-based deep links (used by subpages like /blog when navigating
  // back via the menu): scroll to the matching section on first paint,
  // then strip the hash so refreshes don't re-trigger the jump.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.slice(1);
    if (!raw || !(raw in NAV_INDICES)) return;
    const id = setTimeout(() => {
      const idx = NAV_INDICES[raw as keyof typeof NAV_INDICES];
      const el = scrollRef.current;
      if (!el) return;
      const targetIndex = 2 * sections.length + idx; // 3rd copy = safe zone
      const section = el.querySelector<HTMLElement>(
        `[data-section-index="${targetIndex}"]`,
      );
      if (!section) return;
      const sectionRect = section.getBoundingClientRect();
      const containerRect = el.getBoundingClientRect();
      const top = el.scrollTop + sectionRect.top - containerRect.top;
      el.scrollTo({ top, behavior: "auto" });
      window.history.replaceState(null, "", window.location.pathname);
    }, 80);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {!preloaderDone && <Preloader onDone={() => setPreloaderDone(true)} />}
      <MenuPanel
        open={menuOpen}
        onNavigate={(key) => scrollToSection(NAV_INDICES[key])}
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
        className="relative z-10 h-svh w-full overflow-hidden bg-white"
        onClick={() => menuOpen && setMenuOpen(false)}
      >
        <GooBackdrop specs={gooSpecs} progress={gooProgress} />

        <div className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white pointer-events-none flex items-center min-h-[44px]">
          <SiteLogo className="h-[18px] w-auto" />
        </div>

        {/* Floating CTA mounted INSIDE the stage so CSS makes the
            transformed stage its containing block for position:fixed
            (CSS spec: any ancestor with `transform` flips fixed's
            containing block to that ancestor). When the stage scales
            + translates on menu-open, the button moves with it — no
            more "detached from card" feel, and we don't have to hide
            the primary CTA while the menu is open. */}
        {preloaderDone && <FloatingCTA />}

        <div
          ref={scrollRef}
          data-scroll-container
          className="relative z-10 h-svh overflow-y-auto overscroll-none"
          // Disable Chrome's scroll-anchoring. Motion-driven children
          // (ProcessStack cards translating/scaling, hero gallery ring
          // rotating) shift their visual position every frame; without
          // this, Chrome compensates by nudging scrollTop, which fires
          // extra scroll events, jolts scrollYProgress, and shows up
          // as rapid goo-backdrop word flashing on wide viewports.
          // Safari ignores scroll-anchoring entirely, hence the
          // "Safari OK, Chrome broken" symptom from the client.
          style={{ overflowAnchor: "none" }}
          inert={menuOpen}
        >
          {looped.map((s, i) => {
            const localIdx = i % sections.length;
            const isSelectedWork = localIdx === SELECTED_WORK_INDEX;
            const isWhatWeDo = localIdx === WHAT_WE_DO_INDEX;
            const isHeroIntro = localIdx === 0;
            const isProcess = localIdx === PROCESS_INDEX;
            const isBlog = localIdx === BLOG_INDEX;
            const isContact = localIdx === CONTACT_INDEX;
            return (
              <SnapSection
                key={i}
                index={i}
                palette={whitePalette}
                isHero={localIdx === 0}
                bare={s.bare}
                // Per-section horizontal padding overrides so the
                // section box doesn't fight viewport-scaled card rows:
                //   – WhatWeDo / Journal: 1rem on ≤1023, none on lg+
                //     (card row lands at 90vw lg / 70vw ≥1440)
                //   – Selected work: 1rem on ≤767 (matches WhatWeDo),
                //     default 40px on md+ (desktop rhythm intact)
                xPadding={
                  isWhatWeDo || isBlog
                    ? "px-4 lg:px-0"
                    : isSelectedWork
                    ? "px-4 md:px-10"
                    : undefined
                }
              >
                {isHeroIntro ? (
                  // Render the 3D gallery only in the 3rd copy of the
                  // loop. After wrap-Contact the user only ever sees that
                  // copy of Hero; the 1st/middle copies sit outside the
                  // safe zone [wrapUp, wrapDown). Rendering one ring
                  // instead of three drops the compositor load to a third
                  // and removes the wide-viewport jitter on Chromium.
                  // Other copies render a same-sized placeholder so the
                  // loop block height stays identical across copies.
                  i === 2 * sections.length ? (
                    <HeroGallery />
                  ) : (
                    <div
                      className="relative w-full"
                      style={{ minHeight: "100svh" }}
                      aria-hidden
                    />
                  )
                ) : isSelectedWork ? (
                  <div className="relative w-full md:w-[70vw] max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-4 md:gap-20">
                    {selectedCases.map((c, idx) => (
                      <CaseCard
                        key={`${i}-${c.n}`}
                        data={c}
                        scrollContainerRef={scrollRef}
                        column={idx % 2 === 0 ? "left" : "right"}
                      />
                    ))}
                  </div>
                ) : isWhatWeDo ? (
                  <div className="relative w-full lg:w-[90vw] min-[1440px]:w-[70vw] max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 py-16">
                    {services.map((sv, idx) => (
                      <ServiceCard
                        key={`${i}-${sv.href}`}
                        data={sv}
                        scrollContainerRef={scrollRef}
                        column={
                          idx === 0
                            ? "left"
                            : idx === 1
                            ? "center"
                            : "right"
                        }
                      />
                    ))}
                  </div>
                ) : isProcess ? (
                  <ProcessStack scrollContainerRef={scrollRef} />
                ) : isBlog ? (
                  latestPosts.length > 0 ? (
                    <div className="relative w-full lg:w-[90vw] min-[1440px]:w-[70vw] max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 py-16">
                      {latestPosts.slice(0, 3).map((post, idx) => (
                        <BlogCard
                          key={`${i}-${post._id}`}
                          post={post}
                          column={
                            idx === 0
                              ? "left"
                              : idx === 1
                              ? "center"
                              : "right"
                          }
                          scrollContainerRef={scrollRef}
                          />
                      ))}
                    </div>
                  ) : (
                    <div className="mx-auto max-w-[420px] text-center px-6">
                      <p className="text-body opacity-50">
                        No posts yet.
                      </p>
                    </div>
                  )
                ) : isContact ? (
                  <ContactCard scrollContainerRef={scrollRef} />
                ) : (
                  s.body
                )}
              </SnapSection>
            );
          })}
        </div>
      </div>
    </>
  );
}
