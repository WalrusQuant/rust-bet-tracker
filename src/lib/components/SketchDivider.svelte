<script lang="ts">
  interface Props {
    stroke?: string;
    strokeWidth?: number;
    class?: string;
  }
  let {
    stroke = "var(--ink-primary)",
    strokeWidth = 1.5,
    class: klass = "",
  }: Props = $props();
</script>

<svg
  aria-hidden="true"
  viewBox="0 0 600 10"
  preserveAspectRatio="none"
  class={`block w-full ${klass}`}
  style="height: 10px"
>
  <path
    d="M 2 5 C 40 3, 80 7, 120 5 S 200 3, 240 5 S 320 8, 360 4 S 440 6, 480 5 S 560 3, 598 6"
    fill="none"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
  />
</svg>
