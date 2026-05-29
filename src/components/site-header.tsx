"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MenuPanel, type NavKey } from "@/components/menu-panel";
import { SiteLogo } from "@/components/site-logo";

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
 * Fixed header overlay for standard-scroll subpages. Mirrors the
 * homepage chrome (SiteLogo top-left, Menu toggle + slide-in panel
 * top-right) but navigates via links instead of in-page scrolling.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <MenuPanel
        open={menuOpen}
        onNavigate={(key) => {
          setMenuOpen(false);
          router.push(NAV_HREF[key]);
        }}
      />

      <Link
        href="/"
        aria-label="Studio Graffiti — home"
        className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white flex items-center min-h-[44px]"
      >
        <SiteLogo className="h-[18px] w-auto" />
      </Link>

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
    </>
  );
}
