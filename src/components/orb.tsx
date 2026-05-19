"use client";

import { forwardRef, type CSSProperties } from "react";

type OrbProps = {
  /** Diameter. Number → px. String → any CSS length / clamp(). */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
};

// Crop window into the source GIF — values picked so the orb's sphere
// fills the rounded mask without revealing the surrounding GIF canvas.
// `background-size` scales the GIF up; `background-position` centres
// the sphere inside the visible circle.
const ORB_ZOOM = "260% 260%";
const ORB_POSITION = "center";

/**
 * Brand orb — circular window cropped tightly to the animated sphere
 * inside `/public/orb.gif`. Implemented as a `border-radius: 50%`
 * div with a zoomed background-image so the sphere (which only
 * occupies a portion of the GIF canvas) fills the entire visible
 * circle. The GIF loops natively.
 */
export const Orb = forwardRef<HTMLDivElement, OrbProps>(function Orb(
  { size = 32, className = "", style },
  ref,
) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Studio Graffiti orb"
      className={`rounded-full ${className}`}
      style={{
        width: dim,
        height: dim,
        backgroundImage: "url(/orb.gif)",
        backgroundSize: ORB_ZOOM,
        backgroundPosition: ORB_POSITION,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  );
});
