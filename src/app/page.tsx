import { getAllPosts, getAllCaseStudies } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import type { CaseData } from "@/components/case-card";
import HomeClient from "./home-client";

export const revalidate = 60;

export default async function Home() {
  const [posts, caseStudies] = await Promise.all([
    getAllPosts(),
    getAllCaseStudies(),
  ]);

  const cases: CaseData[] = caseStudies.map((c, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: c.title,
    desc: c.summary,
    href: `/work/${c.slug}`,
    img: c.cover
      ? urlFor(c.cover).width(900).height(560).fit("crop").auto("format").url()
      : "",
  }));

  return <HomeClient latestPosts={posts.slice(0, 3)} cases={cases} />;
}
