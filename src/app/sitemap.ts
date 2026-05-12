import type { MetadataRoute } from "next";

const BASE_URL = "https://studio-graffiti.vercel.app";

const cases = ["volta", "lighthouse", "modal", "halftone"];
const services = ["brand", "web", "ai"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified: now, priority: 1 },
    ...cases.map((slug) => ({
      url: `${BASE_URL}/work/${slug}`,
      lastModified: now,
      priority: 0.7,
    })),
    ...services.map((slug) => ({
      url: `${BASE_URL}/services/${slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
