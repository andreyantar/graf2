"use client";

/**
 * Sanity Studio config — mounted at /studio (see
 * src/app/studio/[[...tool]]/page.tsx). Schemas live in
 * src/sanity/schemas; env values in src/sanity/env.ts.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemas";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
});
