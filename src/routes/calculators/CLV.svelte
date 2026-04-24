<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { ClvOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, fmtProbPct, fmtSignedMoney, tone } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let placedOdds = $state(150);
  let closingOdds = $state(120);
  let stake = $state<number | null>(100);
  let output = $state<ClvOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const p = Number(placedOdds);
    const c = Number(closingOdds);
    const s = stake === null ? null : Number(stake);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.clv({ placed_odds: p, closing_odds: c, stake: s }).then((o) => (output = o));
    }, 100);
  });
</script>

<CalcShell
  title="CLV — CLOSING LINE VALUE"
  kicker="Were you sharp?"
  blurb="Compare the odds you got against the closing price. Consistently beating the close is the single most reliable indicator that you're +EV long-run. Positive CLV means your price was better than the market's final word."
  blogSlug="measuring-your-edge"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Placed odds">
          <input type="number" bind:value={placedOdds} class="input num" />
        </FormRow>
        <FormRow label="Closing odds">
          <input type="number" bind:value={closingOdds} class="input num" />
        </FormRow>
      </FormGroup>
      <FormRow label="Stake (optional)" hint="To compute CLV in dollars">
        <input type="number" min="0" step="0.01" bind:value={stake} class="input num" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Closing line value"
          value={fmtPct(output.clv_percent)}
          tone={tone(output.clv_percent)}
          sublabel={output.clv_dollars !== null ? fmtSignedMoney(output.clv_dollars) : undefined}
        />
        <ResultRow label="Placed decimal" value={output.placed_decimal.toFixed(3)} />
        <ResultRow label="Closing decimal" value={output.closing_decimal.toFixed(3)} />
        <ResultRow label="Placed implied" value={fmtProbPct(output.placed_implied)} />
        <ResultRow label="Closing implied" value={fmtProbPct(output.closing_implied)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
