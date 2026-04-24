<script lang="ts">
  interface Props {
    glyph: string;
  }
  let { glyph }: Props = $props();
</script>

<span class="icon-square" aria-hidden="true">
  <span
    style="font-family: var(--font-display); font-weight: 700; font-size: 13px; letter-spacing: -0.02em; text-transform: uppercase;"
  >
    {glyph}
  </span>
</span>
