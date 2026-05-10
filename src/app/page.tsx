"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll } from "motion/react";
import gsap from "gsap";
import { GooBackdrop } from "@/components/goo-backdrop";
import { MenuPanel } from "@/components/menu-panel";
import { SnapSection, type Palette } from "@/components/snap-section";

const whitePalette: Palette = { bg: "#ffffff", fg: "#111111" };

const sections: Array<{
  word: string;
  body: React.ReactNode;
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
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          Selected work
        </p>
        <p>
          A short list of recent projects. Each one is a complete answer to a
          specific question — not a portfolio shelf.
        </p>
      </>
    ),
  },
  {
    word: "What we do",
    body: (
      <>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-3">
          What we do
        </p>
        <p>
          Brand identity, product design, motion, and the unglamorous
          connective tissue: design systems, guidelines, handoff.
        </p>
      </>
    ),
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
          inert={menuOpen ? "" : undefined}
        >
          {looped.map((s, i) => (
            <SnapSection key={i} index={i} palette={whitePalette}>
              {s.body}
            </SnapSection>
          ))}
        </div>
      </div>
    </>
  );
}
