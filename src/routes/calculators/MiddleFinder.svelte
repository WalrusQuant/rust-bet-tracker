<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { BetType, MiddleOutput } from "../../lib/calculators/types";
  import { fmtMoney, fmtPct, fmtProbPct, fmtSignedMoney, tone } from "../../lib/calculators/format";
  import { SPORT_DEFAULTS, SPORT_OPTIONS } from "../../lib/calculators/sports";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import FormGroup from "../../lib/components/calc/FormGroup.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ResultLarge from "../../lib/components/calc/ResultLarge.svelte";
  import ToggleGroup from "../../lib/components/calc/ToggleGroup.svelte";

  let sport = $state("nfl");
  let betType = $state<BetType>("spread");
  let std = $state(14.2);

  let line1 = $state(-3.5);
  let odds1 = $state(-110);
  let stake1 = $state(100);
  let line2 = $state(7.5);
  let odds2 = $state(-110);
  let stake2 = $state(100);

  $effect(() => {
    const cfg = SPORT_DEFAULTS[sport];
    if (!cfg) return;
    std = betType === "spread" ? cfg.spread_std : cfg.total_std;
  });

  let output = $state<MiddleOutput | null>(null);
  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = {
      bet_type: betType,
      std: Number(std),
      line_1: Number(line1),
      odds_1: Number(odds1),
      stake_1: Number(stake1),
      line_2: Number(line2),
      odds_2: Number(odds2),
      stake_2: Number(stake2),
    };
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.middle(payload).then((r) => (output = r)).catch(() => (output = null));
    }, 120);
  });
</script>

<CalcShell
  title="MIDDLE FINDER"
  kicker="Gap probability + EV"
  blurb="Two positions on opposite sides of a spread or total. If the lines create a gap where both win (a 'middle'), we quantify it. If they overlap into a both-lose zone ('trap'), we show that too. Pure normal-CDF math on the margin distribution."
  blogSlug="middle-finder-guide"
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
      <FormRow label="Standard deviation">
        <input type="number" step="0.1" bind:value={std} class="input num" />
      </FormRow>
      <FormGroup label={betType === "spread" ? "Favorite / Over" : "Over"} cols={3}>
        <FormRow label="Line">
          <input type="number" step="0.5" bind:value={line1} class="input num" />
        </FormRow>
        <FormRow label="Odds">
          <input type="number" bind:value={odds1} class="input num" />
        </FormRow>
        <FormRow label="Stake">
          <input type="number" step="1" bind:value={stake1} class="input num" />
        </FormRow>
      </FormGroup>
      <FormGroup label={betType === "spread" ? "Underdog / Under" : "Under"} cols={3}>
        <FormRow label="Line">
          <input type="number" step="0.5" bind:value={line2} class="input num" />
        </FormRow>
        <FormRow label="Odds">
          <input type="number" bind:value={odds2} class="input num" />
        </FormRow>
        <FormRow label="Stake">
          <input type="number" step="1" bind:value={stake2} class="input num" />
        </FormRow>
      </FormGroup>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultLarge
          label={output.is_middle ? "Middle EV" : "Trap EV"}
          value={fmtPct(output.ev_percent)}
          tone={tone(output.ev_percent)}
          sublabel={fmtSignedMoney(output.ev)}
        />
        <ResultRow label="Gap size" value={output.gap_size.toFixed(1)} />
        <ResultRow label="Gap probability" value={fmtProbPct(output.gap_prob)} tone={output.is_middle ? "win" : "loss"} />
        <ResultRow label="Implied true center" value={output.true_center.toFixed(2)} />
        <ResultRow label="Total staked" value={fmtMoney(output.total_staked)} />
        <div class="kicker mt-4">Outcomes</div>
        {#each output.outcomes as o}
          <ResultRow
            label={o.label}
            value={fmtProbPct(o.probability)}
            sublabel={fmtSignedMoney(o.net_profit)}
            tone={tone(o.net_profit)}
          />
        {/each}
      {/if}
    </OutputSection>
  </div>
</CalcShell>
