<script lang="ts">
  import SketchDivider from "../SketchDivider.svelte";
  import { link } from "svelte-spa-router";
  import { DOCS_BASE_URL } from "../../calculators/registry";

  interface Props {
    title: string;
    kicker?: string;
    blurb?: string;
    blogSlug?: string;
    children?: import("svelte").Snippet;
  }
  let { title, kicker, blurb, blogSlug, children }: Props = $props();

  const blogHref = $derived(blogSlug ? `${DOCS_BASE_URL}/blog/${blogSlug}` : null);
</script>

<header class="flex flex-wrap items-end justify-between gap-4">
  <div>
    {#if kicker}
      <div class="kicker">{kicker}</div>
    {/if}
    <h1 class="display display-xl mt-2">{title}.</h1>
  </div>
  <a
    href="/calculators"
    use:link
    class="nav-link"
    style="font-size: 11px; letter-spacing: 0.14em;"
  >
    ← All calculators
  </a>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

{#if blurb}
  <p class="mt-6 text-sm text-secondary max-w-3xl">{blurb}</p>
  {#if blogHref}
    <p class="mt-2 text-xs text-muted">
      More detail →
      <a href={blogHref} target="_blank" rel="noopener noreferrer" class="underline">
        read the full write-up
      </a>
    </p>
  {/if}
{/if}

<div class="mt-8">
  {@render children?.()}
</div>
