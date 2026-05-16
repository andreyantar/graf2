"use client";

import {
  motion,
  useMotionTemplate,
  useTransform,
  type MotionValue,
} from "motion/react";

type Props = {
  words: string[];
  /** 0..1 scroll progress through the container above. */
  progress: MotionValue<number>;
  /**
   * Real scroll-progress center for each word (matching `words` length).
   * Pass when sections have unequal heights — the BlobWord fades will
   * peak at the measured position instead of `i / (total - 1)`. When
   * omitted (or shorter than `words`), the uniform fallback is used.
   */
  centers?: number[];
};

const TYPE_COLOR = "#B4B4B4";

export function GooBackdrop({ words, progress, centers }: Props) {
  const N = Math.max(words.length, 1);
  const haveCenters = centers && centers.length === words.length;

  const centerOf = (i: number) =>
    haveCenters ? centers![i] : i / Math.max(N - 1, 1);

  return (
    <>
      {/* SVG filter — sharpens alpha only, leaves RGB untouched.
          A blurred gray edge becomes a hard gray edge, so blobs keep
          their original color. */}
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
          {words.map((w, i) => {
            if (!w) return null;
            const center = centerOf(i);
            // Distance to neighbours on the scroll progress axis. With
            // uneven section heights these aren't symmetric — use the
            // appropriate one depending on which side `progress` is on.
            const prev = i > 0 ? centerOf(i - 1) : center - 1 / Math.max(N - 1, 1);
            const next =
              i < N - 1 ? centerOf(i + 1) : center + 1 / Math.max(N - 1, 1);
            const spanBefore = Math.max(center - prev, 1e-4);
            const spanAfter = Math.max(next - center, 1e-4);
            return (
              <BlobWord
                key={i}
                word={w}
                center={center}
                spanBefore={spanBefore}
                spanAfter={spanAfter}
                progress={progress}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

function BlobWord({
  word,
  center,
  spanBefore,
  spanAfter,
  progress,
}: {
  word: string;
  center: number;
  spanBefore: number;
  spanAfter: number;
  progress: MotionValue<number>;
}) {
  const dist = useTransform(progress, (p) => {
    const delta = p - center;
    const span = delta < 0 ? spanBefore : spanAfter;
    return Math.min(Math.abs(delta) / span, 1.4);
  });

  // Plateau-style opacity scoped to a single section's span. Half-units
  // are measured against the *appropriate* neighbour span, so words
  // with a tall section on one side and a short section on the other
  // still crossfade cleanly at the actual midpoint of each transition.
  //  - PLATEAU_END is the half-width of the "fully visible" zone.
  //  - FADE_END < 0.5 keeps neighbours from sharing screen at full
  //    opacity; just under 0.5 gives a brief crossfade at the midpoint.
  const PLATEAU_END = 0.2;
  const FADE_END = 0.6;
  const opacity = useTransform(dist, (d) => {
    if (d <= PLATEAU_END) return 1;
    if (d >= FADE_END) return 0;
    const t = (d - PLATEAU_END) / (FADE_END - PLATEAU_END);
    // smoothstep for the tail
    const eased = t * t * (3 - 2 * t);
    return 1 - eased;
  });

  const blurPx = useTransform(dist, (d) => {
    if (d <= PLATEAU_END) return 0;
    const t = Math.min((d - PLATEAU_END) / (FADE_END - PLATEAU_END), 1);
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
      }}
      className="absolute top-1/2 -translate-y-1/2 font-heavy block whitespace-pre-line leading-[0.88] tracking-[-0.03em] text-[clamp(2rem,11vw,11rem)]"
    >
      {word}
    </motion.span>
  );
}
