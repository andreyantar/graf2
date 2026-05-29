import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextBlock } from "next-sanity";
import {
  getAllCaseSlugs,
  getAllCaseStudies,
  getCaseStudyBySlug,
} from "@/sanity/queries";
import { portableComponents } from "@/sanity/portable-components";
import { urlFor } from "@/sanity/image";
import { JsonLd, breadcrumbList, creativeWorkSchema } from "@/lib/jsonld";
import { SiteHeader } from "@/components/site-header";
import { ContactCard } from "@/components/contact-card";
import { CaseCarousel } from "@/components/case-carousel";
import { NextProjectCover } from "@/components/next-project-cover";
import type { CaseData } from "@/components/case-card";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllCaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCaseStudyBySlug(slug);
  if (!c) return {};
  const url = `/work/${slug}`;
  const coverUrl = c.cover
    ? urlFor(c.cover).width(1200).height(630).fit("crop").auto("format").url()
    : undefined;
  return {
    title: `${c.title} — Studio Graffiti`,
    description: c.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: c.title,
      description: c.summary,
      images: coverUrl
        ? [{ url: coverUrl, width: 1200, height: 630, alt: c.title }]
        : undefined,
    },
    twitter: coverUrl
      ? { card: "summary_large_image", images: [coverUrl] }
      : undefined,
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, all] = await Promise.all([
    getCaseStudyBySlug(slug),
    getAllCaseStudies(),
  ]);
  if (!c) notFound();

  const url = `/work/${slug}`;
  const coverUrl = c.cover
    ? urlFor(c.cover).width(1600).fit("max").auto("format").url()
    : undefined;
  const coverOg = c.cover
    ? urlFor(c.cover).width(1200).height(630).fit("crop").auto("format").url()
    : undefined;

  // Next case (wraps around) for end-of-page navigation.
  const idx = all.findIndex((x) => x.slug === slug);
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  const nextCover = next?.cover
    ? urlFor(next.cover).width(1600).height(900).fit("crop").auto("format").url()
    : undefined;

  // Other cases (everything but this one) for the looped carousel.
  const others: CaseData[] = all
    .filter((x) => x.slug !== slug)
    .map((x, i) => ({
      n: String(i + 1).padStart(2, "0"),
      title: x.title,
      desc: x.summary,
      href: `/work/${x.slug}`,
      img: x.cover
        ? urlFor(x.cover).width(900).height(560).fit("crop").auto("format").url()
        : "",
    }));

  const ld = [
    creativeWorkSchema({ name: c.title, description: c.summary, url }),
    breadcrumbList([
      { name: "Home", url: "/" },
      { name: "Work", url: "/#work" },
      { name: c.title, url },
    ]),
  ];
  // Enrich CreativeWork with cover + date (creativeWorkSchema keeps a
  // narrow signature; we add fields the page actually has).
  if (coverOg) (ld[0] as Record<string, unknown>).image = coverOg;
  if (c.publishedAt) (ld[0] as Record<string, unknown>).dateCreated = c.publishedAt;

  return (
    <SiteHeader>
      <main className="min-h-svh bg-paper text-ink px-6 md:px-10 py-24 md:py-32">
      <JsonLd data={ld} />

      <article className="mx-auto w-full max-w-[860px]">
        <p className="text-body opacity-60 mb-4">Case study</p>
        <h1 className="font-archivo text-display leading-[0.95] tracking-[-0.02em] mb-6">
          {c.title}
        </h1>
        <p className="text-body-lg leading-snug opacity-80 mb-10 max-w-[640px]">
          {c.summary}
        </p>

        {/* Meta row: client / year / roles */}
        {(c.client || c.year || (c.roles && c.roles.length > 0)) && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-current/15 pt-6 mb-12">
            {c.client && (
              <div>
                <dt className="text-mono uppercase opacity-50 mb-1">Client</dt>
                <dd className="text-body">{c.client}</dd>
              </div>
            )}
            {c.year && (
              <div>
                <dt className="text-mono uppercase opacity-50 mb-1">Year</dt>
                <dd className="text-body">{c.year}</dd>
              </div>
            )}
            {c.roles && c.roles.length > 0 && (
              <div>
                <dt className="text-mono uppercase opacity-50 mb-1">Role</dt>
                <dd className="text-body">{c.roles.join(", ")}</dd>
              </div>
            )}
          </dl>
        )}

        {coverUrl && (
          <figure className="mb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={c.title}
              loading="eager"
              decoding="async"
              className="block w-full h-auto rounded-[12px]"
            />
          </figure>
        )}

        <Section title="Challenge" body={c.challenge} />
        <Section title="Approach" body={c.approach} />
        <Section title="Solution" body={c.solution} />

        {/* Outcomes / metrics */}
        {c.outcomes && c.outcomes.length > 0 && (
          <section className="my-16 border-t border-current/15 pt-10">
            <h2 className="text-mono uppercase opacity-50 mb-6">Outcome</h2>
            <div className="grid grid-cols-2 min-[1200px]:grid-cols-4 gap-8">
              {c.outcomes.map((o, i) => (
                <div key={i}>
                  <p className="font-archivo text-card-h3 leading-[1] tracking-[-0.02em] mb-2">
                    {o.value}
                  </p>
                  <p className="text-body opacity-70">{o.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {c.gallery && c.gallery.length > 0 && (
          <section className="my-16 grid grid-cols-1 gap-6">
            {c.gallery.map((g, i) =>
              g ? (
                <figure key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlFor(g).width(1600).fit("max").auto("format").url()}
                    alt={`${c.title} — image ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="block w-full h-auto rounded-[12px]"
                  />
                </figure>
              ) : null,
            )}
          </section>
        )}

        {/* Takeaway */}
        {c.takeaway && (
          <section className="my-16 border-t border-current/15 pt-10">
            <h2 className="text-mono uppercase opacity-50 mb-4">Takeaway</h2>
            <p className="text-body-lg leading-snug opacity-90 max-w-[640px]">
              {c.takeaway}
            </p>
          </section>
        )}

        <div className="mt-16 flex items-center border-t border-current/15 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
          >
            ← Back to studio
          </Link>
        </div>
      </article>
      </main>

      {/* More work — looped, single-row carousel of the other cases. */}
      {others.length > 0 && (
        <section className="bg-paper text-ink pb-24 md:pb-28 pt-4 overflow-hidden">
          <h2 className="text-mono uppercase opacity-50 px-6 md:px-10 mb-8">
            More work
          </h2>
          <div className="pl-6 md:pl-10">
            <CaseCarousel cases={others} />
          </div>
        </section>
      )}

      {/* Footer — same contact card as the homepage. */}
      <footer className="bg-paper text-ink pb-28 md:pb-32 pt-4">
        <ContactCard />
      </footer>

      {/* Next project — full-bleed teaser after the footer. A real
          <Link> (prefetched by Next) keeps each case its own indexable
          URL: no duplicate content, instant navigation. */}
      {next && (
        <Link
          href={`/work/${next.slug}`}
          className="group relative block overflow-hidden bg-ink text-paper"
        >
          {nextCover && <NextProjectCover src={nextCover} />}
          <div className="relative mx-auto max-w-[860px] px-6 md:px-10 py-24 md:py-32 text-center">
            <p className="text-mono uppercase opacity-70 mb-5">Next project</p>
            <h2 className="font-archivo text-display leading-[0.95] tracking-[-0.02em] mb-6">
              {next.title}
            </h2>
            <span className="inline-flex items-center gap-2 text-body border-b border-current pb-0.5 group-hover:opacity-70 transition-opacity">
              View case →
            </span>
          </div>
        </Link>
      )}
    </SiteHeader>
  );
}

function Section({
  title,
  body,
}: {
  title: string;
  body: unknown[] | null;
}) {
  if (!body || body.length === 0) return null;
  return (
    <section className="my-12">
      <h2 className="text-mono uppercase opacity-50 mb-4">{title}</h2>
      <div className="prose-studio text-body-lg leading-relaxed max-w-[640px]">
        <PortableText
          value={body as PortableTextBlock[]}
          components={portableComponents}
        />
      </div>
    </section>
  );
}
