import type { PortableTextComponents } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "./image";

type SanityImage = SanityImageSource & {
  alt?: string;
};

/**
 * Custom renderers for blocks/types that Portable Text doesn't handle
 * out of the box. Add new entries here when the schema grows
 * (e.g. embeds, code blocks, callouts).
 */
export const portableComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: SanityImage }) => {
      if (!value) return null;
      const src = urlFor(value).width(1280).fit("max").auto("format").url();
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={value.alt ?? ""}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto rounded-[8px]"
          />
        </figure>
      );
    },
  },
};
