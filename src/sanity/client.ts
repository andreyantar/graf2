import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/**
 * Public read client. Uses CDN, no token required.
 * Returns a real client only when env is configured — otherwise
 * `null`, so callers can fall back to empty state.
 */
export const sanityClient =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: true,
        perspective: "published",
      })
    : null;
