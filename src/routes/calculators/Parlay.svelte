<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { ParlayOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtOddsAmerican, fmtProbPct, fmtSignedMoney } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let legs = $state<number[]>([-110, -110]);
  let stake = $state(10);
  let output = $state<ParlayOutput | null>(null);

  function addLeg() {
    if (legs.length < 10) legs = [...legs, -110];
  }
  function removeLeg(i: number) {
    if (legs.length > 2) legs = legs.filter((_, idx) => idx !== i);
  }
  function updateLeg(i: number, v: number) {
    legs = legs.map((o, idx) => (idx === i ? v : o));
  }

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const legsCopy = [...legs];
    const s = Number(stake);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.parlay({ legs: legsCopy, stake: s }).then((o) => (output = o));
    }, 100);
  });
</script>

<CalcShell
  title="PARLAY"
  kicker="Stacking multiple legs"
  blurb="Multiplies decimal odds across N legs into a combined price. Parlays are high-variance by design — the payout is tempting but the combined probability drops fast. Use this to see exactly how steep."
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard title="Legs">
      <div class="space-y-2">
        {#each legs as _, i (i)}
          <div class="flex items-center gap-3">
            <span class="kicker" style="width: 60px">Leg {i + 1}</span>
            <input
              type="number"
              value={legs[i]}
              oninput={(e) => updateLeg(i, Number((e.target as HTMLInputElement).value))}
              class="input num flex-1"
            />
            {#if legs.length > 2}
              <button type="button" class="link-btn danger" onclick={() => removeLeg(i)}>Remove</button>
            {/if}
          </div>
        {/each}
        <button type="button" class="btn btn-secondary btn-sm mt-3" onclick={addLeg}>
          + Add leg
        </button>
      </div>
      <FormRow label="Stake">
        <input type="number" min="0" step="0.01" bind:value={stake} class="input num" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Payout"
          value={fmtMoney(output.payout)}
          tone="win"
          sublabel={"Profit: " + fmtSignedMoney(output.profit)}
        />
        <ResultRow label="Combined decimal" value={output.combined_decimal.toFixed(3)} />
        <ResultRow label="Combined American" value={fmtOddsAmerican(output.combined_american)} />
        <ResultRow label="Combined win probability" value={fmtProbPct(output.combined_implied_prob)} />
        <ResultRow label="Stake" value={fmtMoney(output.stake)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
