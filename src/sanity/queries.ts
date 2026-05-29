import { groq } from "next-sanity";
import { sanityClient } from "./client";

export type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
  cover: { asset: { _ref: string } } | null;
};

export type PostDetail = PostSummary & {
  body: unknown[] | null;
  cover: { asset: { _ref: string } } | null;
  updatedAt: string | null;
};

const allPostsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  cover
}`;

const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  "updatedAt": _updatedAt,
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

// ─── Case studies ────────────────────────────────────────────────────────

type SanityImageRef = { asset: { _ref: string } } | null;

export type CaseSummary = {
  _id: string;
  title: string;
  slug: string;
  client: string | null;
  summary: string;
  cover: SanityImageRef;
  order: number | null;
};

export type CaseOutcome = { value: string | null; label: string | null };

export type CaseDetail = CaseSummary & {
  year: string | null;
  roles: string[] | null;
  challenge: unknown[] | null;
  approach: unknown[] | null;
  solution: unknown[] | null;
  outcomes: CaseOutcome[] | null;
  gallery: SanityImageRef[] | null;
  takeaway: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

const allCasesQuery = groq`*[_type == "caseStudy" && defined(slug.current)] | order(order asc){
  _id,
  title,
  "slug": slug.current,
  client,
  summary,
  cover,
  order
}`;

const caseBySlugQuery = groq`*[_type == "caseStudy" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  client,
  summary,
  cover,
  order,
  year,
  roles,
  challenge,
  approach,
  solution,
  outcomes,
  gallery,
  takeaway,
  publishedAt,
  "updatedAt": _updatedAt
}`;

const allCaseSlugsQuery = groq`*[_type == "caseStudy" && defined(slug.current)][].slug.current`;

export async function getAllCaseStudies(): Promise<CaseSummary[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(allCasesQuery, {}, { next: { revalidate: 60 } });
}

export async function getCaseStudyBySlug(
  slug: string,
): Promise<CaseDetail | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch(
    caseBySlugQuery,
    { slug },
    { next: { revalidate: 60 } },
  );
}

export async function getAllCaseSlugs(): Promise<string[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(allCaseSlugsQuery, {}, { next: { revalidate: 60 } });
}
