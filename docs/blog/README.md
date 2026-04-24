# Blog — canonical authoring source

These 15 MDX files are the canonical source for the standalone documentation
site that will be built as a GitHub Pages deployment. They are **not**
rendered inside the Tauri desktop app.

## Where things live

| Audience         | Source                                                |
| ---------------- | ----------------------------------------------------- |
| In-app readers   | Short 3–4 sentence blurbs in `src/lib/calculators/registry.ts` (`blurb` field) |
| Docs site        | The `.mdx` files in this directory                    |
| Deep-dives       | Long-form posts — these files, rendered by an Astro/Next site on GitHub Pages |

## Wiring to calculator pages

Each calculator entry in the registry has an optional `blogSlug` that maps
to the filename here (minus `.mdx`):

```ts
{
  slug: "expected-value",
  blogSlug: "measuring-your-edge", // → docs/blog/measuring-your-edge.mdx
}
```

The app shows a "More detail → read the full write-up" link that opens
`${DOCS_BASE_URL}/blog/{blogSlug}` in the browser. When the docs site is
live, update `DOCS_BASE_URL` in `src/lib/calculators/registry.ts` to the
real URL.

## Known caveat

The source `.mdx` files were written for a Next.js app that imported React
components. Those imports won't work as-is in an Astro build — if you
migrate to a different generator, you may need to swap custom component
imports for equivalents, or strip them down to vanilla markdown.

## Authoring

Each `.mdx` starts with frontmatter (title, date, description, etc.) parsed
by `gray-matter`. Keep that pattern for any new posts so the future docs
site has predictable metadata.
