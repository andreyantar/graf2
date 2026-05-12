import { getAllPosts } from "@/sanity/queries";
import HomeClient from "./home-client";

export const revalidate = 60;

export default async function Home() {
  const posts = await getAllPosts();
  return <HomeClient latestPosts={posts.slice(0, 3)} />;
}
