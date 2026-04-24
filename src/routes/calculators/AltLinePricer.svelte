<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { AltLineOutput, BetType, TotalSide } from "../../lib/calculators/types";
  import { fmtOddsAmerican, fmtProbPct } from "../../lib/calculators/format";
  import { SPORT_DEFAULTS, SPORT_OPTIONS } from "../../lib/calculators/sports";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ToggleGroup from "../../lib/components/calc/ToggleGroup.svelte";

  let sport = $state("nfl");
  let betType = $state<BetType>("spread");
  let side = $state<TotalSide>("over");
  let mainLine = $state(-7);
  let odds = $state(-110);
  let std = $state(14.2);
  let range = $state(5);
  let step = $state(0.5);

  $effect(() => {
    const cfg = SPORT_DEFAULTS[sport];
    if (!cfg) return;
    std = betType === "spread" ? cfg.spread_std : cfg.total_std;
  });

  let output = $state<AltLineOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = {
      main_line: Number(mainLine),
      odds: Number(odds),
      std: Number(std),
      bet_type: betType,
      side: betType === "total" ? side : null,
      range: Number(range),
      step: Number(step),
    };
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.altLine(payload).then((r) => (output = r)).catch(() => (output = null));
    }, 120);
  });
</script>

<CalcShell
  title="ALT LINE PRICER"
  kicker="Fair odds at every alternate"
  blurb="Back out the implied true line from a main spread or total, then price the fair cover probability (and American odds) at every alternate line in a range. Great for finding mispriced alts."
  blogSlug="alternate-line-pricing"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
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
      <FormGroup cols={2}>
        <FormRow label="Main line">
          <input type="number" step="0.5" bind:value={mainLine} class="input num" />
        </FormRow>
        <FormRow label="Odds">
          <input type="number" bind:value={odds} class="input num" />
        </FormRow>
      </FormGroup>
      <FormGroup cols={3}>
        <FormRow label="Std">
          <input type="number" step="0.1" bind:value={std} class="input num" />
        </FormRow>
        <FormRow label="Range" hint="± from main line">
          <input type="number" step="0.5" bind:value={range} class="input num" />
        </FormRow>
        <FormRow label="Step">
          <input type="number" step="0.5" min="0.5" bind:value={step} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <div class="text-sm text-secondary mb-3">
          Implied true line: <span class="num font-semibold ml-1">{output.true_line.toFixed(2)}</span>
        </div>
        <div class="overflow-auto" style="max-height: 440px">
          <table class="data-table">
            <thead>
              <tr>
                <th>Line</th>
                <th style="text-align: right">Fair prob</th>
                <th style="text-align: right">Fair odds</th>
              </tr>
            </thead>
            <tbody>
              {#each output.ladder as row (row.line)}
                <tr class:highlight={Math.abs(row.line - mainLine) < 1e-6}>
                  <td class="num">{row.line.toFixed(1)}</td>
                  <td class="num" style="text-align: right">{fmtProbPct(row.fair_prob)}</td>
                  <td class="num font-semibold" style="text-align: right">{fmtOddsAmerican(row.fair_odds)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </OutputSection>
  </div>
</CalcShell>

<style>
  :global(tr.highlight) {
    background-color: var(--bg-sunken);
  }
</style>
