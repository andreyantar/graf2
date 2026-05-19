import type { Metadata } from "next";
import { Orb } from "@/components/orb";

export const metadata: Metadata = {
  title: "Orb preview — Studio Graffiti",
  robots: { index: false, follow: false },
};

/**
 * Static preview at /orb-preview — single colour-cycling brand orb
 * centred against the page background, nothing else. For visual QA
 * of the orb in isolation. Not linked from anywhere; noindex.
 */
export default function OrbPreviewPage() {
  return (
    <main className="min-h-svh w-full flex items-center justify-center bg-[var(--frame)]">
      <Orb size="clamp(72px, 9vw, 168px)" />
    </main>
  );
}
