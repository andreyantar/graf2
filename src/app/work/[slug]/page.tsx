import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = cases[slug];
  if (!data) notFound();

  return (
    <main className="min-h-svh bg-paper text-ink flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-[640px]">
        <p className="font-mono text-mono uppercase tracking-widest opacity-60 mb-4">
          Case study
        </p>
        <h1 className="font-heavy text-display leading-[0.95] tracking-[-0.02em] mb-6">
          {data.title}
        </h1>
        <p className="text-body-lg leading-snug opacity-80 mb-10">
          {data.tagline}
        </p>
        <p className="font-mono text-mono uppercase tracking-widest opacity-50 mb-10">
          Full case study in progress.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-mono uppercase tracking-widest border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          ← Back to studio
        </Link>
      </div>
    </main>
  );
}
