"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
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
    img: ART_URLS[7],
  },
  {
    n: "02",
    title: "Lighthouse",
    desc: "Digital archive for a regional maritime museum. One editorial system from a single object up to a 19th-century expedition.",
    href: "/work/lighthouse",
    img: ART_URLS[33],
  },
  {
    n: "03",
    title: "Modal",
    desc: "Product design for a privacy-first chat application. Identity, interface, and onboarding shipped with a small distributed team.",
    href: "/work/modal",
    img: ART_URLS[51],
  },
  {
    n: "04",
    title: "Halftone",
    desc: "Editorial system and digital archive for a small independent print magazine. Long-form layout, archive search, and a quiet subscription flow.",
    href: "/work/halftone",
    img: ART_URLS[62],
  },
];

const whitePalette: Palette = { bg: "#ffffff", fg: "#111111" };

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
    img: ART_URLS[88],
  },
  {
    title: "Web",
    desc: "Framer websites, landing pages, UI design.",
    href: "/services/web",
    img: ART_URLS[112],
  },
  {
    title: "Digital & AI",
    desc: "AI visuals, content direction, campaigns.",
    href: "/services/ai",
    img: ART_URLS[145],
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
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  // Smoothed scroll progress for the goo backdrop. Raw scrollYProgress
  // reacts instantly to scroll velocity — on wider viewports the
  // sections collapse to a single viewport each, so flicking through
  // the page can flash 10+ section words per second. The spring
  // damps that noise without making the visual feel laggy.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 320,
    damping: 60,
    restDelta: 0.0005,
    mass: 0.4,
  });
  // The wrap-around teleport (scrollTop -= block) causes a ~1/3 jump
  // in progress. We don't want the spring to animate THROUGH all the
  // section centres on its way — that would cause a single huge flash
  // in addition to the gesture noise. `useMotionValueEvent` catches
  // the raw progress jump and tells the spring to snap to it.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const previous = scrollYProgress.getPrevious() ?? latest;
    if (Math.abs(latest - previous) > 0.2) {
      smoothProgress.jump(latest);
    }
  });
  // Real scroll-progress center for each looped section. Sections have
  // very uneven heights (Process is sticky-tall, Selected/Blog stack
  // multiple cards), so the goo backdrop word for each section must
  // peak at the actually-measured midpoint rather than at i/(N-1).
  const [sectionCenters, setSectionCenters] = useState<number[]>([]);

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
    const verticalMarginPx = 32; // 2rem
    const scaleY =
      typeof window !== "undefined"
        ? (window.innerHeight - 2 * verticalMarginPx) / window.innerHeight
        : 0.94;
    // Reduced motion: skip the slide/scale tween, snap to final state.
    const tweenDuration = prefersReducedMotion() ? 0 : 0.85;
    gsap.to(stageRef.current, {
      scaleX: menuOpen ? 0.85 : 1,
      scaleY: menuOpen ? scaleY : 1,
      x: menuOpen ? "-13vw" : 0,
      borderRadius: menuOpen ? "22px" : "0px",
      duration: tweenDuration,
      ease: "expo.inOut",
      overwrite: "auto",
    });
  }, [menuOpen]);

  // Triple the sections so the user can wrap from end → start invisibly.
  const looped = [...sections, ...sections, ...sections];

  // Smooth-scroll the inner container to a section in the middle copy of
  // the loop. Sections aren't all the same height (Process section is a
  // tall sticky stack), so we resolve the target by querying the actual
  // DOM node instead of `block / sections.length`.
  const scrollToSection = (sectionIndex: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const targetIndex = sections.length + sectionIndex; // middle copy
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

  // Measure where each looped section actually sits in the scroll
  // container. The result feeds GooBackdrop so its word for each
  // section peaks at the real centre instead of at uniform i/(N-1).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const range = el.scrollHeight - el.clientHeight;
      if (range <= 0) return;
      const nodes = el.querySelectorAll<HTMLElement>("[data-section-index]");
      if (!nodes.length) return;
      // We want the *scroll progress* at which each section sits
      // visually centred in the viewport — useScroll's progress is
      // scrollTop / range, and a section is centred when
      //   scrollTop = sectionTop + sectionHeight/2 - clientHeight/2.
      // The previous formula ignored the half-viewport term and the
      // word peaked one half-viewport late.
      const half = el.clientHeight / 2;
      const next = Array.from(nodes).map((n) => {
        const v = (n.offsetTop + n.offsetHeight / 2 - half) / range;
        return Math.max(0, Math.min(1, v));
      });
      setSectionCenters((prev) => {
        if (
          prev.length === next.length &&
          prev.every((v, i) => Math.abs(v - next[i]) < 1e-4)
        ) {
          return prev;
        }
        return next;
      });
    };
    // Run immediately, then again on the next two frames once images
    // and Sanity content settle the layout.
    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() =>
      requestAnimationFrame(measure),
    );
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const node of el.querySelectorAll("[data-section-index]")) {
      ro.observe(node);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Start in the middle copy. Same content as the other copies, so
    // the user sees the hero — they just can't scroll all the way out
    // in either direction without us snapping them back.
    let block = el.scrollHeight / 3;
    el.scrollTop = block;

    const onScroll = () => {
      block = el.scrollHeight / 3;
      if (el.scrollTop >= 2 * block) el.scrollTop -= block;
      else if (el.scrollTop < block) el.scrollTop += block;
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      block = el.scrollHeight / 3;
    });
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
      const targetIndex = sections.length + idx;
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
      <MenuPanel
        open={menuOpen}
        onNavigate={(key) => scrollToSection(NAV_INDICES[key])}
      />

      {/* Toggle button stays at the viewport corner, never inside the
          transformed stage — otherwise it shrinks with the page. */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed top-4 right-6 md:right-10 z-50 mix-blend-difference text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer min-h-[44px] min-w-[44px] justify-end"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        <span aria-hidden>{menuOpen ? "✕" : "☰"}</span>
      </button>

      <div
        ref={stageRef}
        style={{ transformOrigin: "center center", willChange: "transform" }}
        className="relative z-10 h-svh w-screen overflow-hidden bg-white"
        onClick={() => menuOpen && setMenuOpen(false)}
      >
        <GooBackdrop
          words={looped.map((s) => s.word)}
          progress={smoothProgress}
          centers={sectionCenters}
        />

        <div className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white pointer-events-none">
          <SiteLogo className="h-[18px] w-auto" />
        </div>

        <div
          ref={scrollRef}
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
              >
                {isHeroIntro ? (
                  <HeroGallery />
                ) : isSelectedWork ? (
                  <div className="relative w-[88vw] md:w-[70vw] max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-10 md:gap-20">
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
                  <div className="relative w-[88vw] md:w-[70vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-16">
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
                    <div className="relative w-[88vw] md:w-[70vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-16">
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
                      <p className="font-mono text-mono uppercase tracking-widest opacity-50">
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
