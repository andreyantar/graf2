import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbList, creativeWorkSchema } from "@/lib/jsonld";

const cases: Record<string, { title: string; tagline: string }> = {
  volta: {
    title: "Volta",
    tagline:
      "Brand identity and packaging system for an independent battery startup.",
  },
  lighthouse: {
    title: "Lighthouse",
    tagline: "Digital archive for a regional maritime museum.",
  },
  modal: {
    title: "Modal",
    tagline: "Product design for a privacy-first chat application.",
  },
  halftone: {
    title: "Halftone",
    tagline:
      "Editorial system and digital archive for a small independent print magazine.",
  },
};

export function generateStaticParams() {
  return Object.keys(cases).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = cases[slug];
  if (!data) return {};
  const url = `/work/${slug}`;
  return {
    title: `${data.title} — Studio Graffiti`,
    description: data.tagline,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: data.title, description: data.tagline },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = cases[slug];
  if (!data) notFound();

  const url = `/work/${slug}`;
  const ld = [
    creativeWorkSchema({
      name: data.title,
      description: data.tagline,
      url,
    }),
    breadcrumbList([
      { name: "Home", url: "/" },
      { name: "Work", url: "/#work" },
      { name: data.title, url },
    ]),
  ];

  return (
    <main className="min-h-svh bg-paper text-ink flex flex-col items-center justify-center px-6 py-24">
      <JsonLd data={ld} />
      <div className="w-full max-w-[640px]">
        <p className="text-body opacity-60 mb-4">
          Case study
        </p>
        <h1 className="font-archivo text-display leading-[0.95] tracking-[-0.02em] mb-6">
          {data.title}
        </h1>
        <p className="text-body-lg leading-snug opacity-80 mb-10">
          {data.tagline}
        </p>
        <p className="text-body opacity-50 mb-10">
          Full case study in progress.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-body border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          ← Back to studio
        </Link>
      </div>
    </main>
  );
}
