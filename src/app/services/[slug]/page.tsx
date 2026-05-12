import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = services[slug];
  if (!data) notFound();

  return (
    <main className="min-h-svh bg-white text-[#111] flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-[640px]">
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-4">
          {data.n} — Service
        </p>
        <h1 className="font-heavy text-[64px] leading-[0.95] tracking-[-0.02em] mb-6">
          {data.title}
        </h1>
        <p className="text-[17px] leading-snug opacity-80 mb-10">
          {data.tagline}
        </p>
        <p className="font-mono text-[12px] uppercase tracking-widest opacity-50 mb-10">
          Detailed page in progress.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          ← Back to studio
        </Link>
      </div>
    </main>
  );
}
