<script lang="ts">
  import { calcApi } from "../../lib/calculators/api";
  import type { OddsConvertOutput, OddsFormat } from "../../lib/calculators/types";
  import { fmtProbPct } from "../../lib/calculators/format";
  import CalcShell from "../../lib/components/calc/CalcShell.svelte";
  import InputCard from "../../lib/components/calc/InputCard.svelte";
  import FormRow from "../../lib/components/calc/FormRow.svelte";
  import OutputSection from "../../lib/components/calc/OutputSection.svelte";
  import ResultRow from "../../lib/components/calc/ResultRow.svelte";
  import ToggleGroup from "../../lib/components/calc/ToggleGroup.svelte";

  let value = $state("-110");
  let format = $state<OddsFormat>("american");
  let output = $state<OddsConvertOutput | null>(null);

  let t: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const v = value;
    const f = format;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      calcApi.oddsConvert({ value: v, format: f }).then((o) => (output = o));
    }, 100);
  });
</script>

<CalcShell
  title="ODDS CONVERTER"
  kicker="Any format to any format"
  blurb="Convert between American, decimal, fractional, and implied probability. Type any one, get the others. Use this to sanity-check quick mental math or line-shop in your preferred format."
  blogSlug="understanding-betting-odds"
>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <InputCard>
      <FormRow label="Format">
        <ToggleGroup
          options={[
            { value: "american", label: "American" },
            { value: "decimal", label: "Decimal" },
            { value: "fractional", label: "Fractional" },
          ]}
          bind:value={format}
        />
      </FormRow>
      <FormRow label="Odds" hint="e.g. -110 / 1.91 / 10/11">
        <input type="text" bind:value class="input num" />
      </FormRow>
    </InputCard>

    <OutputSection>
      {#if output}
        <ResultRow label="American" value={output.american ?? "—"} tone="highlight" />
        <ResultRow label="Decimal" value={output.decimal !== null ? output.decimal.toFixed(3) : "—"} />
        <ResultRow label="Fractional" value={output.fractional ?? "—"} />
        <ResultRow label="Implied probability" value={fmtProbPct(output.implied_prob)} />
      {/if}
    </OutputSection>
  </div>
</CalcShell>
