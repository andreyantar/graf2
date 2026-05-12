import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/sanity/queries";
import { isSanityConfigured } from "@/sanity/env";

export const metadata: Metadata = {
  title: "Journal — Studio Graffiti",
  description: "Notes, takeaways, and field reports from the studio.",
};

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-svh bg-paper text-ink px-6 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="font-mono text-mono uppercase tracking-widest opacity-60 mb-4">
          Journal
        </p>
        <h1 className="font-heavy text-display leading-[0.95] tracking-[-0.02em] mb-12">
          Studio writing
        </h1>

        {posts.length === 0 ? (
          <p className="font-mono text-mono uppercase tracking-widest opacity-50">
            {isSanityConfigured
              ? "No posts yet."
              : "Connect a Sanity project (NEXT_PUBLIC_SANITY_PROJECT_ID + NEXT_PUBLIC_SANITY_DATASET) and publish a post in /studio to populate this list."}
          </p>
        ) : (
          <ul className="divide-y divide-current/15">
            {posts.map((p) => (
              <li key={p._id} className="py-6">
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block"
                >
                  <p className="font-mono text-mono uppercase tracking-widest opacity-50 mb-2">
                    {new Date(p.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h2 className="font-heavy text-card-title tracking-[-0.02em] leading-tight mb-2 group-hover:opacity-70 transition-opacity">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="text-body-lg leading-snug opacity-70 line-clamp-2">
                      {p.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/"
          className="mt-16 inline-flex items-center gap-2 font-mono text-mono uppercase tracking-widest border-b border-current pb-0.5 hover:opacity-60 transition-opacity"
        >
          ← Back to studio
        </Link>
      </div>
    </main>
  );
}
