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
- Menu items (Home / Work / Services / About / Blog / Contact)
  scroll-to-section via `MenuPanel.onNavigate(key)` → page-owned math
- Section restructure: standalone footer removed, its big "Studio
  Graffiti" goo text carried into the new About section, its
  copyright/socials folded into Contact
- Blog teaser section added before Contact, links to `/blog`
- Goo background texts kept original ("What we do", "How we work") —
  body labels read "Services"/"Process"/"Blog"/"Contact"

### Sanity CMS — live
- `next-sanity` + `sanity` v5 wired in
- `sanity.config.ts` at repo root, schemas under `src/sanity/schemas/`
- `post` schema: title / slug / excerpt / cover / publishedAt / body
- Embedded studio at `/studio` (`src/app/studio/[[...tool]]/`),
  layout marks it `noindex`
- Read client + queries in `src/sanity/{client,queries}.ts` —
  returns `null` / `[]` when env not configured so build still passes
- `/blog` index + `/blog/[slug]` detail pages (SSG with revalidate 60)
- `.env.example` documents `NEXT_PUBLIC_SANITY_PROJECT_ID` +
  `NEXT_PUBLIC_SANITY_DATASET`
- **Project provisioned + connected** — `projectId bw87izq9`,
  dataset `production` (set in `.env.local`). `/studio` live.
- **3 posts published** (Polish copy): "Design cyfrowy zmienia
  sposób", "Nawet najmniejsze detale wpływają na odbiór interfejsu"
  (`post-2`), "Hello World". `/blog` + home Blog teaser render the
  real data — no mock cards.
- Mock-card fallback for the empty state was tried then reverted
  (commit `2ebd504` → reverted in `6074f7d`): real posts exist, so
  the hardcoded placeholders were unnecessary.

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
- 44px min touch targets on menu toggle, MenuPanel nav items,
  DraggableBadge
- Alt audit: CaseCard / ServiceCard / BlogCard / ProcessStack images
  now use the adjacent title as `alt` (was empty)

### Design tokens
- Fluid typography via `@theme` block in `globals.css`, all in `rem`
  for proper user-font-size scaling:
  `--text-display` (h1, 40→64px), `--text-menu` (30→36px),
  `--text-speaker` (36→60px), `--text-card-title` (24→34px),
  `--text-body-lg` (15→17px), `--text-body` (16px),
  `--text-mono` (11px)
- Surface tokens: `--color-ink`, `--color-paper`
- `--shadow-card` (soft ambient drop) used on both card types

### Mobile pass
- Goo backdrop: `break-words`, lower clamp floor (2rem) so long words
  don't overflow the viewport on narrow screens
- Grid containers: `w-[88vw] md:w-[70vw]`, gap shrinks on mobile
- ServiceCard `min-h` only at `md:` (no forced empty space on mobile)
- Case/Service placeholder pages use `text-display` (40→64px fluid)

### SEO & analytics
- `src/app/sitemap.ts` → `/sitemap.xml` — includes home, `/blog`,
  cases, services, AND blog post slugs pulled dynamically from Sanity
  via `getAllPosts()` (`lastmod` = each post's `publishedAt`). Verified
  live: all 3 published posts appear.
- `src/app/robots.ts` → `/robots.txt`
- `generateMetadata` per case / service / blog slug page
- `@vercel/analytics` + `@vercel/speed-insights` wired in root layout
- Central `src/lib/site.ts` exposes `SITE_URL` / `SITE_NAME` /
  `SITE_DESCRIPTION` (overridable via `NEXT_PUBLIC_SITE_URL`,
  default `https://studio-graffiti.pl`)
- Root metadata: `metadataBase`, canonical `/`, title template,
  `openGraph` (with `/og.png` 1200×630), `twitter` summary_large_image,
  `robots.googleBot` with `max-image-preview: large`
- JSON-LD `Organization` injected in `<body>` (read by Google AI
  Overviews, Perplexity, ChatGPT search)
- JSON-LD builders in `src/lib/jsonld.tsx` (Article / BreadcrumbList /
  CreativeWork / Service) wired into all detail routes (commit
  `1733323`): `/blog/[slug]` → Article + Breadcrumb, `/work/[slug]` →
  CreativeWork + Breadcrumb, `/services/[slug]` → Service + Breadcrumb
- **Per-route canonical fix** — root layout's `canonical: "/"` was
  inherited by every subpage (blog/work/services all reported the
  homepage as canonical → would deindex them). `generateMetadata` now
  sets `alternates.canonical` + `openGraph.url` per route on
  `/blog`, `/blog/[slug]`, `/work/[slug]`, `/services/[slug]`.
- **Per-article OpenGraph** — blog posts now emit `og:type=article`,
  `og:image` from the Sanity cover (1200×630 crop), `publishedTime`,
  and `twitter:summary_large_image` instead of the generic `/og.png`.
- **Blog posts marked `lang="pl"`** on `<article>` (Polish copy under
  an `en` site) + `inLanguage: "pl"` in Article JSON-LD.
- **`WebSite` JSON-LD** added alongside `Organization` in root layout;
  Article schema gained `dateModified` (from Sanity `_updatedAt`).
- `public/llms.txt` — short LLM-crawler site map
- `public/og.png` — static social card (1200×630)
- Home hero promoted to `<h1>` (was missing — every other route had
  its own `<h1>`)

### Cleanup
- Metadata: "Studio Graffiti" (was leftover "Teardown")
- Fontshare links removed, dead `--font-clash` var removed
- `package.json.name` → `studio-graffiti`
- Shared `envelope()` extracted to `src/lib/scroll-envelope.ts`
- `gsap.killTweensOf` passes `Array.from(...)` not live HTMLCollection

### Infrastructure
- Repo: github.com/andreyantar/graf2
- Prod target: studio-graffiti.pl (DNS pending; currently aliased
  to studio-graffiti.vercel.app)
- Static prerender for all 11 routes

---

## 🟡 In planning

### Sanity — production hygiene
- Verify `NEXT_PUBLIC_SANITY_*` are set in Vercel env (Production +
  Preview), not just local `.env.local` — otherwise prod `/blog`
  falls back to the empty state.
- Clean up placeholder posts before launch: `post-2` and
  `hello-world` look like test drafts — keep or delete in `/studio`.
- Optional: install the Sanity-Vercel Marketplace integration to
  auto-sync env vars across environments.

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

## 🔴 Pending — SEO/LLM (next iteration)

- **(user action) Set `NEXT_PUBLIC_SITE_URL` in Vercel prod env.**
  Without it, prod falls back to the `*.vercel.app` URL — so
  canonical / og:url / sitemap / robots all point to vercel.app while
  `public/llms.txt` hardcodes `studio-graffiti.pl`. Split domain
  signals. Set once the `.pl` domain is live.
- **(decision) `/work/[slug]` + `/services/[slug]` are placeholders**
  ("Full case study in progress") but emit `CreativeWork` / `Service`
  JSON-LD describing them as real. Thin content + structured data for
  non-existent work is an E-E-A-T risk and can mislead LLM crawlers.
  Either write real content or drop the JSON-LD until it exists.
- Audit `description` quality in each `generateMetadata` (verify
  none default to a generic boilerplate)
- Minor fluid hangs: explicit `leading-[1.1]` instead of
  `leading-tight` on shared h2/h3 components; arbitrary `text-[15px]`
  / `rounded-[20px]` in `snap-section.tsx` → fluid tokens

> JSON-LD (Article / BreadcrumbList / CreativeWork / Service) and the
> dynamic blog sitemap were moved to ✅ Done — they shipped in commit
> `1733323` and are live. Builders live in `src/lib/jsonld.tsx`.

## 🔴 Pending — Misc

- OG image is currently a static `public/og.png`. Could swap to dynamic
  `opengraph-image.tsx` (`next/og`) for per-route cards once the static
  one starts feeling limiting.
- DNS for `studio-graffiti.pl` + `NEXT_PUBLIC_SITE_URL` set in Vercel
  Production env (currently falls back to `VERCEL_PROJECT_PRODUCTION_URL`
  → `VERCEL_URL` → hardcoded default in `src/lib/site.ts`)
- `scrollContainerRef` typed without `as RefObject<HTMLElement>` cast
  (minor)
- CaseCard renders × 3 in the looped sections — 12 scroll listeners
  instead of 4. Structural, leave for now unless perf is observed.

---

## How to use this file

When work starts on a 🟡 / 🔴 item, move it to ✅ once shipped to prod.
Notes/decisions accumulate next to each line — keep them short, link
out to commits or files where helpful.
