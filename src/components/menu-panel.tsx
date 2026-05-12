"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export type NavKey =
  | "home"
  | "work"
  | "services"
  | "about"
  | "blog"
  | "contact";

const navItems: Array<{ label: string; key: NavKey }> = [
  { label: "Home", key: "home" },
  { label: "Work", key: "work" },
  { label: "Services", key: "services" },
  { label: "About", key: "about" },
  { label: "Blog", key: "blog" },
  { label: "Contact", key: "contact" },
];

const socials = [
  { label: "Instagram", href: "#" },
  { label: "Are.na", href: "#" },
  { label: "LinkedIn", href: "#" },
];

type Props = {
  open: boolean;
  onNavigate: (key: NavKey) => void;
};

export function MenuPanel({ open, onNavigate }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.set(ref.current, { xPercent: 100 });
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      xPercent: open ? 0 : 100,
      duration: 0.85,
      ease: "expo.inOut",
      overwrite: "auto",
    });
  }, [open]);

  return (
    <aside
      ref={ref}
      aria-hidden={!open}
      className="pointer-events-auto fixed inset-y-0 right-0 z-30 w-full md:w-[280px] bg-[var(--frame)] text-[#111]"
    >
      <div className="h-full flex flex-col justify-between px-6 md:px-7 py-8 md:py-10">
        <div />

        <nav className="flex flex-col -mx-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="text-left px-3 py-1.5 min-h-[44px] text-[length:var(--text-menu)] font-heavy leading-[1.1] tracking-[-0.02em] transition-opacity hover:opacity-50 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="font-mono text-[10px] uppercase tracking-widest">
          <p className="opacity-50 mb-2">Socials</p>
          <ul className="flex flex-col gap-1">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className="border-b border-transparent hover:border-current transition-colors"
                >
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
