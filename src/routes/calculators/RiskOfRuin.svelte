<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { RuinOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, tone } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";

  let winProbPct = $state(54);
  let decimalOdds = $state(1.91);
  let betSize = $state(10);
  let bankroll = $state(1000);
  let numBets = $state(500);
  let numSims = $state(5000);
  let running = $state(false);
  let output = $state<RuinOutput | null>(null);

  async function run() {
    running = true;
    try {
      output = await calcApi.riskOfRuin({
        win_prob: Number(winProbPct) / 100,
        decimal_odds: Number(decimalOdds),
        bet_size: Number(betSize),
        bankroll: Number(bankroll),
        num_bets: Math.floor(Number(numBets)),
        num_sims: Math.floor(Number(numSims)),
        seed: null,
      });
    } finally {
      running = false;
    }
  }
</script>

<CalcShell
  title="RISK OF RUIN"
  kicker="Monte Carlo survival"
  blurb="Simulates thousands of flat-bet paths given your edge, bet size, and bankroll. Tells you what fraction end in ruin, the median surviving bankroll, and average max drawdown — so you can size bets knowing the actual downside."
  blogSlug="bankroll-management-beyond-kelly"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Win probability (%)">
          <input type="number" min="0" max="100" step="0.1" bind:value={winProbPct} class="input num" />
        </FormRow>
        <FormRow label="Decimal odds">
          <input type="number" min="1.01" step="0.01" bind:value={decimalOdds} class="input num" />
        </FormRow>
        <FormRow label="Bet size">
          <input type="number" min="0.01" step="0.01" bind:value={betSize} class="input num" />
        </FormRow>
        <FormRow label="Bankroll">
          <input type="number" min="0.01" step="1" bind:value={bankroll} class="input num" />
        </FormRow>
        <FormRow label="Number of bets">
          <input type="number" min="1" step="1" bind:value={numBets} class="input num" />
        </FormRow>
        <FormRow label="Simulations" hint="More = slower but smoother">
          <input type="number" min="100" max="100000" step="100" bind:value={numSims} class="input num" />
        </FormRow>
      </FormGroup>
      <button type="button" class="btn btn-primary mt-4" onclick={run} disabled={running}>
        {running ? "Running…" : "Run simulation"}
      </button>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label="Risk of ruin"
          value={fmtPct(output.ruin_pct)}
          tone={output.ruin_pct > 20 ? "loss" : output.ruin_pct > 5 ? "neutral" : "win"}
          sublabel={`${numSims.toLocaleString()} paths, ${numBets.toLocaleString()} bets each`}
        />
        <ResultRow label="EV per bet" value={fmtMoney(output.ev_per_bet)} tone={tone(output.ev_per_bet)} />
        <ResultRow label="Edge" value={fmtPct(output.edge_pct)} tone={tone(output.edge_pct)} />
        <ResultRow label="Median ending bankroll" value={fmtMoney(output.median_bankroll)} />
        <ResultRow label="Average ending bankroll" value={fmtMoney(output.avg_bankroll)} />
        <ResultRow label="Average max drawdown" value={fmtPct(output.max_drawdown_avg_pct)} />
      {:else}
        <p class="text-sm text-secondary text-center py-8">
          Set your inputs and click "Run simulation."
        </p>
      {/if}
    </OutputSection>
  </div>
</CalcShell>
