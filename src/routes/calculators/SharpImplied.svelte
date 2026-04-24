<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { SharpImpliedOutput } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtPct, fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";

  let homeML = $state(-120);
  let awayML = $state(110);
  let spread = $state<number | null>(null);
  let total = $state<number | null>(null);
  let output = $state<SharpImpliedOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const h = Number(homeML);
    const a = Number(awayML);
    const sp = spread === null ? null : Number(spread);
    const tt = total === null ? null : Number(total);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.sharpImplied({ home_american: h, away_american: a, spread: sp, total: tt })
        .then((o) => (output = o))
        .catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="SHARP IMPLIED"
  kicker="True probability from the market"
  blurb="Take a two-way moneyline, strip the vig, and get each side's fair probability. Optionally add spread and total to project per-team scoring. The no-vig line from a sharp book is the closest thing to a true probability you'll get."
  blogSlug="devig-methods-compared"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2} label="Moneyline">
        <FormRow label="Home">
          <input type="number" bind:value={homeML} class="input num" />
        </FormRow>
        <FormRow label="Away">
          <input type="number" bind:value={awayML} class="input num" />
        </FormRow>
      </FormGroup>
      <FormGroup cols={2} label="Optional: spread + total">
        <FormRow label="Home spread" hint="Negative if home favored">
          <input type="number" step="0.5" bind:value={spread} class="input num" placeholder="—" />
        </FormRow>
        <FormRow label="Total">
          <input type="number" step="0.5" min="0" bind:value={total} class="input num" placeholder="—" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultRow label="Home implied" value={fmtProbPct(output.home_implied)} />
        <ResultRow label="Away implied" value={fmtProbPct(output.away_implied)} />
        <ResultRow label="Book margin" value={fmtPct(output.margin_pct)} tone="neutral" />
        <div class="kicker mt-3">After devigging</div>
        <ResultRow
          label="Home fair prob"
          value={fmtProbPct(output.home_fair_prob)}
          sublabel={fmtOddsAmerican(output.home_fair_american) + " no-vig"}
          tone="highlight"
        />
        <ResultRow
          label="Away fair prob"
          value={fmtProbPct(output.away_fair_prob)}
          sublabel={fmtOddsAmerican(output.away_fair_american) + " no-vig"}
          tone="highlight"
        />
        {#if output.home_score_projection !== null && output.away_score_projection !== null}
          <div class="kicker mt-3">Score projection</div>
          <ResultRow label="Home score" value={output.home_score_projection.toFixed(1)} />
          <ResultRow label="Away score" value={output.away_score_projection.toFixed(1)} />
        {/if}
      {/if}
    </OutputSection>
  </div>
</CalcShell>
