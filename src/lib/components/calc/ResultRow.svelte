<script lang="ts">
  type Tone = "win" | "loss" | "neutral" | "highlight";
  interface Props {
    label: string;
    value: string | number;
    sublabel?: string;
    tone?: Tone;
    mono?: boolean;
  }
  let { label, value, sublabel, tone = "neutral", mono = true }: Props = $props();

  const toneClass = $derived(
    tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : tone === "highlight" ? "" : ""
  );
  const valueStyle = $derived(
    tone === "highlight" ? "color: var(--ink-primary); font-weight: 600;" : ""
  );
</script>

<div class="flex items-baseline justify-between gap-4 py-2" style="border-top: 1px solid var(--bg-sunken);">
  <div class="min-w-0">
    <div class="text-sm">{label}</div>
    {#if sublabel}
      <div class="text-xs text-muted mt-0.5">{sublabel}</div>
    {/if}
  </div>
  <div
    class="text-right font-semibold {toneClass}"
    class:num={mono}
    style={valueStyle}
  >
    {value}
  </div>
</div>
