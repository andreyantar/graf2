import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = imageUrlBuilder({ projectId, dataset });

/**
 * Build a CDN URL for a Sanity image asset. Use `.width(800).url()` etc
 * in callers — returns a fluent builder, terminal `.url()` gives a string.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
