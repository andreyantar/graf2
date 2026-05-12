/**
 * Bypass the root <html><body> wrapping for the Studio so Sanity can
 * own the full document chrome and styles.
 */
export const metadata = {
  title: "Studio — Studio Graffiti",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
