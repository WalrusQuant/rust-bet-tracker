<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { TeaserOutput } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtPct, fmtProbPct, tone } from "../../lib/calculators/format";
  import { SPORT_DEFAULTS } from "../../lib/calculators/sports";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  interface LegInput { spread: number; odds: number; }
  let legs = $state<LegInput[]>([
    { spread: -7.5, odds: -110 },
    { spread: -3.5, odds: -110 },
  ]);
  let teaserPts = $state(6);
  let teaserOdds = $state(-110);
  let sport = $state("nfl");
  let std = $state(14.2);

  $effect(() => {
    const cfg = SPORT_DEFAULTS[sport];
    if (cfg) std = cfg.spread_std;
  });

  function addLeg() { if (legs.length < 5) legs = [...legs, { spread: -3.5, odds: -110 }]; }
  function removeLeg(i: number) { if (legs.length > 2) legs = legs.filter((_, idx) => idx !== i); }

  let output = $state<TeaserOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = {
      legs: legs.map((l) => ({ spread: Number(l.spread), odds: Number(l.odds) })),
      teaser_pts: Number(teaserPts),
      teaser_odds: Number(teaserOdds),
      std: Number(std),
    };
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.teaser(payload).then((r) => (output = r)).catch(() => (output = null));
    }, 120);
  });
</script>

<CalcShell
  title="TEASER EV"
  kicker="NFL / NCAAF teaser math"
  blurb="A teaser moves each leg's spread by a fixed number of points in your favor. We back out each leg's true line, compute the teased cover probability, and tell you if the teaser's price gives you an edge versus fair. Flags crossings of the key numbers 3, 7, 10, 14."
  blogSlug="teaser-ev-analysis"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Sport">
          <select bind:value={sport} class="input">
            <option value="nfl">NFL (σ≈14.2)</option>
            <option value="ncaaf">NCAAF (σ≈22.6)</option>
          </select>
        </FormRow>
        <FormRow label="Std dev">
          <input type="number" step="0.1" bind:value={std} class="input num" />
        </FormRow>
      </FormGroup>
      <FormGroup cols={2}>
        <FormRow label="Teaser points" hint="Standard NFL: 6">
          <input type="number" min="0" step="0.5" bind:value={teaserPts} class="input num" />
        </FormRow>
        <FormRow label="Teaser odds">
          <input type="number" bind:value={teaserOdds} class="input num" />
        </FormRow>
      </FormGroup>
      <div>
        <span class="kicker mb-2 block">Legs</span>
        <div class="space-y-2">
          {#each legs as _, i (i)}
            <div class="flex items-center gap-3">
              <span class="kicker" style="width: 55px">Leg {i + 1}</span>
              <input type="number" step="0.5" bind:value={legs[i].spread} class="input num flex-1" placeholder="Spread" />
              <input type="number" bind:value={legs[i].odds} class="input num flex-1" placeholder="Odds" />
              {#if legs.length > 2}
                <button type="button" class="link-btn danger" onclick={() => removeLeg(i)}>Remove</button>
              {/if}
            </div>
          {/each}
          <button type="button" class="btn btn-secondary btn-sm mt-3" onclick={addLeg}>+ Add leg</button>
        </div>
      </div>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Teaser EV"
          value={fmtPct(output.ev_pct)}
          tone={tone(output.ev_pct)}
          sublabel={`Combined prob: ${fmtProbPct(output.combined_prob)}`}
        />
        <ResultRow label="Fair teaser odds" value={fmtOddsAmerican(output.fair_teaser_odds)} tone="highlight" />
        <ResultRow label="Book teaser odds" value={fmtOddsAmerican(output.book_teaser_odds)} />
        <ResultRow label="Break-even prob" value={fmtProbPct(output.break_even_prob)} />
        <div class="kicker mt-4">Legs</div>
        {#each output.legs as leg, i}
          <div style="border-top: 1px solid var(--bg-sunken); padding: 10px 0;">
            <div class="flex justify-between items-baseline">
              <span class="font-semibold text-sm">Leg {i + 1}: {leg.spread > 0 ? "+" : ""}{leg.spread} → {leg.teased_spread > 0 ? "+" : ""}{leg.teased_spread}</span>
              <span class="num font-semibold text-sm">{fmtProbPct(leg.cover_prob)}</span>
            </div>
            <div class="text-xs text-muted mt-1">
              Fair odds {fmtOddsAmerican(leg.fair_odds)} · true line {leg.true_line.toFixed(2)}
              {#if leg.key_numbers_crossed.length > 0}
                <span class="chip chip-won ml-2" style="font-size: 9px">crosses {leg.key_numbers_crossed.join(", ")}</span>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </OutputSection>
  </div>
</CalcShell>
