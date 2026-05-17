import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbList, serviceSchema } from "@/lib/jsonld";

const services: Record<string, { n: string; title: string; tagline: string }> =
  {
    brand: {
      n: "01",
      title: "Brand",
      tagline: "Identity, naming, brand systems.",
    },
    web: {
      n: "02",
      title: "Web",
      tagline: "Framer websites, landing pages, UI design.",
    },
    ai: {
      n: "03",
      title: "Digital & AI",
      tagline: "AI visuals, content direction, campaigns.",
    },
  };

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = services[slug];
  if (!data) return {};
  return {
    title: `${data.title} — Studio Graffiti`,
    description: data.tagline,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = services[slug];
  if (!data) notFound();

  const url = `/services/${slug}`;
  const ld = [
    serviceSchema({ name: data.title, description: data.tagline, url }),
    breadcrumbList([
      { name: "Home", url: "/" },
      { name: "Services", url: "/#services" },
      { name: data.title, url },
    ]),
  ];

  return (
    <main className="min-h-svh bg-paper text-ink flex flex-col items-center justify-center px-6 py-24">
      <JsonLd data={ld} />
      <div className="w-full max-w-[640px]">
        <p className="text-body opacity-60 mb-4">
          {data.n} — Service
        </p>
        <h1 className="font-heavy text-display leading-[0.95] tracking-[-0.02em] mb-6">
          {data.title}
        </h1>
        <p className="text-body-lg leading-snug opacity-80 mb-10">
          {data.tagline}
        </p>
        <p className="text-body opacity-50 mb-10">
          Detailed page in progress.
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
