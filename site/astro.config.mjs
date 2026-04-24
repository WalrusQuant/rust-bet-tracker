import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Repo is WalrusQuant/rust-bet-tracker, so Pages serves at
// https://walrusquant.github.io/rust-bet-tracker/
export default defineConfig({
  site: "https://walrusquant.github.io",
  base: "/rust-bet-tracker",
  trailingSlash: "ignore",
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap(),
  ],
});
