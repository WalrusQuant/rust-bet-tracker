<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { DevigOutput } from "../../lib/calculators/types";
  import { fmtPct, fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";

  // Inputs: American odds per outcome. Convert to implied before sending.
  let oddsList = $state<number[]>([-110, -110]);
  let betOdds = $state<number | null>(null);
  let output = $state<DevigOutput | null>(null);

  function addOutcome() { if (oddsList.length < 5) oddsList = [...oddsList, -110]; }
  function removeOutcome(i: number) { if (oddsList.length > 2) oddsList = oddsList.filter((_, idx) => idx !== i); }
  function updateOutcome(i: number, v: number) { oddsList = oddsList.map((o, idx) => (idx === i ? v : o)); }

  function americanToImplied(o: number): number {
    if (o >= 100) return 100 / (o + 100);
    if (o <= -100) return -o / (-o + 100);
    return 0.5;
  }

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const probs = oddsList.map(americanToImplied);
    const bi = betOdds !== null ? americanToImplied(Number(betOdds)) : null;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.devig({ implied_probs: probs, bet_implied: bi })
        .then((o) => (output = o))
        .catch(() => (output = null));
    }, 120);
  });
</script>

<CalcShell
  title="DEVIG"
  kicker="Five ways to skin a vig"
  blurb="Remove the book's margin from a set of implied probabilities to estimate fair probabilities. Each method has different assumptions — use this to see the spread across methods so you know how sensitive your EV read is."
  blogSlug="devig-methods-compared"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard title="Market odds">
      <div class="space-y-2">
        {#each oddsList as _, i (i)}
          <div class="flex items-center gap-3">
            <span class="kicker" style="width: 80px">Outcome {i + 1}</span>
            <input
              type="number"
              value={oddsList[i]}
              oninput={(e) => updateOutcome(i, Number((e.target as HTMLInputElement).value))}
              class="input num flex-1"
            />
            {#if oddsList.length > 2}
              <button type="button" class="link-btn danger" onclick={() => removeOutcome(i)}>Remove</button>
            {/if}
          </div>
        {/each}
        <button type="button" class="btn btn-secondary btn-sm mt-3" onclick={addOutcome}>+ Add outcome</button>
      </div>
      <FormRow label="Your bet's odds (optional)" hint="For EV comparison against each method's fair prob for outcome 1">
        <input type="number" bind:value={betOdds} class="input num" placeholder="—" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <div class="text-sm text-secondary mb-3">
          Book margin: <span class="num font-semibold ml-1">{fmtPct(output.margin_pct)}</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Method</th>
              {#each oddsList as _, i}
                <th style="text-align: right">Outcome {i + 1}</th>
              {/each}
              {#if betOdds !== null}
                <th style="text-align: right">EV</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each output.methods as m}
              <tr>
                <td class="text-sm">{m.name}</td>
                {#if m.fair_probs}
                  {#each m.fair_probs as p}
                    <td class="num text-sm" style="text-align: right">{fmtProbPct(p)}</td>
                  {/each}
                {:else}
                  {#each oddsList as _, i}
                    <td class="num text-muted" style="text-align: right">—</td>
                  {/each}
                {/if}
                {#if betOdds !== null}
                  <td class="num text-sm" style="text-align: right"
                      class:text-win={m.ev_percent !== null && m.ev_percent > 0}
                      class:text-loss={m.ev_percent !== null && m.ev_percent < 0}>
                    {m.ev_percent !== null ? fmtPct(m.ev_percent) : "—"}
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </OutputSection>
  </div>
</CalcShell>
