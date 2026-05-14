import { SITE_URL, SITE_NAME } from "./site";

/**
 * Builders for schema.org JSON-LD blobs. Inject them via the JsonLd
 * component (see ./jsonld.tsx) in any server-rendered page. Read by
 * Google rich results, AI Overviews, Perplexity, and other LLM crawlers.
 */

type SchemaObject = Record<string, unknown>;

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
} as const;

export function breadcrumbList(
  items: Array<{ name: string; url: string }>,
): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.url}`,
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description?: string | null;
  datePublished: string;
  imageUrl?: string;
  url: string;
}): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl,
    datePublished: input.datePublished,
    author: ORGANIZATION,
    publisher: ORGANIZATION,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${input.url}`,
    },
  };
}

export function creativeWorkSchema(input: {
  name: string;
  description?: string;
  url: string;
}): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.name,
    description: input.description,
    url: `${SITE_URL}${input.url}`,
    creator: ORGANIZATION,
  };
}

export function serviceSchema(input: {
  name: string;
  description?: string;
  url: string;
}): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: `${SITE_URL}${input.url}`,
    provider: ORGANIZATION,
  };
}

/**
 * Inline a schema.org JSON-LD blob (or array of blobs) into a server-
 * rendered page. Builders above produce trusted server data, so the
 * stringified payload is safe to inject as innerHTML.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
