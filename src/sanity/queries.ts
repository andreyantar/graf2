import { groq } from "next-sanity";
import { sanityClient } from "./client";

export type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
};

export type PostDetail = PostSummary & {
  body: unknown[] | null;
  cover: { asset: { _ref: string } } | null;
};

const allPostsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt
}`;

const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  body,
  cover
}`;

const allSlugsQuery = groq`*[_type == "post" && defined(slug.current)][].slug.current`;

export async function getAllPosts(): Promise<PostSummary[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(allPostsQuery, {}, { next: { revalidate: 60 } });
}

export async function getPostBySlug(
  slug: string,
): Promise<PostDetail | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch(
    postBySlugQuery,
    { slug },
    { next: { revalidate: 60 } },
  );
}

export async function getAllSlugs(): Promise<string[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(allSlugsQuery, {}, { next: { revalidate: 60 } });
}
