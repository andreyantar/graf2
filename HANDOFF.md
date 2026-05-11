# Studio Graffiti — handoff

Context for a parallel chat picking up the project. Short on prose, long on
where to look in the code.

---

## Stack

- **Next.js 16.2.6** (App Router, Turbopack)
- **React 19.2**
- **Tailwind v4** (`@theme` tokens, arbitrary value utilities)
- **Motion** (`motion/react` — the React port of Framer Motion) for scroll-driven values
- **GSAP** for menu transitions (`expo.inOut`) and trail timeline
- **next/font/google** — Fraunces (display serif), Inter Tight (sans),
  JetBrains Mono (mono), Archivo Black (heavy display)
- **Fontshare** — Clash Display (loaded via `<link>` in `layout.tsx`)
- **Deployed:** https://studio-graffiti.vercel.app

---

## Page architecture

`src/app/page.tsx` — single client page. Stage holds everything that lives
under the menu reveal. Stage transforms via GSAP when menu opens.

```
<body bg=#f0f0f0 (frame)>
  <MenuPanel open={menuOpen} />        z-30   fixed right, gap-frame seamless
  <MouseTrail disabled={menuOpen} />   z-25   fixed, global drip layer
  <button>Menu / Close</button>        z-50   corner toggle (mix-blend-difference)
  <div ref={stageRef} bg-white>        z-10   THE STAGE
    <GooBackdrop />                    z-15   fixed, transparent, goo morph text
    <Studio Graffiti label />          z-50   fixed corner, mix-blend-difference
    <div ref={scrollRef}>              z-10   scroll container, 3× looped sections
      <SnapSection × N>                          one of which is hero, one is Selected Work
    </div>
  </div>
</body>
```

CSS variables in `src/app/globals.css`:

```css
--bg     #ffffff   /* inner card / canvas surface */
--fg     #111111
--frame  #f0f0f0   /* body background — visible only as a frame
                     around the stage when the menu is open */
```

Body has a 320 ms transition on background-color / color — section IO
mutates `--bg`/`--fg` on `:root` and the body color animates smoothly.

---

## Sections data + loop

`page.tsx` defines a 6-element `sections` array. Each has `{ word, body,
bare? }`. Rendered tripled (`[...sections, ...sections, ...sections]`) so the
scroll wraps invisibly.

Wrap logic (inside `useEffect` on `scrollRef`):

```ts
const WRAP_AT = 3.5;        // wrap point lives inside "How we work"
let block = scrollHeight/3; // one full copy of sections
let sectionH = block / sections.length;
let wrapPt = WRAP_AT * sectionH;

if (scrollTop >= 2*block + wrapPt) scrollTop -= block;  // forward wrap
else if (scrollTop < wrapPt)        scrollTop += block; // backward wrap
```

The teleport happens during the text-only "How we work" section — so the
hero (canvas-heavy in earlier iterations, goo-morph-heavy now) is always
scrolled smoothly without the wrap jitter.

`isHero={i % sections.length === 0}` adds `data-hero="true"` to the section
element — that's how `MouseTrail` detects which sections to spawn on.

---

## Components

### `src/components/goo-backdrop.tsx`
Fixed-position morph text. Inputs: `words[]`, `progress` (motion value).
- All words rendered absolute-stacked at the same point.
- Each word's `opacity` = bell curve peaked at its section, `blur` =
  smoothstep ramp peaking between sections.
- Wrapper has `filter: url(#goo-sharpen)` — an SVG `feColorMatrix` on the
  alpha channel only (`0 0 0 22 -10`). Sharp letters at rest, blob morph in
  between, RGB untouched (so gray stays gray, no chromatic crunch).
- Text color hardcoded `#B4B4B4`. Background transparent. `z-[15]` so it
  floats over the scroll container but below corner UI.

### `src/components/snap-section.tsx`
Generic section wrapper. Props: `index`, `palette`, `isHero`, `bare`.
- IntersectionObserver writes palette to `--bg`/`--fg` when ≥ 50% visible.
- `bare={true}` skips the default rounded-white card wrap (used for
  Selected Work, which has its own grid of `CaseCard`s).
- Renders `data-section-index={index}` and conditionally `data-hero="true"`.

### `src/components/menu-panel.tsx`
Right-side menu, color matches `--frame` (no visible seam against body).
- `useLayoutEffect` sets `xPercent: 100` (off-screen right) before paint.
- `useEffect` on `open` runs `gsap.to(xPercent: open ? 0 : 100, expo.inOut, 0.85s)`.
- Width `w-full md:w-[280px]`. Nav items `font-clash` style (well, font-heavy currently, can swap).
- Hover effect on items: `hover:opacity-50` (the inverted black plate was
  removed earlier by request).

### `src/components/mouse-trail.tsx`
Global fixed overlay (`z-[25]`) that spawns drifting images while the
cursor is over any `section[data-hero="true"]`.
- Pure time-based drip on `setInterval(MIN_INTERVAL_MS)` — no distance
  threshold (movement no longer required to spawn).
- Spawns at last known cursor position. Random rotation/offset in the
  entry tween scatters successive spawns naturally.
- `disabled={menuOpen}` short-circuits.

Animation (GSAP timeline per spawn):

```
ENTRY        0.35 s   power2.out
  scale 1.1 → 1, opacity 0 → 1

LINGER       0.75 s   (delay before exit)

EXIT FADE    1.5  s   ease "none" (linear)
  opacity 1 → 0
  (no scale change)

BORDER RADIUS  starts 1.0 s into exit, runs 0.5 s, power2.in
  borderRadius 0px → 16px
  → corners fully rounded at moment image hits opacity 0
```

Tunables at top of file: `IMAGE_WIDTH_PX = 220`, `MIN_INTERVAL_MS = 520`,
`TRAIL_URLS` = slice 40-80 of artworks manifest.

### `src/components/case-card.tsx`
Used inside the Selected Work section (rendered inline in `page.tsx` so it
can receive `scrollContainerRef`). Each card animates based on its own
`useScroll` progress through the scroll container.

Scroll envelope (replaces an earlier MotionPath-based attempt — discarded
because GSAP's translateY component caused row layering, and per-column
autoRotate gave the wrong tangent direction):

```ts
DEAD_HALF = 0.25            // dead zone covers progress [0.25, 0.75]
MAX_X     = 100  px         // outward shift at progress 0 / 1
MAX_ROT   = 12   deg        // tilt at progress 0 / 1
FLIP_ROTATION = false       // flips rotation sign without other changes

envelope(p) = smoothstep((|p − 0.5| − DEAD_HALF) / (0.5 − DEAD_HALF))
            = 0 inside dead zone, ramps to 1 at the extremes

verticalSign = p < 0.5 ? -1 : 1
colSign      = column === "right" ? +1 : -1

x   = envelope · MAX_X   · colSign
rot = verticalSign · envelope · MAX_ROT · colSign · (FLIP_ROTATION ? -1 : 1)
```

When all four cards are visible in the viewport (each card's progress is
inside `[0.25, 0.75]`) → `envelope = 0` → cards perfectly flat at natural
grid position. As cards approach top or bottom of the viewport the
envelope ramps and the arc effect kicks in (outward X push + tangent-style
tilt).

Card layout: rounded-[20px], 600px max width, image 280 px tall with
`object-cover`, title in `font-clash` (Clash Display) at `text-[1.75rem]
font-bold`.

---

## Selected Work data

Inside `page.tsx`:

```ts
const ART_URLS = manifest.map(m => m.url);  // /artworks/*.jpg

const selectedCases = [
  { n: "01", title: "Volta",     desc: "...", href: "#case-volta",     img: ART_URLS[7]  },
  { n: "02", title: "Lighthouse", desc: "...", href: "#case-lighthouse", img: ART_URLS[33] },
  { n: "03", title: "Modal",     desc: "...", href: "#case-modal",     img: ART_URLS[51] },
  { n: "04", title: "Halftone",  desc: "...", href: "#case-halftone",  img: ART_URLS[62] },
];
```

Rendered as a 2×2 grid inside a `bare` SnapSection:

```jsx
<div className="relative w-[70vw] grid grid-cols-1 sm:grid-cols-2 gap-x-20 gap-y-16 py-16">
  {selectedCases.map((c, idx) => (
    <CaseCard
      data={c}
      scrollContainerRef={scrollRef}
      column={idx % 2 === 0 ? "left" : "right"}
    />
  ))}
</div>
```

`gap-x-20` = 5 rem column gap, `gap-y-16` = 4 rem row gap.

---

## Assets

`public/artworks/*.jpg` — ~212 Met/Art Institute CC0 images vendored from
the Codrops "Infinite Canvas" tutorial assets folder. Manifest at
`src/data/artworks.json` (same JSON, moved into `src/` so it can be
imported). Used by both `MouseTrail` and `CaseCard`.

---

## Earlier iterations (so context isn't lost)

These existed at some point and were removed. Files no longer in the repo,
just history:

- **R3F infinite canvas hero.** `@react-three/fiber` + `@react-three/drei`,
  36 textured planes scattered in 3-D space with fog + perspective camera +
  drag-pan + parallax + scroll-driven dolly. Removed at user request
  ("outside our aesthetic"). The `three`, `@react-three/fiber`, and
  `@react-three/drei` deps still sit in `package.json` — safe to
  `npm uninstall` if you're not bringing it back.
- **MotionPath arc.** Tried `gsap.MotionPathPlugin` with an SVG circular
  arc (R=1500) and `getPositionOnPath` to extract X+angle without applying
  Y. Layering and tangent direction issues led us to the dead-zone
  envelope above. Plugin import is gone, but `gsap` still in the bundle
  for the menu transition and the mouse trail.
- **`section-color.tsx`, `marquee.tsx`, `draggable-badge.tsx`,
  `intro-reveal.tsx`, `speaker-card.tsx`** — earlier teardown exercises
  before this project narrowed to a studio site. Files are still on disk
  but unused.

---

## Quick reference — where to tweak what

| Want to change                       | File / constant                                          |
|--------------------------------------|----------------------------------------------------------|
| Section words / body                 | `page.tsx` → `sections`                                  |
| Case titles / descriptions / images  | `page.tsx` → `selectedCases`                             |
| Case grid gap                        | `page.tsx` → `gap-x-20 gap-y-16` on the grid div         |
| Where the scroll loop wraps          | `page.tsx` → `WRAP_AT` (currently 3.5 = "How we work")   |
| Goo morph color                      | `goo-backdrop.tsx` → `TYPE_COLOR = "#B4B4B4"`            |
| Goo blob hardness                    | `goo-backdrop.tsx` → `feColorMatrix` last row values     |
| Menu open transform                  | `page.tsx` → `gsap.to(stageRef, ...)` (scaleX, scaleY, x, borderRadius) |
| Menu panel width                     | `menu-panel.tsx` → `md:w-[280px]`                        |
| Trail spawn rate                     | `mouse-trail.tsx` → `MIN_INTERVAL_MS = 520`              |
| Trail image lifetime                 | `mouse-trail.tsx` → entry / linger / exit durations      |
| Trail corner radius at end           | `mouse-trail.tsx` → `borderRadius: "16px"` in exit tween |
| Case card dead zone width            | `case-card.tsx` → `DEAD_HALF = 0.25`                     |
| Case card max X / rotation           | `case-card.tsx` → `MAX_X = 100`, `MAX_ROT = 12`          |
| Case card rotation direction         | `case-card.tsx` → `FLIP_ROTATION`                        |
| Card title font / size               | `case-card.tsx` → `font-clash text-[1.75rem] font-bold`  |
| Body / frame color                   | `globals.css` → `--frame`                                |
| Adding Clash Display weights         | `layout.tsx` → Fontshare `<link>` URL                    |

---

## Run

```
npm run dev       # localhost:3000
npm run build     # production build (passes)
vercel --prod     # deploys (already linked to "studio-graffiti")
```
