<script lang="ts">
  interface Props {
    title?: string;
    children?: import("svelte").Snippet;
  }
  let { title, children }: Props = $props();
</script>

<section
  class="card"
  style="background-color: var(--bg-sunken);"
>
  {#if title}
    <div class="kicker">Results</div>
    <h2 class="display display-md mt-1">{title}</h2>
  {/if}
  <div class={title ? "mt-5 space-y-3" : "space-y-3"}>
    {@render children?.()}
  </div>
</section>
