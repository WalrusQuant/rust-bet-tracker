<script lang="ts">
  import { Chart, Svg, Axis, Area, Spline, Highlight, Tooltip, ChartClipPath } from "layerchart";
  import { scaleTime } from "d3-scale";
  import type { BankrollPoint } from "../types";

  interface Props {
    points: BankrollPoint[];
  }
  let { points }: Props = $props();

  const data = $derived(
    points.map((p, i) => ({
      ...p,
      date: parseBucket(p.bucket, i),
      drawdown_pct: p.peak > 0 ? (p.bankroll - p.peak) / p.peak : 0,
    }))
  );

  function parseBucket(bucket: string, i: number): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) return new Date(bucket);
    if (/^\d{4}-\d{2}$/.test(bucket)) return new Date(bucket + "-01");
    const m = bucket.match(/^(\d{4})-W(\d{2})$/);
    if (m) {
      const year = parseInt(m[1]);
      const week = parseInt(m[2]);
      return new Date(year, 0, 1 + week * 7);
    }
    return new Date(2026, 0, 1 + i);
  }

  // Function accessors
  const getDate = (d: any) => d.date;
  const getBankroll = (d: any) => d.bankroll;
  const getPeak = (d: any) => d.peak;

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
</script>

<div class="h-80 w-full">
  {#if data.length === 0}
    <div class="flex h-full items-center justify-center text-secondary text-sm">
      Not enough data to draw a curve yet.
    </div>
  {:else}
    <Chart
      {data}
      x={getDate}
      xScale={scaleTime()}
      y={[getBankroll, getPeak]}
      yNice
      padding={{ left: 72, bottom: 28, right: 16, top: 12 }}
      tooltip={{ mode: "bisect-x" }}
    >
      <Svg>
        <Axis
          placement="left"
          grid={{ class: "chart-grid" }}
          rule={{ class: "chart-axis" }}
          tickLabelProps={{ class: "chart-tick-label" }}
          format={(v: number) => fmtMoney(v)}
        />
        <Axis
          placement="bottom"
          rule={{ class: "chart-axis" }}
          tickLabelProps={{ class: "chart-tick-label" }}
        />

        <ChartClipPath>
          <!-- Drawdown shading: ribbon between peak (top) and bankroll (bottom) -->
          <Area
            y0={getPeak}
            y1={getBankroll}
            fill="#A6432F"
            fillOpacity={0.22}
            line={false}
          />

          <!-- Peak line (dashed, muted) -->
          <Spline
            y={getPeak}
            fill="none"
            stroke="#A59E90"
            strokeWidth={1.25}
            class="chart-peak"
          />

          <!-- Bankroll line (primary) -->
          <Spline
            y={getBankroll}
            fill="none"
            stroke="#2A2622"
            strokeWidth={2}
          />
        </ChartClipPath>

        <Highlight points lines={{ class: "chart-highlight" }} />
      </Svg>
      <Tooltip.Root
        variant="none"
        classes={{ container: "chart-tooltip" }}
        anchor="top-right"
        xOffset={8}
        yOffset={8}
        let:data
      >
        <Tooltip.Header class="chart-tooltip-header">{data.bucket}</Tooltip.Header>
        <Tooltip.List>
          <Tooltip.Item label="Bankroll" value={fmtMoney(data.bankroll)} />
          <Tooltip.Item label="Peak" value={fmtMoney(data.peak)} />
          <Tooltip.Item
            label="Drawdown"
            value={data.drawdown === 0
              ? "—"
              : `${fmtMoney(data.drawdown)} (${(data.drawdown_pct * 100).toFixed(1)}%)`}
          />
          {#if data.rolling_roi !== null && data.rolling_roi !== undefined}
            <Tooltip.Item
              label="30d ROI"
              value={`${(data.rolling_roi * 100).toFixed(1)}%`}
            />
          {/if}
        </Tooltip.List>
      </Tooltip.Root>
    </Chart>
  {/if}
</div>

<style>
  :global(.chart-peak) {
    stroke-dasharray: 3 4;
  }
  :global(.chart-grid line) {
    stroke: var(--ink-3);
    stroke-opacity: 0.25;
  }
  :global(.chart-axis) {
    stroke: var(--ink-primary);
  }
  :global(.chart-tick-label) {
    fill: var(--ink-2);
    font-size: 11px;
    font-family: var(--font-sans);
  }
  :global(.chart-highlight line) {
    stroke: var(--ink-primary);
    stroke-opacity: 0.35;
    stroke-dasharray: 2 3;
  }
  :global(.chart-tooltip) {
    background-color: var(--bg-card);
    color: var(--ink-primary);
    border: 1.5px solid var(--ink-primary);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-family: var(--font-sans);
    box-shadow: 0 6px 20px rgba(42, 38, 34, 0.18);
    min-width: 180px;
  }
  :global(.chart-tooltip-header) {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-2);
    padding-bottom: 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--bg-sunken);
  }
  :global(.chart-tooltip .label) {
    color: var(--ink-2);
    font-size: 12px;
  }
  :global(.chart-tooltip .value) {
    color: var(--ink-primary);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
</style>
