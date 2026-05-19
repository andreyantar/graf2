"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sg-cookies-consent";

type Consent = "accepted" | "declined" | null;

export function CookiesBanner() {
  // `null` until we've read localStorage on the client — keeps SSR
  // output deterministic and prevents the banner from flashing on
  // repeat visits.
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "declined") {
        setConsent(stored);
      }
    } catch {
      // localStorage unavailable (private mode / disabled storage) —
      // we just leave the banner visible; user can dismiss per session.
    }
  }, []);

  const choose = (next: "accepted" | "declined") => {
    setConsent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — banner still dismisses for this view
    }
  };

  if (!mounted || consent) return null;

  return (
    <aside
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 w-[min(20rem,calc(100vw-2rem))] bg-paper text-ink shadow-card rounded-[20px] p-6"
    >
      <p
        className="font-archivo opacity-60 mb-3 uppercase"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          fontVariationSettings: '"wdth" 125, "wght" 450',
        }}
      >
        Cookies
      </p>
      <p className="text-body leading-snug mb-5">
        This website uses cookies to analyze traffic.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="font-archivo text-body px-5 py-2 border border-current rounded-full hover:bg-ink hover:text-paper transition-colors"
          style={{
            fontVariationSettings: '"wdth" 125, "wght" 450',
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="font-archivo text-body px-5 py-2 border border-current rounded-full hover:bg-ink hover:text-paper transition-colors"
          style={{
            fontVariationSettings: '"wdth" 125, "wght" 450',
          }}
        >
          Decline
        </button>
      </div>
    </aside>
  );
}
