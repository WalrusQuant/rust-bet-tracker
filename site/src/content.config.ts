import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts live in ../docs/blog (outside the Astro site root) so the
// MDX files stay co-located with the rest of the repo and the Tauri app
// can keep them as the canonical source. Paths are relative to astro.config.mjs.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "../docs/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
