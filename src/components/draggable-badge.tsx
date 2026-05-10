"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";

export function DraggableBadge({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center min-h-[280px]"
    >
      <motion.div
        drag
        dragConstraints={ref}
        dragElastic={0.4}
        dragTransition={{ bounceStiffness: 220, bounceDamping: 16 }}
        whileTap={{ scale: 0.96, cursor: "grabbing" }}
        style={{ x, y, rotate }}
        className="select-none cursor-grab rounded-full bg-[--color-fg] text-[--color-bg] px-7 py-4 font-mono text-sm uppercase tracking-widest shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)]"
      >
        ↳ drag me · {label}
      </motion.div>
    </div>
  );
}
