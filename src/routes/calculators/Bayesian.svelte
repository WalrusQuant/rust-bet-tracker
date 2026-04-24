<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { BayesianOutput } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";

  let homeML = $state(-120);
  let awayML = $state(100);
  let modelProbHomePct = $state(58);
  let marketN = $state(100);
  let modelN = $state(50);
  let output = $state<BayesianOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const h = Number(homeML);
    const a = Number(awayML);
    const mp = Number(modelProbHomePct) / 100;
    const mN = Number(marketN);
    const dN = Number(modelN);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.bayesian({
        mkt_home_american: h,
        mkt_away_american: a,
        model_prob_home: mp,
        market_n: mN,
        model_n: dN,
      }).then((o) => (output = o)).catch(() => (output = null));
    }, 120);
  });
</script>

<CalcShell
  title="BAYESIAN ODDS"
  kicker="Market prior + your model"
  blurb="Combine a sharp market line (prior) with your own model's probability (evidence) using a Beta-Binomial update. The weights come from how much confidence each source carries — expressed as pseudo-counts."
  blogSlug="bayesian-odds-explained"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup label="Market moneyline" cols={2}>
        <FormRow label="Home">
          <input type="number" bind:value={homeML} class="input num" />
        </FormRow>
        <FormRow label="Away">
          <input type="number" bind:value={awayML} class="input num" />
        </FormRow>
      </FormGroup>
      <FormRow label="Your model: P(home wins) %" hint="Your standalone estimate">
        <input type="number" min="0" max="100" step="0.1" bind:value={modelProbHomePct} class="input num" />
      </FormRow>
      <FormGroup cols={2}>
        <FormRow label="Market weight (N)" hint="Higher = trust market more">
          <input type="number" min="1" step="1" bind:value={marketN} class="input num" />
        </FormRow>
        <FormRow label="Model weight (N)" hint="Higher = trust model more">
          <input type="number" min="1" step="1" bind:value={modelN} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <div class="kicker">Market (no-vig prior)</div>
        <ResultRow label="Home fair prob" value={fmtProbPct(output.mkt_fair_home)} />
        <ResultRow label="Away fair prob" value={fmtProbPct(output.mkt_fair_away)} />
        <div class="kicker mt-4">Posterior</div>
        <ResultRow label="Home" value={fmtProbPct(output.post_prob_home)} sublabel={fmtOddsAmerican(output.post_fair_american_home) + " fair"} tone="highlight" />
        <ResultRow label="Away" value={fmtProbPct(output.post_prob_away)} sublabel={fmtOddsAmerican(output.post_fair_american_away) + " fair"} tone="highlight" />
        <div class="kicker mt-4">Beta parameters</div>
        <ResultRow label="Prior (α, β)" value={`${output.prior_alpha.toFixed(1)}, ${output.prior_beta.toFixed(1)}`} />
        <ResultRow label="Posterior (α, β)" value={`${output.posterior_alpha.toFixed(1)}, ${output.posterior_beta.toFixed(1)}`} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
