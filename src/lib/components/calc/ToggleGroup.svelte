<script lang="ts" generics="T extends string">
  interface Option {
    value: T;
    label: string;
  }
  interface Props {
    options: Option[];
    value: T;
    onchange?: (v: T) => void;
  }
  let { options, value = $bindable(), onchange }: Props = $props();

  function select(v: T) {
    value = v;
    onchange?.(v);
  }
</script>

<div class="inline-flex flex-wrap gap-2">
  {#each options as opt (opt.value)}
    <button
      type="button"
      class="tag-pill"
      class:on={value === opt.value}
      onclick={() => select(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>
