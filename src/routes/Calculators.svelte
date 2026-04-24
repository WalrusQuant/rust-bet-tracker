<script lang="ts">
  import { link } from "svelte-spa-router";
  import {
    CALCULATORS,
    CATEGORY_LABELS,
    CATEGORY_KICKERS,
    CATEGORY_ORDER,
    byCategory,
  } from "../lib/calculators/registry";
  import CalcIcon from "../lib/components/calc/CalcIcon.svelte";
  import SketchDivider from "../lib/components/SketchDivider.svelte";
  import Ghost from "../lib/components/Ghost.svelte";

  const groups = $derived(byCategory());
</script>

<header>
  <div class="kicker">Tools for thinking</div>
  <h1 class="display display-xl mt-2">THE CALCULATORS.</h1>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

<p class="mt-6 text-sm text-secondary max-w-3xl">
  Twenty-one focused tools for odds math, bet sizing, market analysis, and
  simulations. Every result is computed locally in Rust — no network, no
  tracking. Pick one to dive in.
</p>

{#if CALCULATORS.length === 0}
  <div class="mt-10 card flex flex-col items-center py-16">
    <Ghost pose="sitting" size={140} />
    <p class="mt-4 display display-md">NO CALCULATORS WIRED UP YET.</p>
    <p class="mt-2 text-secondary text-sm">
      Phase 0 scaffolding is in. Phase 1 will light up the first 11.
    </p>
  </div>
{:else}
  {#each CATEGORY_ORDER as cat}
    {#if groups[cat].length > 0}
      <section class="mt-10">
        <div class="kicker">{CATEGORY_KICKERS[cat]}</div>
        <h2 class="display display-lg mt-1">{CATEGORY_LABELS[cat].toUpperCase()}.</h2>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each groups[cat] as entry (entry.slug)}
            <a
              href={`/calculators/${entry.slug}`}
              use:link
              class="card"
              style="text-decoration: none; color: inherit; display: block; transition: transform 0.15s ease;"
            >
              <div class="flex items-start gap-3">
                <CalcIcon glyph={entry.glyph} />
                <div class="min-w-0 flex-1">
                  <div class="font-semibold">{entry.name}</div>
                  <p class="mt-1 text-xs text-secondary line-clamp-3">
                    {entry.blurb}
                  </p>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/each}
{/if}
