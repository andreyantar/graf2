function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://studio-graffiti.pl";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Studio Graffiti";

export const SITE_DESCRIPTION =
  "A small independent studio. We design brands, interfaces, and the edges in between.";
