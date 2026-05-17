"use client";

import { motion } from "motion/react";
import { useState } from "react";

type Props = {
  index: string;
  name: string;
  role: string;
  bio: string;
  imageHue: number;
};

export function SpeakerCard({ index, name, role, bio, imageHue }: Props) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grid grid-cols-12 gap-6 py-12 md:py-16 group"
    >
      <div className="col-span-12 md:col-span-2 text-body text-[--color-fg]/60">
        {index}
      </div>
      <div className="col-span-12 md:col-span-6">
        <h3 className="font-archivo text-[length:var(--text-speaker)] leading-[0.95] tracking-tight">
          {name}
        </h3>
        <p className="mt-3 text-body text-[--color-fg]/60">
          {role}
        </p>
        <p className="mt-6 max-w-md text-body-lg leading-relaxed text-[--color-fg]/80">
          {bio}
        </p>
      </div>
      <div className="col-span-12 md:col-span-4">
        <motion.div
          animate={{ scale: hovered ? 1.02 : 1, rotate: hovered ? -1.2 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="aspect-[4/5] w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${imageHue} 60% 78%), hsl(${
              (imageHue + 40) % 360
            } 65% 60%))`,
          }}
          aria-label={`Placeholder portrait for ${name}`}
        >
          <motion.div
            animate={{ y: hovered ? -8 : 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="h-full w-full grid place-items-center font-archivo text-8xl text-white/40 mix-blend-overlay"
          >
            {name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </motion.div>
        </motion.div>
      </div>
    </article>
  );
}
