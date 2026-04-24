<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { VigBookResult } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtPct, fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";

  interface BookInput { name: string; oddsA: number; oddsB: number; }

  let books = $state<BookInput[]>([
    { name: "DraftKings", oddsA: -110, oddsB: -110 },
    { name: "FanDuel", oddsA: -108, oddsB: -112 },
    { name: "BetMGM", oddsA: -115, oddsB: -105 },
  ]);
  let results = $state<VigBookResult[]>([]);

  function addBook() {
    if (books.length < 10) books = [...books, { name: `Book ${books.length + 1}`, oddsA: -110, oddsB: -110 }];
  }
  function removeBook(i: number) {
    if (books.length > 1) books = books.filter((_, idx) => idx !== i);
  }

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = books.map((b) => ({ name: b.name, odds_a: Number(b.oddsA), odds_b: Number(b.oddsB) }));
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.vigCompare({ books: payload })
        .then((r) => (results = r))
        .catch(() => (results = []));
    }, 120);
  });
</script>

<CalcShell
  title="VIG COMPARISON"
  kicker="Which book is cheapest?"
  blurb="Line-shop across sportsbooks for the same two-sided market. The lower the vig, the closer to fair odds you're getting — always bet at the sharpest book when the difference is meaningful."
  blogSlug="hold-vig-and-arbitrage"
>
  <InputCard title="Books">
    <div class="space-y-2">
      {#each books as _, i (i)}
        <div class="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
          <input type="text" bind:value={books[i].name} class="input" placeholder="Book name" />
          <input type="number" bind:value={books[i].oddsA} class="input num" placeholder="Side A" />
          <input type="number" bind:value={books[i].oddsB} class="input num" placeholder="Side B" />
          {#if books.length > 1}
            <button type="button" class="link-btn danger" onclick={() => removeBook(i)}>Remove</button>
          {:else}
            <span></span>
          {/if}
        </div>
      {/each}
      <button type="button" class="btn btn-secondary btn-sm mt-3" onclick={addBook}>+ Add book</button>
    </div>
  </InputCard>

  <div class="mt-5">
    <OutputSection title="Sharpest first">
      {#if results.length > 0}
        <table class="data-table">
          <thead>
            <tr>
              <th>Book</th>
              <th style="text-align: right">Vig</th>
              <th style="text-align: right">Fair A</th>
              <th style="text-align: right">Fair B</th>
              <th style="text-align: right">No-vig A</th>
              <th style="text-align: right">No-vig B</th>
            </tr>
          </thead>
          <tbody>
            {#each results as r, i}
              <tr>
                <td>
                  <span class="font-semibold">{r.name}</span>
                  {#if i === 0}
                    <span class="chip chip-won ml-2" style="font-size: 9px">Sharpest</span>
                  {/if}
                </td>
                <td class="num text-sm" style="text-align: right"
                    class:text-win={r.vig_pct < 3}
                    class:text-loss={r.vig_pct > 5}>
                  {fmtPct(r.vig_pct)}
                </td>
                <td class="num text-sm" style="text-align: right">{fmtOddsAmerican(r.fair_american_a)}</td>
                <td class="num text-sm" style="text-align: right">{fmtOddsAmerican(r.fair_american_b)}</td>
                <td class="num text-sm" style="text-align: right">{fmtProbPct(r.no_vig_prob_a)}</td>
                <td class="num text-sm" style="text-align: right">{fmtProbPct(r.no_vig_prob_b)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </OutputSection>
  </div>
</CalcShell>
