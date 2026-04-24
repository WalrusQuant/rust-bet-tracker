<script lang="ts">
  interface Props {
    pose?: "sitting" | "thinking" | "waving";
    size?: number;
    class?: string;
  }
  let { pose = "sitting", size = 140, class: klass = "" }: Props = $props();
  const src = $derived(`/illustrations/ghost-${pose}.svg`);
</script>

<img {src} alt="" width={size} height={size} class={klass} />
