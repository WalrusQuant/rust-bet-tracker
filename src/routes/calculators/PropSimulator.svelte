<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { PropDistribution, PropSimOutput } from "../../lib/calculators/types";
  import { fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let distribution: PropDistribution = $state("lognormal");
  let mu = $state(250);
  let varMult = $state(80);
  let line = $state(249.5);
  let numSims = $state(20_000);
  let running = $state(false);
  let output = $state<PropSimOutput | null>(null);

  async function run() {
    running = true;
    try {
      output = await calcApi.propSim({
        distribution,
        mu: Number(mu),
        var_multiplier: Number(varMult),
        line: Number(line),
        num_sims: Math.floor(Number(numSims)),
        seed: null,
      });
    } finally {
      running = false;
    }
  }

  const chartData = $derived(output?.histogram ?? []);
  const maxCount = $derived(Math.max(1, ...chartData.map(b => b.count)));
</script>

<CalcShell
  title="PLAYER PROP SIMULATOR"
  kicker="Distribution-based prop pricing"
  blurb="Pick a distribution that matches your stat (Poisson for counts, LogNormal for yards, Gamma for continuous), set the mean and variance, and we sample to estimate over/under probability at your line. Use when no analytical formula fits cleanly."
  blogSlug="player-prop-simulation"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormRow label="Distribution" hint="Pick the shape that fits the stat">
        <select bind:value={distribution} class="input">
          <option value="poisson">Poisson (counts, mean=var)</option>
          <option value="nbinom">Neg. Binomial (counts, overdispersed)</option>
          <option value="gamma">Gamma (continuous, right-skewed)</option>
          <option value="lognormal">LogNormal (continuous, heavy-tail)</option>
        </select>
      </FormRow>
      <FormGroup cols={2}>
        <FormRow label="Mean (μ)" hint="Projected value">
          <input type="number" step="0.1" bind:value={mu} class="input num" />
        </FormRow>
        <FormRow label="Variance multiplier" hint="Var / mean (Poisson = 1)">
          <input type="number" min="0.1" step="0.5" bind:value={varMult} class="input num" />
        </FormRow>
        <FormRow label="Prop line">
          <input type="number" step="0.5" bind:value={line} class="input num" />
        </FormRow>
        <FormRow label="Simulations">
          <input type="number" min="1000" step="1000" bind:value={numSims} class="input num" />
        </FormRow>
      </FormGroup>
      <button type="button" class="btn btn-primary mt-3" onclick={run} disabled={running}>
        {running ? "Running…" : "Run simulation"}
      </button>
    </InputCard>

    <OutputSection>
      {#if output}
        <div class="grid grid-cols-2 gap-4">
          <ResultLarge label="P(Over)" value={fmtProbPct(output.prob_over)} tone={output.prob_over > 0.5 ? "win" : "neutral"} />
          <ResultLarge label="P(Under)" value={fmtProbPct(output.prob_under)} tone={output.prob_under > 0.5 ? "win" : "neutral"} />
        </div>
        {#if output.prob_push > 0}
          <ResultRow label="P(Push)" value={fmtProbPct(output.prob_push)} />
        {/if}
        <ResultRow label="Mean" value={output.mean.toFixed(2)} />
        <ResultRow label="Median" value={output.median.toFixed(2)} />
        <ResultRow label="Std dev" value={output.std_dev.toFixed(2)} />

        {#if chartData.length > 0}
          <div class="kicker mt-4">Distribution</div>
          <div class="mt-2 flex gap-0.5 items-end" style="height: 120px">
            {#each chartData as b}
              <div
                style={`flex: 1; background: ${b.center > line ? "var(--win)" : "var(--loss)"}; opacity: 0.35; height: ${(b.count / maxCount) * 100}%; min-height: 2px;`}
                title={`${b.center.toFixed(1)}: ${b.count} samples`}
              ></div>
            {/each}
          </div>
          <p class="text-xs text-muted mt-2 text-center">
            Green = above line, red = below. Line at {line}.
          </p>
        {/if}
      {:else}
        <p class="text-sm text-secondary text-center py-8">
          Set inputs and click "Run simulation."
        </p>
      {/if}
    </OutputSection>
  </div>
</CalcShell>
