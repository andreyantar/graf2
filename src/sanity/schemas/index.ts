import type { SchemaTypeDefinition } from "sanity";
import { post } from "./post";
import { caseStudy } from "./caseStudy";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [post, caseStudy],
};
