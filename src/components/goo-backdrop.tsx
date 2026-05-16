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
};

const TYPE_COLOR = "#B4B4B4";

export function GooBackdrop({ words, progress }: Props) {
  const N = Math.max(words.length, 1);

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
          {words.map((w, i) =>
            w ? (
              <BlobWord
                key={i}
                word={w}
                index={i}
                progress={progress}
                total={N}
              />
            ) : null,
          )}
        </div>
      </div>
    </>
  );
}

function BlobWord({
  word,
  index,
  progress,
  total,
}: {
  word: string;
  index: number;
  progress: MotionValue<number>;
  total: number;
}) {
  const center = index / Math.max(total - 1, 1);
  const span = 1 / Math.max(total - 1, 1);

  const dist = useTransform(progress, (p) =>
    Math.min(Math.abs(p - center) / span, 1.4),
  );

  // Plateau-style opacity scoped to a single section's span.
  //  - PLATEAU_END is the half-width of the "fully visible" zone, in
  //    units of `span` (so 0.2 = ±20% of the way to the next section).
  //  - FADE_END is where the word reaches zero. Keep it < 0.5 of the
  //    span and neighbouring words can't be on screen at the same
  //    time; setting it just under 0.5 gives a brief crossfade at the
  //    transition midpoint without ever stacking two words at full
  //    opacity.
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
