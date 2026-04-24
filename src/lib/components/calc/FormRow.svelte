<script lang="ts">
  interface Props {
    label: string;
    hint?: string;
    children?: import("svelte").Snippet;
  }
  let { label, hint, children }: Props = $props();
</script>

<label class="block">
  <span class="kicker mb-2 block">{label}</span>
  {@render children?.()}
  {#if hint}
    <span class="mt-1 block text-xs text-muted">{hint}</span>
  {/if}
</label>
