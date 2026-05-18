"use client";

import {
  motion,
  useMotionTemplate,
  useTransform,
  type MotionValue,
} from "motion/react";

/** One word + its scroll-anchored visibility window. Positions and
 *  half-widths are expressed as fractions of a single loop block
 *  (block = scrollHeight / 3, computed by the host). */
export type WordSpec = {
  word: string;
  /** Block-fraction where the word should peak (full opacity).
   *  Should match the scrollTop at which the section's cards are
   *  centred in the viewport. */
  peakCenter: number;
  /** Half-width of the plateau (full opacity) around peakCenter.
   *  Tall sticky sections (Process) pass a wide plateau so the word
   *  stays up while the cards are pinned. */
  plateauHalf: number;
  /** Half-width of the full visibility window (plateau + fade tail).
   *  Beyond this the word is fully invisible. */
  fadeHalf: number;
};

type Props = {
  specs: WordSpec[];
  /** 0..1 progress within a single loop block. */
  progress: MotionValue<number>;
};

const TYPE_COLOR = "#F1F3F8";

export function GooBackdrop({ specs, progress }: Props) {
  return (
    <>
      {/* SVG filter — sharpens alpha only, leaves RGB untouched.
          A blurred gray edge becomes a hard gray edge, so the per-word
          `filter: blur()` melts adjacent letters into each other and
          this filter snaps them back into hard shapes — the goo. */}
      <svg
        aria-hidden
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <filter id="goo-sharpen">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 22 -10"
            />
          </filter>
        </defs>
      </svg>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="relative w-full h-full"
          style={{ filter: "url(#goo-sharpen)" }}
        >
          {specs.map((s, i) =>
            s.word ? (
              <BlobWord key={i} spec={s} progress={progress} />
            ) : null,
          )}
        </div>
      </div>
    </>
  );
}

function BlobWord({
  spec,
  progress,
}: {
  spec: WordSpec;
  progress: MotionValue<number>;
}) {
  const { word, peakCenter, plateauHalf, fadeHalf } = spec;

  // Circular distance on the 0..1 loop. Hero and Contact sit at the
  // wrap seam — without the circular form a word peaked at ~0 would
  // appear "far" from progress ~0.95 and miss its own fade-in.
  const dist = useTransform(progress, (p) => {
    const raw = Math.abs(p - peakCenter);
    return Math.min(raw, 1 - raw);
  });

  const opacity = useTransform(dist, (d) => {
    if (d <= plateauHalf) return 1;
    if (d >= fadeHalf) return 0;
    const t = (d - plateauHalf) / Math.max(fadeHalf - plateauHalf, 1e-6);
    const eased = t * t * (3 - 2 * t);
    return 1 - eased;
  });

  // Per-word blur — 0 on plateau, ramps to 18px over the fade tail.
  // Paired with the wrapper's alpha-sharpen this is what produces the
  // letterforms melting into each other on transition.
  const blurPx = useTransform(dist, (d) => {
    if (d <= plateauHalf) return 0;
    const t = Math.min(
      (d - plateauHalf) / Math.max(fadeHalf - plateauHalf, 1e-6),
      1,
    );
    const eased = t * t * (3 - 2 * t);
    return eased * 18;
  });

  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.span
      style={{
        filter,
        opacity,
        color: TYPE_COLOR,
        left: "4vw",
        right: "4vw",
        textAlign: "center",
        // Override .font-archivo's default 450 wght with 800 for the
        // backdrop word — wants more visual weight than headings.
        fontVariationSettings: '"wdth" 125, "wght" 800',
      }}
      className="absolute top-1/2 -translate-y-1/2 font-archivo block whitespace-pre-line leading-[0.88] tracking-[-0.03em] text-[clamp(2rem,11vw,11rem)]"
    >
      {word}
    </motion.span>
  );
}
