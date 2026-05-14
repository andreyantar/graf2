import type { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/site";
import { getAllPosts } from "@/sanity/queries";

const cases = ["volta", "lighthouse", "modal", "halftone"];
const services = ["brand", "web", "ai"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Pull blog slugs + publishedAt from Sanity. Returns [] if env is not
  // configured, so the build still passes on previews without secrets.
  const posts = await getAllPosts();
  return [
    { url: `${BASE_URL}/`, lastModified: now, priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: now, priority: 0.8 },
    ...posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      priority: 0.6,
    })),
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
