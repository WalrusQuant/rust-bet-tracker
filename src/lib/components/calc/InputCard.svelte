<script lang="ts">
  interface Props {
    title?: string;
    children?: import("svelte").Snippet;
  }
  let { title, children }: Props = $props();
</script>

<section class="card">
  {#if title}
    <div class="kicker">Inputs</div>
    <h2 class="display display-md mt-1">{title}</h2>
  {/if}
  <div class={title ? "mt-5 space-y-4" : "space-y-4"}>
    {@render children?.()}
  </div>
</section>
