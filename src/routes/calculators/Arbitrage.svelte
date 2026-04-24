<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { ArbitrageOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, fmtSignedMoney } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let legs = $state<number[]>([110, 110]);
  let totalStake = $state(100);
  let output = $state<ArbitrageOutput | null>(null);

  function addLeg() { if (legs.length < 4) legs = [...legs, 110]; }
  function removeLeg(i: number) { if (legs.length > 2) legs = legs.filter((_, idx) => idx !== i); }
  function updateLeg(i: number, v: number) { legs = legs.map((o, idx) => (idx === i ? v : o)); }

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const l = [...legs];
    const s = Number(totalStake);
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.arbitrage({ legs: l, total_stake: s })
        .then((o) => (output = o))
        .catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="ARBITRAGE"
  kicker="Riskless profit (in theory)"
  blurb="When two or more books price the same market inconsistently, you can stake on every outcome and lock in profit. Enter each outcome's odds — if total implied probability is under 100%, it's an arb."
  blogSlug="hold-vig-and-arbitrage"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard title="Outcomes">
      <div class="space-y-2">
        {#each legs as _, i (i)}
          <div class="flex items-center gap-3">
            <span class="kicker" style="width: 80px">Outcome {i + 1}</span>
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
        <button type="button" class="btn btn-secondary btn-sm mt-3" onclick={addLeg}>+ Add outcome</button>
      </div>
      <FormRow label="Total stake">
        <input type="number" min="0" step="0.01" bind:value={totalStake} class="input num" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label={output.is_arb ? "Guaranteed profit" : "Not an arb"}
          value={output.is_arb ? fmtSignedMoney(output.guaranteed_profit) : fmtPct(output.arb_percent)}
          tone={output.is_arb ? "win" : "loss"}
          sublabel={output.is_arb
            ? `${fmtPct(output.arb_percent)} return`
            : `Total implied: ${(output.total_implied * 100).toFixed(2)}%`}
        />
        <div class="kicker mt-3">Stake allocation</div>
        {#each output.splits as s, i}
          <ResultRow
            label={`Outcome ${i + 1}`}
            value={fmtMoney(s.stake)}
            sublabel={`Payout: ${fmtMoney(s.payout)}`}
          />
        {/each}
      {/if}
    </OutputSection>
  </div>
</CalcShell>
