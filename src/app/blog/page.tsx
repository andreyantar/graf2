import type { Metadata } from "next";
import { getAllPosts } from "@/sanity/queries";
import { BlogPageClient } from "./blog-page-client";

export const metadata: Metadata = {
  title: "Journal — Studio Graffiti",
  description: "Notes, takeaways, and field reports from the studio.",
};

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await getAllPosts();
  return <BlogPageClient posts={posts} />;
}
