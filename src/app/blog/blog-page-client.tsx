"use client";

import Link from "next/link";
import { useState } from "react";
import { useMotionValue } from "motion/react";
import { BlogCard } from "@/components/blog-card";
import { GooBackdrop } from "@/components/goo-backdrop";
import { MenuPanel, type NavKey } from "@/components/menu-panel";
import type { PostSummary } from "@/sanity/queries";

type Props = {
  posts: PostSummary[];
};

export function BlogPageClient({ posts }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  // GooBackdrop expects a MotionValue; this page has a single static word
  // so progress is pinned at 0 (= word centered, fully visible, no morph).
  const staticProgress = useMotionValue(0);

  const onNavigate = (key: NavKey) => {
    setMenuOpen(false);
    if (key === "blog") return; // already here
    if (typeof window !== "undefined") {
      // Hard navigate so the home page's hash-handler can scroll to the
      // requested section on mount.
      window.location.href = key === "home" ? "/" : `/#${key}`;
    }
  };

  return (
    <>
      <MenuPanel open={menuOpen} onNavigate={onNavigate} />

      <Link
        href="/"
        className="fixed top-4 left-6 md:left-10 z-50 mix-blend-difference text-white pointer-events-auto font-mono text-xs uppercase tracking-widest"
      >
        Studio Graffiti
      </Link>

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

      <GooBackdrop words={["Journal"]} progress={staticProgress} />

      <main className="relative z-10 min-h-svh px-6 md:px-10 py-32">
        {posts.length === 0 ? (
          <div className="mx-auto w-full max-w-[640px] text-center py-32">
            <p className="font-mono text-mono uppercase tracking-widest opacity-50">
              No posts yet.
            </p>
          </div>
        ) : (
          <div className="relative w-[88vw] md:w-[70vw] max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-10 md:gap-20">
            {posts.map((post, idx) => (
              <BlogCard
                key={post._id}
                post={post}
                column={idx % 2 === 0 ? "left" : "right"}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
