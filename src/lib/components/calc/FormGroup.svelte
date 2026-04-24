<script lang="ts">
  interface Props {
    label?: string;
    cols?: number;
    children?: import("svelte").Snippet;
  }
  let { label, cols = 2, children }: Props = $props();
  const gridClass = $derived(
    cols === 1 ? "grid-cols-1"
    : cols === 2 ? "grid-cols-1 sm:grid-cols-2"
    : cols === 3 ? "grid-cols-1 sm:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-4"
  );
</script>

<div>
  {#if label}
    <div class="kicker mb-3">{label}</div>
  {/if}
  <div class="grid {gridClass} gap-4">
    {@render children?.()}
  </div>
</div>
