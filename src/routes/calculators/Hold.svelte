<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { HoldOutput } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtPct, fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let oddsA = $state(-110);
  let oddsB = $state(-110);
  let output = $state<HoldOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const a = Number(oddsA);
    const b = Number(oddsB);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.hold({ odds_a: a, odds_b: b })
        .then((o) => (output = o))
        .catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="HOLD / OVERROUND"
  kicker="How much does the book charge?"
  blurb="Hold is the book's built-in margin on a two-sided market. Standard -110/-110 is about 4.76%. Under 4% is sharp; anything much higher is a retail book padding their edge."
  blogSlug="hold-vig-and-arbitrage"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Side A odds">
          <input type="number" bind:value={oddsA} class="input num" />
        </FormRow>
        <FormRow label="Side B odds">
          <input type="number" bind:value={oddsB} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Hold"
          value={fmtPct(output.hold_pct)}
          tone={output.hold_pct > 5 ? "loss" : output.hold_pct > 3 ? "neutral" : "win"}
        />
        <ResultRow label="Side A implied" value={fmtProbPct(output.implied_a)} />
        <ResultRow label="Side B implied" value={fmtProbPct(output.implied_b)} />
        <ResultRow label="Total implied" value={fmtProbPct(output.total_implied)} />
        <ResultRow label="Fair probability A" value={fmtProbPct(output.no_vig_prob_a)} sublabel={fmtOddsAmerican(output.fair_american_a) + " no-vig"} />
        <ResultRow label="Fair probability B" value={fmtProbPct(output.no_vig_prob_b)} sublabel={fmtOddsAmerican(output.fair_american_b) + " no-vig"} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
