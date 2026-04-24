<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { BetterLineOutput, BetType, TotalSide } from "../../lib/calculators/types";
  import { fmtProbPct } from "../../lib/calculators/format";
  import { SPORT_DEFAULTS, SPORT_OPTIONS } from "../../lib/calculators/sports";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ToggleGroup from "../../lib/components/calc/ToggleGroup.svelte";

  let sport = $state("nfl");
  let betType = $state<BetType>("spread");
  let side = $state<TotalSide>("over");
  let std = $state(14.2);

  let line1 = $state(-3.0);
  let odds1 = $state(-110);
  let line2 = $state(-3.5);
  let odds2 = $state(-110);

  $effect(() => {
    const cfg = SPORT_DEFAULTS[sport];
    if (!cfg) return;
    std = betType === "spread" ? cfg.spread_std : cfg.total_std;
  });

  let output = $state<BetterLineOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = {
      bet_type: betType,
      side: betType === "total" ? side : null,
      std: Number(std),
      line_1: Number(line1),
      odds_1: Number(odds1),
      line_2: Number(line2),
      odds_2: Number(odds2),
    };
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.betterLine(payload).then((r) => (output = r)).catch(() => (output = null));
    }, 100);
  });
</script>

<CalcShell
  title="BETTER LINE"
  kicker="Which line is sharper?"
  blurb="Two books are offering the same market at different lines and odds. By converting each to an implied true line via inverse CDF, we can tell you exactly which is the better bet — and by how much."
  blogSlug="better-line-cdf-analysis"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormGroup cols={2}>
        <FormRow label="Sport">
          <select bind:value={sport} class="input">
            {#each SPORT_OPTIONS as o}
              <option value={o.value}>{o.label}</option>
            {/each}
          </select>
        </FormRow>
        <FormRow label="Bet type">
          <ToggleGroup
            options={[
              { value: "spread", label: "Spread" },
              { value: "total", label: "Total" },
            ]}
            bind:value={betType}
          />
        </FormRow>
      </FormGroup>
      {#if betType === "total"}
        <FormRow label="Side">
          <ToggleGroup
            options={[
              { value: "over", label: "Over" },
              { value: "under", label: "Under" },
            ]}
            bind:value={side}
          />
        </FormRow>
      {/if}
      <FormRow label="Standard deviation" hint="Default from sport">
        <input type="number" min="0.01" step="0.1" bind:value={std} class="input num" />
      </FormRow>
      <FormGroup label="Line 1" cols={2}>
        <FormRow label="Line">
          <input type="number" step="0.5" bind:value={line1} class="input num" />
        </FormRow>
        <FormRow label="Odds">
          <input type="number" bind:value={odds1} class="input num" />
        </FormRow>
      </FormGroup>
      <FormGroup label="Line 2" cols={2}>
        <FormRow label="Line">
          <input type="number" step="0.5" bind:value={line2} class="input num" />
        </FormRow>
        <FormRow label="Odds">
          <input type="number" bind:value={odds2} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        {#if output.winner === 0}
          <p class="kicker text-center py-6">TIE — EQUIVALENT VALUE</p>
        {:else}
          <div class="text-center py-4">
            <div class="kicker">Winner</div>
            <div class="display display-xl mt-2 text-win">LINE {output.winner}</div>
            <div class="mt-2 text-sm text-secondary">
              True-line difference: <span class="num font-semibold">{output.diff.toFixed(2)} pts</span>
            </div>
          </div>
        {/if}
        <ResultRow
          label="Line 1 implied true"
          value={output.implied_1.toFixed(2)}
          sublabel={`Cover prob: ${fmtProbPct(output.cover_1)}`}
          tone={output.winner === 1 ? "win" : "neutral"}
        />
        <ResultRow
          label="Line 2 implied true"
          value={output.implied_2.toFixed(2)}
          sublabel={`Cover prob: ${fmtProbPct(output.cover_2)}`}
          tone={output.winner === 2 ? "win" : "neutral"}
        />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
