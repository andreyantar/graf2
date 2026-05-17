"use client";

import { motion } from "motion/react";

export function Marquee({ text }: { text: string }) {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="overflow-hidden border-y border-[--color-rule] py-6">
      <motion.div
        className="flex whitespace-nowrap gap-12 will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((i, idx) => (
          <span
            key={idx}
            className="font-archivo text-5xl md:text-7xl tracking-tight"
          >
            {text}
            <span className="text-[--color-accent] mx-6">●</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
