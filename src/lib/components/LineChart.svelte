<script lang="ts">
  interface Point {
    label: string;
    value: number;
  }
  interface Props {
    points: Point[];
    height?: number;
    format?: (n: number) => string;
  }
  let { points, height = 200, format = (n: number) => n.toFixed(0) }: Props = $props();

  const width = 800;
  const pad = { top: 20, right: 40, bottom: 28, left: 60 };

  const bounds = $derived.by(() => {
    if (points.length === 0) return { min: 0, max: 1 };
    const vs = points.map((p) => p.value);
    let min = Math.min(0, ...vs);
    let max = Math.max(0, ...vs);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const pad = (max - min) * 0.1;
    return { min: min - pad, max: max + pad };
  });

  function x(i: number): number {
    if (points.length <= 1) return pad.left + (width - pad.left - pad.right) / 2;
    return pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right);
  }

  function y(v: number): number {
    const { min, max } = bounds;
    const t = (v - min) / (max - min);
    return pad.top + (1 - t) * (height - pad.top - pad.bottom);
  }

  const path = $derived(
    points.length === 0
      ? ""
      : "M " + points.map((p, i) => `${x(i)},${y(p.value)}`).join(" L ")
  );

  const zeroY = $derived(y(0));
</script>

<svg viewBox="0 0 {width} {height}" preserveAspectRatio="none" class="h-full w-full">
  <!-- grid -->
  <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom}
        stroke="currentColor" stroke-opacity="0.2" />
  <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom}
        stroke="currentColor" stroke-opacity="0.2" />
  {#if zeroY > pad.top && zeroY < height - pad.bottom}
    <line x1={pad.left} y1={zeroY} x2={width - pad.right} y2={zeroY}
          stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 4" />
  {/if}

  <!-- y labels: top/mid/bottom -->
  <text x={pad.left - 8} y={pad.top + 4} text-anchor="end" font-size="11" fill="currentColor" opacity="0.6">
    {format(bounds.max)}
  </text>
  <text x={pad.left - 8} y={height - pad.bottom + 4} text-anchor="end" font-size="11" fill="currentColor" opacity="0.6">
    {format(bounds.min)}
  </text>

  {#if points.length > 0}
    <path d={path} fill="none" stroke="var(--ink-primary)" stroke-width="2" />
    {#each points as p, i (i)}
      <circle cx={x(i)} cy={y(p.value)} r="3" fill="var(--ink-primary)">
        <title>{p.label}: {format(p.value)}</title>
      </circle>
    {/each}
  {:else}
    <text x={width / 2} y={height / 2} text-anchor="middle" font-size="13" fill="currentColor" opacity="0.5">
      No settled bets yet.
    </text>
  {/if}

  <!-- x labels: first + last only to avoid crowding -->
  {#if points.length > 0}
    <text x={x(0)} y={height - pad.bottom + 18} text-anchor="start" font-size="11" fill="currentColor" opacity="0.6">
      {points[0].label}
    </text>
    {#if points.length > 1}
      <text x={x(points.length - 1)} y={height - pad.bottom + 18} text-anchor="end" font-size="11" fill="currentColor" opacity="0.6">
        {points[points.length - 1].label}
      </text>
    {/if}
  {/if}
</svg>
