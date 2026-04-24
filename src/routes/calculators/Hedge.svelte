<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { HedgeOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtSignedMoney, tone } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let originalStake = $state(100);
  let originalOdds = $state(200);
  let hedgeOdds = $state(-150);
  let output = $state<HedgeOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const os = Number(originalStake);
    const oo = Number(originalOdds);
    const ho = Number(hedgeOdds);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.hedge({ original_stake: os, original_odds: oo, hedge_odds: ho })
        .then((o) => (output = o))
        .catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="HEDGE"
  kicker="Lock it in"
  blurb="You have a live position and want to de-risk. Enter the original bet and the current hedge-side odds; we'll tell you how much to stake on the other side to equalize payouts regardless of outcome."
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={1}>
        <FormRow label="Original stake">
          <input type="number" min="0" step="0.01" bind:value={originalStake} class="input num" />
        </FormRow>
        <FormRow label="Original odds (American)">
          <input type="number" bind:value={originalOdds} class="input num" />
        </FormRow>
        <FormRow label="Hedge odds (American)" hint="Other side, right now">
          <input type="number" bind:value={hedgeOdds} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Hedge stake"
          value={fmtMoney(output.hedge_stake)}
          sublabel={"Total outlay: " + fmtMoney(output.total_stake)}
        />
        <ResultRow
          label="Guaranteed profit"
          value={fmtSignedMoney(output.guaranteed_profit)}
          tone={tone(output.guaranteed_profit)}
        />
        <ResultRow label="If original wins" value={fmtMoney(output.payout_if_original_wins)} />
        <ResultRow label="If hedge wins" value={fmtMoney(output.payout_if_hedge_wins)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
