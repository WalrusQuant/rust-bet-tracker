<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { MatchOutput } from "../../lib/calculators/types";
  import { fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";

  let meanHome = $state(1.5);
  let meanAway = $state(1.2);
  let rHome = $state(5.0);
  let rAway = $state(5.0);
  let allowDraw = $state(true);
  let spreadLinesStr = $state("-1.5, -0.5, 0.5, 1.5");
  let totalLinesStr = $state("1.5, 2.5, 3.5, 4.5");
  let maxScore = $state(15);

  const spreadLines = $derived(
    spreadLinesStr.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n))
  );
  const totalLines = $derived(
    totalLinesStr.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n))
  );

  let output = $state<MatchOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = {
      mean_home: Number(meanHome),
      mean_away: Number(meanAway),
      r_home: Number(rHome),
      r_away: Number(rAway),
      max_score: Math.floor(Number(maxScore)),
      allow_draw: allowDraw,
      spread_lines: spreadLines,
      total_lines: totalLines,
    };
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.nbinomMatch(payload).then((r) => (output = r)).catch(() => (output = null));
    }, 150);
  });
</script>

<CalcShell
  title="NEGATIVE BINOMIAL MATCH"
  kicker="Overdispersed scoring"
  blurb="Like Poisson, but allows variance greater than the mean — useful when scoring has fat tails (blowouts happen more than Poisson predicts). The dispersion parameter r controls the extra variance: lower r = more overdispersion. As r → ∞ it converges to Poisson."
  blogSlug="negative-binomial-match-prediction"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Mean Home">
          <input type="number" min="0" step="0.1" bind:value={meanHome} class="input num" />
        </FormRow>
        <FormRow label="Mean Away">
          <input type="number" min="0" step="0.1" bind:value={meanAway} class="input num" />
        </FormRow>
        <FormRow label="r Home" hint="Lower = more overdispersion">
          <input type="number" min="0.1" step="0.5" bind:value={rHome} class="input num" />
        </FormRow>
        <FormRow label="r Away">
          <input type="number" min="0.1" step="0.5" bind:value={rAway} class="input num" />
        </FormRow>
      </FormGroup>
      <FormRow label="Allow draws?">
        <select bind:value={allowDraw} class="input">
          <option value={true}>Yes (soccer)</option>
          <option value={false}>No (MLB, NHL)</option>
        </select>
      </FormRow>
      <FormRow label="Spread lines"><input type="text" bind:value={spreadLinesStr} class="input" /></FormRow>
      <FormRow label="Total lines"><input type="text" bind:value={totalLinesStr} class="input" /></FormRow>
      <FormRow label="Max score"><input type="number" min="5" max="40" step="1" bind:value={maxScore} class="input num" /></FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <div class="kicker">Moneyline</div>
        <ResultRow label="Home win" value={fmtProbPct(output.home_win)} tone="highlight" />
        {#if allowDraw}
          <ResultRow label="Draw" value={fmtProbPct(output.draw)} />
        {/if}
        <ResultRow label="Away win" value={fmtProbPct(output.away_win)} tone="highlight" />

        {#if output.spreads.length > 0}
          <div class="kicker mt-4">Spreads</div>
          <table class="data-table">
            <thead><tr><th>Spread</th><th style="text-align: right">Home</th><th style="text-align: right">Away</th></tr></thead>
            <tbody>
              {#each output.spreads as s}
                <tr><td class="num">{s.spread}</td><td class="num" style="text-align: right">{fmtProbPct(s.home_covers)}</td><td class="num" style="text-align: right">{fmtProbPct(s.away_covers)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}

        {#if output.totals.length > 0}
          <div class="kicker mt-4">Totals</div>
          <table class="data-table">
            <thead><tr><th>Line</th><th style="text-align: right">Over</th><th style="text-align: right">Under</th></tr></thead>
            <tbody>
              {#each output.totals as t}
                <tr><td class="num">{t.line}</td><td class="num" style="text-align: right">{fmtProbPct(t.over)}</td><td class="num" style="text-align: right">{fmtProbPct(t.under)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}

        <div class="kicker mt-4">Top scorelines</div>
        <table class="data-table">
          <thead><tr><th>Score</th><th style="text-align: right">Probability</th></tr></thead>
          <tbody>
            {#each output.top_scorelines as sc}
              <tr><td class="num">{sc.home}–{sc.away}</td><td class="num" style="text-align: right">{fmtProbPct(sc.prob)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </OutputSection>
  </div>
</CalcShell>
