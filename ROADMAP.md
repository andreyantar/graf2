# Studio Graffiti — roadmap

Living document. Update as items move between sections.

---

## ✅ Done

### Layout & content
- 6-section looped scroll (`page.tsx` triple-rendered with manual teleport)
- Hero / Selected Work / What we do / How we work / Get in touch / Footer
- Goo-morph backdrop text per section (`goo-backdrop.tsx` + SVG alpha matrix)
- Selected Work: 2×2 CaseCard grid with scroll-driven arc envelope
  (translate + tilt + corner radius via shared smoothstep helper)
- What we do: 3-col ServiceCard grid with the same radius envelope
- Mouse trail: time-based artwork drip on hero sections
- 212 CC0 artworks vendored under `public/artworks/` + manifest
- Reveal menu panel (right side, GSAP `expo.inOut`)
- Stage transform on menu open (scale + translate + radius)

### Navigation
- Menu items (Home / Work / Services / About / Contact) scroll-to-section
  via `MenuPanel.onNavigate(key)` → page-owned scroll math
- Section restructure: standalone footer removed, its big "Studio
  Graffiti" goo text carried into the new About section, its
  copyright/socials folded into Contact
- "How we work" → "Process"; "What we do" big text → "Services"

### Subpages (placeholder)
- `/work/[slug]` — volta, lighthouse, modal, halftone (SSG via
  `generateStaticParams`, per-page `generateMetadata`)
- `/services/[slug]` — brand, web, ai (same pattern)

### A11y / perf
- `prefers-reduced-motion` guard in CaseCard, ServiceCard, MouseTrail,
  and the menu transition (helper: `src/lib/prefers-reduced-motion.ts`)
- Corner-radius animated via `--card-radius` CSS var instead of inline
  `style.borderRadius` mutation
- `contain: paint` on cards for paint isolation
- `<img>` in CaseCard and MouseTrail spawns: `loading="lazy"` +
  `decoding="async"`

### Design tokens
- Fluid typography via `@theme` block in `globals.css`:
  `--text-display`, `--text-card-title`, `--text-body-lg`, `--text-body`,
  `--text-mono` (clamp-based)
- Surface tokens: `--color-ink`, `--color-paper`
- `--shadow-card` (soft ambient drop) used on both card types

### Mobile pass
- Goo backdrop: `break-words`, lower clamp floor (2rem) so long words
  don't overflow the viewport on narrow screens
- Grid containers: `w-[88vw] md:w-[70vw]`, gap shrinks on mobile
- ServiceCard `min-h` only at `md:` (no forced empty space on mobile)
- Case/Service placeholder pages use `text-display` (40→64px fluid)

### SEO & analytics
- `src/app/sitemap.ts` → `/sitemap.xml`
- `src/app/robots.ts` → `/robots.txt`
- `generateMetadata` per case/service page
- `@vercel/analytics` + `@vercel/speed-insights` wired in root layout

### Cleanup
- Metadata: "Studio Graffiti" (was leftover "Teardown")
- Fontshare links removed, dead `--font-clash` var removed
- `package.json.name` → `studio-graffiti`
- Shared `envelope()` extracted to `src/lib/scroll-envelope.ts`
- `gsap.killTweensOf` passes `Array.from(...)` not live HTMLCollection

### Infrastructure
- Repo: github.com/andreyantar/graf2
- Prod: studio-graffiti.vercel.app
- Static prerender for all 11 routes

---

## 🟡 In planning

_(nothing right now)_

## ❌ Rejected

### Smooth scroll
- GSAP ScrollSmoother and any virtualizing smoother (Lenis, custom
  lerp) conflict with the manual `scrollTop -= block` teleport at the
  loop boundary — under smoothing the teleport becomes a visible
  animated jump, defeating the seamless infinite-scroll effect.
- Decision: **keep native scroll, preserve the infinite loop.** The
  invisible teleport is the headline trick of the page; we'd rather
  have native-feeling scroll than smoothed scroll with a broken loop.

---

## 🔴 Pending — Product

- **Real case studies** to replace `/work/[slug]` placeholders — copy,
  imagery, layout, takeaway blocks
- **About page** (dedicated) — currently About lives only as a homepage
  section; a real `/about` route with deeper studio story / philosophy
- **Contact page or form** — homepage Contact section has mailto +
  socials; could expand to a real route with a proper form
- **Hero (section 0)** — body copy is minimal; need to decide whether
  this is the manifesto, a process overview, or stays sparse

## 🔴 Pending — UX

- Custom cursor on hero sections
- Hover states richer than `opacity-60` on links
- First-paint state / font-swap polish (FOUC mitigation)
- Cookie / privacy notice (EU jurisdictions)

## 🔴 Pending — Misc

- OG image generation via `next/og` (deferred by user)
- `scrollContainerRef` typed without `as RefObject<HTMLElement>` cast
  (minor)
- CaseCard renders × 3 in the looped sections — 12 scroll listeners
  instead of 4. Structural, leave for now unless perf is observed.

---

## How to use this file

When work starts on a 🟡 / 🔴 item, move it to ✅ once shipped to prod.
Notes/decisions accumulate next to each line — keep them short, link
out to commits or files where helpful.
