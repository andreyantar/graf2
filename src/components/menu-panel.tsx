"use client";

export type NavKey =
  | "home"
  | "work"
  | "services"
  | "blog"
  | "contact";

const navItems: Array<{ label: string; key: NavKey }> = [
  { label: "Home", key: "home" },
  { label: "Work", key: "work" },
  { label: "Services", key: "services" },
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
  // The slide is a CSS transform transition, not a GSAP tween. GSAP writes
  // `transform` from JS on the main thread every frame; on the homepage the
  // main thread is busy with background animation (WebGL hero, goo filter,
  // the CTA's rAF loop), so on desktop Safari those writes arrive late and
  // the panel stutters. A CSS transform transition is interpolated by the
  // compositor (GPU) instead, so it stays smooth regardless of main-thread
  // load. cubic-bezier(0.87, 0, 0.13, 1) ≈ GSAP's expo.inOut.
  return (
    <aside
      aria-hidden={!open}
      style={{
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.85s cubic-bezier(0.87, 0, 0.13, 1)",
        willChange: "transform",
      }}
      className="pointer-events-auto fixed inset-y-0 right-0 z-30 w-[50vw] min-[541px]:w-[33vw] md:w-[280px] overflow-hidden bg-[var(--frame)] text-[#111]"
    >
      {/* 3-row grid [1fr | auto | 1fr] vertically centres the nav
          regardless of how tall the socials block grows. The socials
          stay anchored to the bottom of the panel via self-end. */}
      <div className="h-full grid grid-rows-[1fr_auto_1fr] px-6 md:px-7 py-8 md:py-10">
        <div />

        <nav className="flex flex-col -mx-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              // Override .font-archivo's default 450 with 800 — nav
              // items match the goo backdrop weight.
              style={{ fontVariationSettings: '"wdth" 125, "wght" 800' }}
              className="text-left px-3 py-1.5 min-h-[44px] text-[length:var(--text-menu)] font-archivo leading-[1.1] tracking-[-0.02em] transition-colors hover:text-[#9CA1AE] cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="self-end">
          <p className="text-[13px] opacity-50 mb-2">Socials</p>
          <ul className="flex flex-col gap-1 text-body">
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
          <p className="text-[13px] opacity-50 mt-6">
            © Studio Graffiti, 2026 —<br />
            independent practice
          </p>
        </div>
      </div>
    </aside>
  );
}
