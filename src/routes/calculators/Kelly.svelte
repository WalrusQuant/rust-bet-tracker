<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { KellyOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, fmtProbPct, tone } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let winProbPct = $state(55);
  let decimalOdds = $state(1.91);
  let bankroll = $state(1000);
  let fraction = $state(0.5);
  let output = $state<KellyOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const p = Number(winProbPct) / 100;
    const d = Number(decimalOdds);
    const b = Number(bankroll);
    const f = Number(fraction);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.kelly({ win_probability: p, decimal_odds: d, bankroll: b, fraction: f })
        .then((o) => (output = o));
    }, 100);
  });
</script>

<CalcShell
  title="KELLY CRITERION"
  kicker="Optimal bet sizing"
  blurb="Given your edge and bankroll, Kelly tells you the bet size that maximizes long-run growth. Full Kelly is aggressive and can produce big drawdowns; most pros use half or quarter Kelly to dampen variance."
  blogSlug="kelly-criterion-guide"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Win probability (%)" hint="Your estimated true win rate">
          <input type="number" min="0" max="100" step="0.1" bind:value={winProbPct} class="input num" />
        </FormRow>
        <FormRow label="Decimal odds" hint="e.g. 1.91 for -110">
          <input type="number" min="1.01" step="0.01" bind:value={decimalOdds} class="input num" />
        </FormRow>
        <FormRow label="Bankroll">
          <input type="number" min="0" step="1" bind:value={bankroll} class="input num" />
        </FormRow>
        <FormRow label="Kelly fraction" hint="1.0 = full, 0.5 = half, 0.25 = quarter">
          <input type="number" min="0" max="1" step="0.05" bind:value={fraction} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Recommended stake"
          value={fmtMoney(output.recommended_stake)}
          tone={output.recommended_fraction > 0 ? "win" : "neutral"}
          sublabel={fmtPct(output.recommended_fraction * 100) + " of bankroll"}
        />
        <ResultRow label="Full Kelly fraction" value={fmtPct(output.kelly_fraction * 100)} />
        <ResultRow label="Your edge" value={fmtPct(output.edge_percent)} tone={tone(output.edge_percent)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
