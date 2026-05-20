import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { CookiesBanner } from "@/components/cookies-banner";
import "./globals.css";

// Variable Archivo (wght + wdth axes) is now the only typeface on
// the site — body inherits the default instance, headings/goo/menu
// override via the `.font-archivo` utility class in globals.css
// (wdth 125 / wght 450). Instrument Sans removed.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — independent brand & product studio`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — independent brand & product studio`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — independent brand & product studio`,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: { url: "/favicon/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        {/* Pre-hydration: mark <html> if the preloader has already
            played this session. Pairs with the CSS rule in globals.css
            that hides [data-preloader-overlay] synchronously, so
            repeat visits don't flash the loading frame. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('sg-preloader-seen')==='1'){document.documentElement.setAttribute('data-preloader-seen','1')}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              logo: `${SITE_URL}/studio_graffiti_logo.svg`,
            }),
          }}
        />
        {children}
        <CookiesBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
