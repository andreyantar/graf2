import type { Metadata } from "next";
import { LoaderPreviewClient } from "./loader-preview-client";

export const metadata: Metadata = {
  title: "Loader preview — Studio Graffiti",
  robots: { index: false, follow: false },
};

export default function LoaderPreviewPage() {
  return <LoaderPreviewClient />;
}
