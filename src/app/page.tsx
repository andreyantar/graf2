"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll } from "motion/react";
import gsap from "gsap";
import { CaseCard } from "@/components/case-card";
import { ServiceCard } from "@/components/service-card";
import { GooBackdrop } from "@/components/goo-backdrop";
import { MenuPanel } from "@/components/menu-panel";
import { MouseTrail } from "@/components/mouse-trail";
import { SnapSection, type Palette } from "@/components/snap-section";
import manifest from "@/data/artworks.json";

const ART_URLS: string[] = (manifest as Array<{ url: string }>).map((m) => m.url);

const selectedCases = [
  {
    n: "01",
    title: "Volta",
    desc: "Brand identity and packaging system for an independent battery startup. Four years of work across hardware, voice, and retail surfaces.",
    href: "#case-volta",
    img: ART_URLS[7],
  },
  {
    n: "02",
    title: "Lighthouse",
    desc: "Digital archive for a regional maritime museum. One editorial system from a single object up to a 19th-century expedition.",
    href: "#case-lighthouse",
    img: ART_URLS[33],
  },
  {
    n: "03",
    title: "Modal",
    desc: "Product design for a privacy-first chat application. Identity, interface, and onboarding shipped with a small distributed team.",
    href: "#case-modal",
    img: ART_URLS[51],
  },
  {
    n: "04",
    title: "Halftone",
    desc: "Editorial system and digital archive for a small independent print magazine. Long-form layout, archive search, and a quiet subscription flow.",
    href: "#case-halftone",
    img: ART_URLS[62],
  },
];

const whitePalette: Palette = { bg: "#ffffff", fg: "#111111" };

const SELECTED_WORK_INDEX = 1;
const WHAT_WE_DO_INDEX = 2;

const services = [
  {
    n: "01",
    title: "Brand",
    desc: "Identity, naming, brand systems.",
    href: "#service-brand",
  },
  {
    n: "02",
    title: "Web",
    desc: "Framer websites, landing pages, UI design.",
    href: "#service-web",
  },
  {
    n: "03",
    title: "Digital & AI",
    desc: "AI visuals, content direction, campaigns.",
    href: "#service-ai",
  },
];

const sections: Array<{
  word: string;
  body: React.ReactNode | null;
  bare?: boolean;
}> = [
  {
    word: "We build brands and products for companies moving forward",
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          Studio
        </p>
        <p>
          A small independent studio. We design brands, interfaces, and the
          edges in between.
        </p>
      </>
    ),
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
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          How we work
        </p>
        <p>
          Tight teams, short loops, opinionated drafts early. We prefer one
          good direction shipped over three safe ones explored.
        </p>
      </>
    ),
  },
  {
    word: "Have a brand worth building?",
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          Get in touch
        </p>
        <p>
          Tell us what you are working on. A paragraph is enough.
        </p>
        <a
          href="mailto:hello@example.com"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest border-b border-current"
        >
          hello@example.com →
        </a>
      </>
    ),
  },
  {
    word: "Studio\nGraffiti",
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          ⌁ Footer
        </p>
        <p>© Studio Graffiti — independent practice.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] uppercase tracking-widest opacity-70">
          <a href="#" className="hover:opacity-100">
            Instagram ↗
          </a>
          <a href="#" className="hover:opacity-100">
            Are.na ↗
          </a>
          <a href="#" className="hover:opacity-100">
            LinkedIn ↗
          </a>
          <a href="mailto:hello@example.com" className="hover:opacity-100">
            Email ↗
          </a>
        </div>
      </>
    ),
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  useEffect(() => {
    if (!stageRef.current) return;
    const verticalMarginPx = 32; // 2rem
    const scaleY =
      typeof window !== "undefined"
        ? (window.innerHeight - 2 * verticalMarginPx) / window.innerHeight
        : 0.94;
    gsap.to(stageRef.current, {
      scaleX: menuOpen ? 0.85 : 1,
      scaleY: menuOpen ? scaleY : 1,
      x: menuOpen ? "-13vw" : 0,
      borderRadius: menuOpen ? "22px" : "0px",
      duration: 0.85,
      ease: "expo.inOut",
      overwrite: "auto",
    });
  }, [menuOpen]);

  // Triple the sections so the user can wrap from end → start invisibly.
  const looped = [...sections, ...sections, ...sections];

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

  return (
    <>
      <MenuPanel open={menuOpen} />
      <MouseTrail disabled={menuOpen} />

      {/* Toggle button stays at the viewport corner, never inside the
          transformed stage — otherwise it shrinks with the page. */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed top-4 right-6 md:right-10 z-50 mix-blend-difference text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer"
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
          progress={scrollYProgress}
        />

        <div className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white pointer-events-none font-mono text-xs uppercase tracking-widest">
          Studio Graffiti
        </div>

        <div
          ref={scrollRef}
          className="relative z-10 h-svh overflow-y-auto overscroll-none"
          inert={menuOpen}
        >
          {looped.map((s, i) => {
            const localIdx = i % sections.length;
            const isSelectedWork = localIdx === SELECTED_WORK_INDEX;
            const isWhatWeDo = localIdx === WHAT_WE_DO_INDEX;
            return (
              <SnapSection
                key={i}
                index={i}
                palette={whitePalette}
                isHero={localIdx === 0}
                bare={s.bare}
              >
                {isSelectedWork ? (
                  <div className="relative w-[70vw] grid grid-cols-1 sm:grid-cols-2 gap-20 py-16">
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
                  <div className="relative w-[70vw] grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
                    {services.map((sv) => (
                      <ServiceCard
                        key={`${i}-${sv.n}`}
                        data={sv}
                        scrollContainerRef={scrollRef}
                      />
                    ))}
                  </div>
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
