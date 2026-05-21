"use client";

import { forwardRef, type CSSProperties } from "react";
import Lottie from "lottie-react";
import sparkLoader from "../../public/spark_loader.json";

type OrbProps = {
  /** Diameter. Number → px. String → any CSS length / clamp(). */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Brand orb — Spark1 Lottie animation (`/public/spark_loader.json`)
 * scaled into a square box of the requested size. Loops natively via
 * lottie-react. No background, no border-radius mask — the animation's
 * own composition defines the visible shape.
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
      className={`orb-shell ${className}`}
      style={{
        width: dim,
        height: dim,
        ...style,
      }}
    >
      <Lottie
        animationData={sparkLoader}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      />
    </div>
  );
});
