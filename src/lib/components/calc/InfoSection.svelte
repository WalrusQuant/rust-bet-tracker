<script lang="ts">
  interface Props {
    title: string;
    children?: import("svelte").Snippet;
  }
  let { title, children }: Props = $props();
  let open = $state(false);
</script>

<section
  class="mt-6"
  style="border: 1.5px solid var(--ink-primary); border-radius: 14px; padding: 16px 20px; background: var(--bg-card);"
>
  <button
    type="button"
    class="flex w-full items-center justify-between text-left"
    onclick={() => (open = !open)}
  >
    <span class="kicker">{title}</span>
    <span class="text-sm">{open ? "−" : "+"}</span>
  </button>
  {#if open}
    <div class="mt-3 text-sm space-y-2 text-secondary">
      {@render children?.()}
    </div>
  {/if}
</section>
