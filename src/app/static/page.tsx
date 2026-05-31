import Link from "next/link";
import { getAllPosts, getAllCaseStudies } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import manifest from "@/data/artworks.json";

// Static, animation-free snapshot of the homepage sections — no menu,
// no goo backdrop, no infinite scroll, no scroll-driven motion. Just the
// section box (relative min-h-screen flex items-center justify-center
// py-24 px-6 md:px-10) and its settled-state content, on natural document
// scroll. Hero + Contact/footer intentionally omitted.
//
// Self-contained on purpose: it replicates the cards' settled markup
// rather than reusing the animated components, so the real homepage
// components stay untouched and this page carries zero client JS.

export const revalidate = 60;

const ART: string[] = (manifest as Array<{ url: string }>).map((m) => m.url);

const SECTION = "relative min-h-screen flex items-center justify-center py-24 px-6 md:px-10";

const services = [
  {
    title: "Brand",
    desc: "Identity, naming, brand systems.",
    href: "/services/brand",
    img: "/wedo/branding.png",
  },
  {
    title: "Web",
    desc: "Framer websites, landing pages, UI design.",
    href: "/services/web",
    img: "/wedo/web.png",
  },
  {
    title: "Digital & AI",
    desc: "AI visuals, content direction, campaigns.",
    href: "/services/ai",
    img: "/wedo/digital+ai.png",
  },
];

const steps = [
  {
    title: "01. Brief & alignment",
    desc: "We start with a 30-min call. You tell us what's going on. We tell you if we're a fit.",
    img: ART[5],
  },
  {
    title: "02. Strategy & direction",
    desc: "Before pixels, we agree on what we're solving and how to measure it.",
    img: ART[22],
  },
  {
    title: "03. Design & build",
    desc: "Founders run the project end-to-end. You see progress weekly, not at the deadline.",
    img: "/How/how_3.png",
  },
  {
    title: "04. Launch & after",
    desc: "We hand over a system you can run yourself. And we don't disappear when it ships.",
    img: ART[165],
  },
];

export default async function StaticHome() {
  const [posts, caseStudies] = await Promise.all([
    getAllPosts(),
    getAllCaseStudies(),
  ]);

  const cases = caseStudies.map((c, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: c.title,
    desc: c.summary,
    href: `/work/${c.slug}`,
    img: c.cover
      ? urlFor(c.cover).width(900).height(560).fit("crop").auto("format").url()
      : "",
  }));

  const latestPosts = posts.slice(0, 3);

  return (
    <main className="bg-white text-[#121212]">
      {/* ── Selected work ─────────────────────────────────────────── */}
      <section className={SECTION}>
        <div className="w-full md:w-[70vw] max-w-[1280px] mx-auto">
          <h2 className="font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mb-12">
            Selected work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-4 md:gap-20">
            {cases.map((c) => (
              <article
                key={c.href}
                className="w-full max-w-[600px] flex flex-col bg-paper text-ink shadow-card overflow-hidden rounded-[1rem]"
              >
                <Link href={c.href} className="group flex flex-col h-full">
                  <div className="relative h-[280px] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.img}
                      alt={c.title}
                      className="block w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7 flex flex-col flex-1">
                    <h3 className="font-archivo text-card-h3 tracking-[-0.02em] leading-[1.1] mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity">
                      {c.title}
                    </h3>
                    <p className="text-body leading-snug opacity-80 mb-4 line-clamp-4">
                      {c.desc}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 text-body group-hover:opacity-60 transition-opacity">
                      View case →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we do ────────────────────────────────────────────── */}
      <section className={SECTION}>
        <div className="w-full lg:w-[90vw] min-[1440px]:w-[70vw] max-w-[1920px] mx-auto">
          <h2 className="font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mb-12">
            What we do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {services.map((sv) => (
              <article
                key={sv.href}
                className="relative min-h-[280px] md:min-h-[360px] shadow-card overflow-hidden rounded-[1rem]"
              >
                <Link href={sv.href} className="group block w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sv.img}
                    alt={sv.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/15" />
                  <div className="relative z-10 flex flex-col h-full min-h-[280px] md:min-h-[360px] p-7 md:p-8 text-white">
                    <h3 className="font-archivo text-card-h3 tracking-[-0.02em] leading-[1.1] mb-3">
                      {sv.title}
                    </h3>
                    <p className="text-body leading-snug opacity-90">{sv.desc}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How we work ───────────────────────────────────────────── */}
      <section className={SECTION}>
        <div className="w-full max-w-[900px] mx-auto">
          <h2 className="font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mb-12">
            How we work
          </h2>
          <div className="flex flex-col gap-6">
            {steps.map((step) => (
              <article
                key={step.title}
                className="relative flex bg-paper text-ink shadow-card overflow-hidden rounded-[1rem] min-h-[240px]"
              >
                <div className="md:hidden absolute inset-0 z-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block relative w-[240px] aspect-square shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.img}
                    alt={step.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="relative z-10 flex-1 p-7 md:p-10 flex flex-col justify-center text-white md:text-ink">
                  <h3 className="font-archivo text-card-h3 tracking-[-0.02em] leading-[1.1] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-body leading-snug opacity-80">{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journal ───────────────────────────────────────────────── */}
      <section className={SECTION}>
        <div className="w-full lg:w-[90vw] min-[1440px]:w-[70vw] max-w-[1920px] mx-auto">
          <h2 className="font-archivo text-card-title tracking-[-0.02em] leading-[1.1] mb-12">
            Journal
          </h2>
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {latestPosts.map((post) => {
                const coverUrl = post.cover
                  ? urlFor(post.cover).width(880).fit("max").auto("format").url()
                  : null;
                const date = new Date(post.publishedAt).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "short", day: "numeric" },
                );
                return (
                  <article
                    key={post._id}
                    className="w-full md:max-w-[600px] flex flex-col bg-paper text-ink shadow-card overflow-hidden rounded-[1rem]"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col h-full"
                    >
                      {coverUrl && (
                        <div className="relative h-[280px] w-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverUrl}
                            alt={post.title}
                            className="block w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="px-6 md:px-7 pb-6 md:pb-7 pt-7 flex flex-col flex-1">
                        <p className="text-body opacity-50 mb-3">{date}</p>
                        <h3 className="font-archivo text-card-h3 tracking-[-0.02em] leading-[1.1] mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-body leading-snug opacity-80 mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1 text-body group-hover:opacity-60 transition-opacity">
                          Read article →
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-body opacity-50">No posts yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
