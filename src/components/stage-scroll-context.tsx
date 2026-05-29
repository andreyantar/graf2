"use client";

import { createContext, useContext, type RefObject } from "react";

/**
 * Exposes the SiteHeader stage's internal scroll container so scroll-
 * driven children (e.g. ContactCard's radius animation) can track it.
 * On the homepage the equivalent ref is passed as a prop; on subpages
 * the content is rendered as `children` of SiteHeader, so we hand the
 * ref down through context instead.
 */
export const StageScrollContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useStageScrollRef() {
  return useContext(StageScrollContext);
}
