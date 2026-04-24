<script lang="ts">
  type Tone = "win" | "loss" | "neutral";
  interface Props {
    label: string;
    value: string;
    sublabel?: string;
    tone?: Tone;
  }
  let { label, value, sublabel, tone = "neutral" }: Props = $props();
</script>

<div class="text-center py-4">
  <div class="kicker">{label}</div>
  <div
    class="display display-xl num mt-2"
    class:text-win={tone === "win"}
    class:text-loss={tone === "loss"}
  >
    {value}
  </div>
  {#if sublabel}
    <div class="mt-2 text-xs text-secondary">{sublabel}</div>
  {/if}
</div>
