/**
 * Sanity environment values. Read at build/runtime; the project will
 * still build and serve placeholder content if these are missing.
 */
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-12-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";

/** True only when both projectId and dataset are configured. */
export const isSanityConfigured = Boolean(projectId && dataset);
