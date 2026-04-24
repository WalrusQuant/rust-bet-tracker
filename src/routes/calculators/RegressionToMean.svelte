<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { RegressionOutput } from "../../lib/calculators/types";
  import { fmtPct } from "../../lib/calculators/format";
  import { REGRESSION_SPORTS } from "../../lib/calculators/regression-config";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let sport = $state<string>("mlb");
  let stat = $state<string>("avg");
  const sports = Object.entries(REGRESSION_SPORTS);
  const stats = $derived(
    REGRESSION_SPORTS[sport] ? Object.entries(REGRESSION_SPORTS[sport].stats) : []
  );
  const cfg = $derived(REGRESSION_SPORTS[sport]?.stats[stat]);

  let observed = $state(0.32);
  let baseline = $state(0.245);
  let sampleSize = $state(100);
  let regConstant = $state(910);

  $effect(() => {
    if (cfg) {
      observed = cfg.default_observed;
      baseline = cfg.league_average;
      sampleSize = cfg.default_sample_size;
      regConstant = cfg.regression_constant;
    }
  });

  // Reset stat when sport changes if current stat not in new sport
  $effect(() => {
    if (REGRESSION_SPORTS[sport] && !REGRESSION_SPORTS[sport].stats[stat]) {
      stat = Object.keys(REGRESSION_SPORTS[sport].stats)[0];
    }
  });

  let output = $state<RegressionOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const o = Number(observed);
    const b = Number(baseline);
    const s = Number(sampleSize);
    const k = Number(regConstant);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.regression({ observed: o, baseline: b, sample_size: s, regression_constant: k })
        .then((r) => (output = r)).catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="REGRESSION TO THE MEAN"
  kicker="Shrink small samples"
  blurb="Small-sample rate stats (BABIP over 20 PA, FG% over 20 shots) over- or under-state true talent. Regression pulls the observed rate toward league average based on sample size — the fewer observations, the more pull."
  blogSlug="regression-to-the-mean"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Sport">
          <select bind:value={sport} class="input">
            {#each sports as [k, s]}
              <option value={k}>{s.label}</option>
            {/each}
          </select>
        </FormRow>
        <FormRow label="Stat">
          <select bind:value={stat} class="input">
            {#each stats as [k, s]}
              <option value={k}>{s.label}</option>
            {/each}
          </select>
        </FormRow>
      </FormGroup>
      <FormGroup cols={2}>
        <FormRow label="Observed" hint={cfg ? cfg.unit : ""}>
          <input type="number" step="0.001" bind:value={observed} class="input num" />
        </FormRow>
        <FormRow label="League average">
          <input type="number" step="0.001" bind:value={baseline} class="input num" />
        </FormRow>
        <FormRow label="Sample size" hint={cfg ? cfg.sample_unit : ""}>
          <input type="number" min="0" step="1" bind:value={sampleSize} class="input num" />
        </FormRow>
        <FormRow label="Regression constant" hint="Sample size for 50% shrinkage">
          <input type="number" min="1" step="1" bind:value={regConstant} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Regressed estimate"
          value={output.regressed.toFixed(3)}
          sublabel={`Weight on observed: ${(output.weight * 100).toFixed(0)}%`}
        />
        <ResultRow label="Observed" value={output.observed.toFixed(3)} />
        <ResultRow label="Baseline" value={output.baseline.toFixed(3)} />
        <ResultRow
          label="90% CI"
          value={`[${output.ci_low.toFixed(3)}, ${output.ci_high.toFixed(3)}]`}
          sublabel="±1.645σ"
        />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
