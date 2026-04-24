<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api";
  import type { BankrollPoint, Bucket, Dimension, GroupStats, Stats } from "../lib/types";
  import { fmtMoney, fmtPct, fmtRatio, fmtSignedMoney } from "../lib/format";
  import Ghost from "../lib/components/Ghost.svelte";
  import SketchDivider from "../lib/components/SketchDivider.svelte";
  import BankrollChart from "../lib/components/BankrollChart.svelte";

  let stats = $state<Stats | null>(null);
  let points = $state<BankrollPoint[]>([]);
  let bucket: Bucket = $state("week");
  let firstLoad = $state(true);

  let dimension: Dimension = $state("sportsbook");
  let groups = $state<GroupStats[]>([]);

  async function load() {
    const [s, pts, gs] = await Promise.all([
      api.stats(),
      api.bankrollSeries(bucket),
      api.statsBy(dimension),
    ]);
    stats = s;
    points = pts;
    groups = gs;
    firstLoad = false;
  }

  async function changeBucket(b: Bucket) {
    bucket = b;
    points = await api.bankrollSeries(bucket);
  }

  async function changeDimension(d: Dimension) {
    dimension = d;
    groups = await api.statsBy(dimension);
  }

  onMount(load);

  // Derived bits
  const expectedActualDelta = $derived(
    stats ? stats.total_profit - stats.expected_profit : 0
  );
  const expectedActualTone = $derived((): "hot" | "cold" | "calibrated" => {
    if (!stats || stats.expected_profit_sample === 0) return "calibrated";
    const gap = Math.abs(expectedActualDelta);
    if (gap < Math.max(50, stats.total_stake * 0.02)) return "calibrated";
    return expectedActualDelta > 0 ? "hot" : "cold";
  });

  const atNewPeak = $derived(
    stats ? Math.abs(stats.current_bankroll - stats.peak_bankroll) < 0.01 && stats.peak_bankroll > stats.starting_bankroll : false
  );

  // For breakdown: max absolute profit used to size bars
  const maxAbs = $derived(
    groups.reduce((m, g) => Math.max(m, Math.abs(g.profit)), 0)
  );
</script>

<header>
  <div class="kicker">Truth about the numbers</div>
  <h1 class="display display-xl mt-2">THE ANALYTICS.</h1>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

{#if firstLoad || !stats}
  <p class="mt-8 text-secondary">Loading…</p>
{:else if stats.total_bets === 0}
  <div class="mt-10 card flex flex-col items-center py-16">
    <Ghost pose="thinking" size={140} />
    <p class="mt-4 display display-md">NOTHING TO ANALYZE YET.</p>
    <p class="mt-2 text-secondary text-sm">Log a few bets and come back.</p>
  </div>
{:else}
  <!-- ================================================================
       Section 1 — WHERE YOU STAND
       ================================================================ -->
  <section class="mt-10">
    <div class="mb-5">
      <div class="kicker">Section 1</div>
      <h2 class="display display-lg mt-1">WHERE YOU STAND.</h2>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Bankroll -->
      <div class="card">
        <div class="kicker">Bankroll</div>
        <div class="display display-xl num mt-3">{fmtMoney(stats.current_bankroll)}</div>
        <div class="mt-2 text-sm">
          <span class="text-secondary">Start</span>
          <span class="num ml-1">{fmtMoney(stats.starting_bankroll)}</span>
          <span class="text-muted mx-2">·</span>
          <span class="text-secondary">Change</span>
          <span
            class="num ml-1"
            class:text-win={stats.current_bankroll - stats.starting_bankroll > 0}
            class:text-loss={stats.current_bankroll - stats.starting_bankroll < 0}
          >
            {fmtSignedMoney(stats.current_bankroll - stats.starting_bankroll)}
          </span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div class="kicker">Peak</div>
            <div class="num text-base font-semibold mt-1">{fmtMoney(stats.peak_bankroll)}</div>
            {#if atNewPeak}
              <div class="mt-1 chip chip-won" style="font-size: 9px">At peak</div>
            {/if}
          </div>
          <div>
            <div class="kicker">Max DD</div>
            <div class="num text-base font-semibold mt-1 text-loss">
              {stats.max_drawdown > 0 ? `-${fmtMoney(stats.max_drawdown)}` : fmtMoney(0)}
            </div>
            <div class="text-xs text-muted num">
              {stats.max_drawdown_pct > 0 ? `-${(stats.max_drawdown_pct * 100).toFixed(1)}%` : "—"}
            </div>
          </div>
        </div>
      </div>

      <!-- Live exposure -->
      <div class="card">
        <div class="kicker">Live exposure</div>
        <div class="display display-xl num mt-3">{fmtMoney(stats.pending_stake)}</div>
        <div class="mt-2 text-sm text-secondary">
          on <span class="num">{stats.pending_count}</span>
          pending {stats.pending_count === 1 ? "bet" : "bets"}
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div class="kicker">If all win</div>
            <div class="num text-base font-semibold mt-1 text-win">
              {stats.pending_best_case > 0 ? `+${fmtMoney(stats.pending_best_case)}` : fmtMoney(0)}
            </div>
          </div>
          <div>
            <div class="kicker">If all lose</div>
            <div class="num text-base font-semibold mt-1 text-loss">
              {stats.pending_worst_case < 0 ? fmtSignedMoney(stats.pending_worst_case) : fmtMoney(0)}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent form -->
      <div class="card">
        <div class="kicker">Last 30 days</div>
        <div
          class="display display-xl num mt-3"
          class:text-win={stats.rolling_profit_30d > 0}
          class:text-loss={stats.rolling_profit_30d < 0}
        >
          {fmtSignedMoney(stats.rolling_profit_30d)}
        </div>
        <div class="mt-2 text-sm text-secondary">
          <span class="num">{stats.rolling_wins_30d}–{stats.rolling_losses_30d}–{stats.rolling_pushes_30d}</span>
          record
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div class="kicker">ROI 30d</div>
            <div
              class="num text-base font-semibold mt-1"
              class:text-win={stats.rolling_roi_30d > 0}
              class:text-loss={stats.rolling_roi_30d < 0}
            >
              {stats.rolling_roi_30d === 0 && stats.rolling_wins_30d + stats.rolling_losses_30d === 0
                ? "—"
                : fmtRatio(stats.rolling_roi_30d)}
            </div>
          </div>
          <div>
            <div class="kicker">All-time ROI</div>
            <div
              class="num text-base font-semibold mt-1"
              class:text-win={stats.roi > 0}
              class:text-loss={stats.roi < 0}
            >
              {stats.settled_bets === 0 ? "—" : fmtRatio(stats.roi)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================================================================
       Section 2 — ARE YOU SHARP?
       ================================================================ -->
  <section class="mt-12">
    <div class="mb-5">
      <div class="kicker">Section 2</div>
      <h2 class="display display-lg mt-1">ARE YOU SHARP?</h2>
      <p class="mt-2 text-sm text-secondary max-w-2xl">
        Skill signals vs variance. CLV tells you if you're beating the market;
        expected-vs-actual tells you if your EV estimates are honest.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <!-- Expected vs actual -->
      <div class="card">
        <div class="kicker">Expected vs actual</div>
        {#if stats.expected_profit_sample === 0}
          <p class="mt-4 text-sm text-secondary">
            No bets have a fair-odds value yet. Fill in fair odds on your bets
            to unlock the expected-profit comparison.
          </p>
        {:else}
          <div class="mt-4 grid grid-cols-2 gap-6">
            <div>
              <div class="kicker">Expected</div>
              <div class="num text-2xl font-semibold mt-1 font-display">
                {fmtSignedMoney(stats.expected_profit)}
              </div>
              <div class="text-xs text-muted mt-0.5">
                from {stats.expected_profit_sample} bets w/ fair odds
              </div>
            </div>
            <div>
              <div class="kicker">Actual</div>
              <div
                class="num text-2xl font-semibold mt-1 font-display"
                class:text-win={stats.total_profit > 0}
                class:text-loss={stats.total_profit < 0}
              >
                {fmtSignedMoney(stats.total_profit)}
              </div>
              <div class="text-xs text-muted mt-0.5">
                from {stats.settled_bets} settled bets
              </div>
            </div>
          </div>

          <div
            class="mt-5 px-4 py-3"
            style="border-top: 1.5px solid var(--ink-primary)"
          >
            <div class="flex items-center justify-between">
              <div class="kicker">Variance</div>
              <div class="text-sm">
                {#if expectedActualTone() === "hot"}
                  <span class="chip chip-pending" style="font-size: 9px">Running hot</span>
                {:else if expectedActualTone() === "cold"}
                  <span class="chip chip-lost" style="font-size: 9px">Running cold</span>
                {:else}
                  <span class="chip chip-won" style="font-size: 9px">Calibrated</span>
                {/if}
              </div>
            </div>
            <p class="mt-2 text-sm">
              Actual minus expected:
              <span
                class="num font-semibold ml-1"
                class:text-win={expectedActualDelta > 0}
                class:text-loss={expectedActualDelta < 0}
              >
                {fmtSignedMoney(expectedActualDelta)}
              </span>
            </p>
          </div>
        {/if}
      </div>

      <!-- CLV -->
      <div class="card">
        <div class="kicker">Closing-line value</div>
        {#if stats.clv_sample === 0}
          <p class="mt-4 text-sm text-secondary">
            No bets have closing-odds values yet. Fill in closing odds to see
            whether you're beating the market.
          </p>
        {:else}
          <div class="mt-3 grid grid-cols-2 gap-6">
            <div>
              <div class="display display-xl num"
                   class:text-win={stats.clv_beat_rate >= 0.5}>
                {fmtRatio(stats.clv_beat_rate)}
              </div>
              <div class="kicker mt-1">Beat the close</div>
              <div class="text-xs text-muted num mt-0.5">
                on {stats.clv_sample} bets
              </div>
            </div>
            <div>
              <div class="display display-xl num"
                   class:text-win={stats.avg_clv > 0}
                   class:text-loss={stats.avg_clv < 0}>
                {stats.avg_clv > 0 ? "+" : ""}{stats.avg_clv.toFixed(1)}%
              </div>
              <div class="kicker mt-1">Avg CLV</div>
            </div>
          </div>

          <div
            class="mt-5 px-4 py-3"
            style="border-top: 1.5px solid var(--ink-primary)"
          >
            <p class="text-sm">
              {#if stats.clv_beat_rate >= 0.55}
                You're consistently beating the closing line. That's the best
                single indicator you're +EV.
              {:else if stats.clv_beat_rate >= 0.48}
                Roughly breaking even vs the close. Edge is close to zero on
                this sample.
              {:else}
                You're losing to the close more often than not. Tighten your
                models or spots — long-run, this track record projects –EV.
              {/if}
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Chart -->
    <div class="mt-6 card">
      <div class="flex items-center justify-between">
        <div>
          <div class="kicker">The curve</div>
          <h3 class="display display-md mt-1">BANKROLL WITH DRAWDOWN.</h3>
        </div>
        <div class="flex gap-2">
          {#each ["day", "week", "month"] as b}
            <button
              class="btn btn-sm"
              class:btn-primary={bucket === b}
              class:btn-secondary={bucket !== b}
              onclick={() => changeBucket(b as Bucket)}
            >
              {b}
            </button>
          {/each}
        </div>
      </div>
      <div class="mt-4">
        <BankrollChart {points} />
      </div>
      <p class="mt-3 text-xs text-muted">
        Solid line = bankroll. Dashed line = running peak. Shaded region = how
        far underwater you've been from that peak.
      </p>
    </div>
  </section>

  <!-- ================================================================
       Section 3 — WHERE PROFIT COMES FROM
       ================================================================ -->
  <section class="mt-12">
    <div class="mb-5 flex items-end justify-between">
      <div>
        <div class="kicker">Section 3</div>
        <h2 class="display display-lg mt-1">WHERE PROFIT COMES FROM.</h2>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each [
          { k: "sportsbook", label: "Sportsbook" },
          { k: "league", label: "League" },
          { k: "bet_type", label: "Bet type" },
          { k: "strategy", label: "Strategy" },
        ] as opt}
          <button
            class="btn btn-sm"
            class:btn-primary={dimension === opt.k}
            class:btn-secondary={dimension !== opt.k}
            onclick={() => changeDimension(opt.k as Dimension)}
          >
            {opt.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      {#if groups.length === 0}
        <div class="p-8 text-center text-secondary">No data for this breakdown.</div>
      {:else}
        <table class="data-table">
          <thead>
            <tr>
              <th>{dimension === "bet_type" ? "Bet type" : dimension.charAt(0).toUpperCase() + dimension.slice(1)}</th>
              <th style="text-align: right">Bets</th>
              <th style="text-align: right">Record</th>
              <th style="text-align: right">Staked</th>
              <th>Profit</th>
              <th style="text-align: right">ROI</th>
              <th style="text-align: right">Avg CLV</th>
            </tr>
          </thead>
          <tbody>
            {#each groups as g (`${dimension}-${g.id ?? "null"}`)}
              <tr style={g.n_bets < 10 ? "opacity: 0.6" : ""}>
                <td>
                  {g.name}
                  {#if g.n_bets < 10}
                    <span class="chip ml-2" style="font-size: 9px">small sample</span>
                  {/if}
                </td>
                <td class="num" style="text-align: right">{g.n_bets}</td>
                <td class="num text-secondary" style="text-align: right">
                  {g.wins}–{g.losses}{g.pushes > 0 ? `–${g.pushes}` : ""}
                </td>
                <td class="num" style="text-align: right">{fmtMoney(g.staked)}</td>
                <td>
                  <div class="flex items-center gap-3">
                    <!-- Mini bar: width proportional to |profit| / maxAbs -->
                    <div class="flex-1 min-w-[60px]" style="height: 8px; background: var(--bg-sunken); border-radius: 999px; overflow: hidden; position: relative;">
                      {#if maxAbs > 0}
                        <div
                          style="
                            position: absolute;
                            top: 0; bottom: 0;
                            {g.profit >= 0 ? `left: 50%; width: ${(g.profit / maxAbs) * 50}%; background: var(--win);` : `right: 50%; width: ${(-g.profit / maxAbs) * 50}%; background: var(--loss);`}
                          "
                        ></div>
                        <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: var(--ink-primary); opacity: 0.4;"></div>
                      {/if}
                    </div>
                    <span
                      class="num font-semibold whitespace-nowrap"
                      style="min-width: 80px; text-align: right;"
                      class:text-win={g.profit > 0}
                      class:text-loss={g.profit < 0}
                    >
                      {fmtSignedMoney(g.profit)}
                    </span>
                  </div>
                </td>
                <td
                  class="num"
                  style="text-align: right"
                  class:text-win={g.roi > 0}
                  class:text-loss={g.roi < 0}
                >
                  {g.settled_stake > 0 ? fmtRatio(g.roi) : "—"}
                </td>
                <td class="num text-secondary" style="text-align: right">
                  {g.clv_sample > 0 ? `${g.avg_clv > 0 ? "+" : ""}${g.avg_clv.toFixed(1)}%` : "—"}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <p class="mt-3 text-xs text-muted">
      Rows with fewer than 10 bets are dimmed — the sample is too small to draw
      conclusions from.
      {#if dimension === "strategy"}
        Bets can be tagged with multiple strategies, so group totals may sum
        higher than the grand total.
      {/if}
    </p>
  </section>
{/if}
