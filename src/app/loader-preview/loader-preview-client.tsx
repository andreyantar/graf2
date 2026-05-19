"use client";

import { useState } from "react";
import { Preloader } from "@/components/preloader";
import { Orb } from "@/components/orb";

/**
 * Dev preview at /loader-preview — lets you watch the goo-blob spinner
 * in isolation (infinite loop, top half) and replay the full preloader
 * sequence (logo + morph) against a stand-in hero badge target.
 *
 * Not linked from the site; `robots: noindex` in the parent page.
 */
export function LoaderPreviewClient() {
  const [replayKey, setReplayKey] = useState(0);

  const replay = () => {
    try {
      window.sessionStorage.removeItem("sg-preloader-seen");
    } catch {
      // ignore — preview only
    }
    setReplayKey((k) => k + 1);
  };

  return (
    <div className="min-h-svh bg-[var(--frame)] text-[var(--color-ink)]">
      {/* ── Section 1: spinner only, looping forever ────────────────── */}
      <section className="min-h-svh flex flex-col items-center justify-center px-6 relative">
        <Orb size="clamp(30px, 3.6vw, 66px)" />
        <p
          className="mt-12 font-archivo opacity-60"
          style={{
            fontSize: "0.8rem",
            fontVariationSettings: '"wdth" 125, "wght" 450',
          }}
        >
          Spinner only — infinite loop, animation isolated from page logic.
        </p>
      </section>

      {/* ── Section 2: full sequence with replay button + fake target ── */}
      <section className="min-h-svh relative border-t border-black/10">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={replay}
            className="font-archivo px-6 py-3 bg-[var(--color-ink)] text-[var(--bg)] rounded-full"
            style={{
              fontSize: "0.8rem",
              fontVariationSettings: '"wdth" 125, "wght" 450',
            }}
          >
            ▶ Replay full sequence
          </button>
          <p
            className="font-archivo opacity-50 text-center max-w-[420px]"
            style={{
              fontSize: "0.8rem",
              fontVariationSettings: '"wdth" 125, "wght" 450',
            }}
          >
            Renders the live <code>&lt;Preloader/&gt;</code>. Watch the logo
            phase + morph to the stand-in badge below.
          </p>
        </div>

        {/* Stand-in hero badge target — Preloader queries [data-hero-badge]
            for its morph endpoint, so we mount one here at the position
            the real Hero uses (30vh from section top). */}
        <div
          data-hero-badge
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "calc(30vh + 60px)" }}
        >
          <Orb size="clamp(30px, 3.6vw, 66px)" />
        </div>

        {/* Key bump remounts the Preloader for a clean replay. */}
        <Preloader key={replayKey} onDone={() => {}} />
      </section>
    </div>
  );
}
