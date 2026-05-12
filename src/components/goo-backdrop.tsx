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
          {words.map((w, i) => (
            <BlobWord
              key={i}
              word={w}
              index={i}
              progress={progress}
              total={N}
            />
          ))}
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

  const opacity = useTransform(dist, (d) => Math.max(1 - d, 0));

  const blurPx = useTransform(dist, (d) => {
    const norm = Math.min(d, 1);
    const eased = norm * norm * (3 - 2 * norm);
    return eased * 18;
  });

  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.span
      style={{
        filter,
        opacity,
        color: TYPE_COLOR,
        width: "92vw",
        maxWidth: "90rem",
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-heavy block text-center whitespace-pre-line leading-[0.88] tracking-[-0.03em] text-[clamp(2rem,11vw,11rem)]"
    >
      {word}
    </motion.span>
  );
}
