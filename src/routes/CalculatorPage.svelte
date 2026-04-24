<script lang="ts">
  import { findBySlug } from "../lib/calculators/registry";
  import Ghost from "../lib/components/Ghost.svelte";
  import { link } from "svelte-spa-router";

  interface Props {
    params?: { slug?: string };
  }
  let { params }: Props = $props();

  const slug = $derived(params?.slug ?? "");
  const entry = $derived(findBySlug(slug));

  let Component = $state<any>(null);
  let loadError = $state<string | null>(null);

  $effect(() => {
    const e = entry;
    if (!e) {
      Component = null;
      return;
    }
    loadError = null;
    e.component()
      .then((mod) => (Component = mod.default))
      .catch((err) => {
        loadError = String(err);
        Component = null;
      });
  });
</script>

{#if !entry}
  <div class="card flex flex-col items-center py-16">
    <Ghost pose="thinking" size={140} />
    <p class="mt-4 display display-md">CALCULATOR NOT FOUND.</p>
    <p class="mt-2 text-secondary text-sm">
      No calculator is registered at "/calculators/{slug}".
    </p>
    <a href="/calculators" use:link class="btn btn-primary mt-6">
      ← Back to all calculators
    </a>
  </div>
{:else if loadError}
  <div class="card" style="border-color: var(--loss)">
    <div class="kicker" style="color: var(--loss)">Failed to load</div>
    <p class="mt-2 text-sm">{loadError}</p>
  </div>
{:else if Component}
  <Component />
{:else}
  <p class="text-secondary text-sm">Loading {entry.name}…</p>
{/if}
