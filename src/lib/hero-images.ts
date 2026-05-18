import manifest from "@/data/artworks.json";

const ART_URLS: string[] = (manifest as Array<{ url: string }>).map(
  (m) => m.url,
);

// Indices into the artworks manifest used by the hero gallery ring.
// Kept here (not in hero-gallery.tsx) so the preloader can wait on the
// same set without importing the hero component itself.
export const HERO_INDICES = [7, 18, 33, 44, 51, 62, 88, 112, 145, 178];
export const HERO_IMAGE_URLS = HERO_INDICES.map((i) => ART_URLS[i]).filter(
  Boolean,
);
