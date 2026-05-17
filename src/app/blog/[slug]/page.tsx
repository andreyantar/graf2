import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextBlock } from "next-sanity";
import { getAllSlugs, getPostBySlug } from "@/sanity/queries";
import { portableComponents } from "@/sanity/portable-components";
import { urlFor } from "@/sanity/image";
import { JsonLd, articleSchema, breadcrumbList } from "@/lib/jsonld";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Studio Graffiti`,
    description: post.excerpt ?? undefined,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `/blog/${slug}`;
  const coverUrl = post.cover
    ? urlFor(post.cover).width(1280).fit("max").auto("format").url()
    : undefined;
  const ld = [
    articleSchema({
      title: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      imageUrl: coverUrl,
      url,
    }),
    breadcrumbList([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
      { name: post.title, url },
    ]),
  ];

  return (
    <main className="min-h-svh bg-paper text-ink px-6 py-24 md:py-32">
      <JsonLd data={ld} />
      <article className="mx-auto w-full max-w-[680px]">
        <p className="text-body opacity-50 mb-4">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <h1 className="font-archivo text-display leading-[0.95] tracking-[-0.02em] mb-8">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-body-lg leading-snug opacity-80 mb-12">
            {post.excerpt}
          </p>
        )}

        {post.cover && (
          <figure className="mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlFor(post.cover).width(1280).fit("max").auto("format").url()}
              alt={post.title}
              loading="eager"
              decoding="async"
              className="block w-full h-auto rounded-[8px]"
            />
          </figure>
        )}

        {post.body && (
          <div className="prose-studio text-body-lg leading-relaxed">
            <PortableText
              value={post.body as PortableTextBlock[]}
              components={portableComponents}
            />
          </div>
        )}

        <Link
          href="/blog"
          className="mt-16 inline-flex items-center gap-2 text-body border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          ← All posts
        </Link>
      </article>
    </main>
  );
}
