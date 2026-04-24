<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { EVOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, fmtProbPct, fmtSignedMoney, tone } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let yourOdds = $state(-110);
  let fairOdds = $state(100);
  let stake = $state(100);
  let output = $state<EVOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const y = Number(yourOdds);
    const f = Number(fairOdds);
    const s = Number(stake);
    if (!Number.isFinite(y) || !Number.isFinite(f) || s <= 0) return;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.ev({ your_odds: y, fair_odds: f, stake: s }).then((o) => (output = o));
    }, 100);
  });
</script>

<CalcShell
  title="EXPECTED VALUE"
  kicker="Measuring your edge"
  blurb="Compare your bet's price against its fair price (e.g. Pinnacle no-vig). Positive EV means the book is paying more than the true probability suggests — a long-run winner. Negative EV means you're paying vig without an edge."
  blogSlug="measuring-your-edge"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Your odds" hint="American, e.g. -110 or +150">
          <input type="number" bind:value={yourOdds} class="input num" />
        </FormRow>
        <FormRow label="Fair odds" hint="True price, e.g. no-vig">
          <input type="number" bind:value={fairOdds} class="input num" />
        </FormRow>
      </FormGroup>
      <FormRow label="Stake">
        <input type="number" min="0" step="0.01" bind:value={stake} class="input num" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Expected value"
          value={fmtPct(output.ev_percent)}
          tone={tone(output.ev_percent)}
          sublabel={fmtSignedMoney(output.ev_dollars) + " per bet"}
        />
        <ResultRow label="Edge vs market" value={fmtPct(output.edge_percent)} tone={tone(output.edge_percent)} />
        <ResultRow label="Your implied" value={fmtProbPct(output.your_implied)} />
        <ResultRow label="Fair probability" value={fmtProbPct(output.fair_prob)} />
        <ResultRow label="Break-even win rate" value={fmtProbPct(output.break_even_win_rate)} />
        <ResultRow label="Per 100 staked" value={fmtSignedMoney(output.ev_dollars * 100 / Math.max(1, stake))} tone={tone(output.ev_dollars)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
