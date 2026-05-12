"use client";

/**
 * Embedded Sanity Studio at /studio.
 * Disables Next's static optimization (dynamic = "force-static" is OK
 * for the shell, the studio itself is fully client-rendered).
 */
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
