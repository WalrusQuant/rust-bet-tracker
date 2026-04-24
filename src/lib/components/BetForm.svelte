<script lang="ts">
  import type { BankrollSettings, Bet, NewBet, Outcome, Tag } from "../types";
  import { api } from "../api";
  import { fmtMoney, today } from "../format";

  interface Props {
    bet?: Bet | null;
    sportsbooks: Tag[];
    leagues: Tag[];
    betTypes: Tag[];
    strategies: Tag[];
    onSubmit: (input: NewBet) => Promise<void>;
    onCancel: () => void;
  }

  let { bet = null, sportsbooks, leagues, betTypes, strategies, onSubmit, onCancel }: Props = $props();

  /* svelte-ignore state_referenced_locally */
  let bet_date = $state(bet?.bet_date ?? today());
  /* svelte-ignore state_referenced_locally */
  let sportsbook_id = $state<number | null>(bet?.sportsbook_id ?? null);
  /* svelte-ignore state_referenced_locally */
  let league_id = $state<number | null>(bet?.league_id ?? null);
  /* svelte-ignore state_referenced_locally */
  let bet_type_id = $state<number | null>(bet?.bet_type_id ?? null);
  /* svelte-ignore state_referenced_locally */
  let odds = $state<number>(bet?.odds ?? -110);
  /* svelte-ignore state_referenced_locally */
  let fair_odds = $state<number | null>(bet?.fair_odds ?? null);
  /* svelte-ignore state_referenced_locally */
  let closing_odds = $state<number | null>(bet?.closing_odds ?? null);
  /* svelte-ignore state_referenced_locally */
  let stake = $state<number>(bet?.stake ?? 10);
  /* svelte-ignore state_referenced_locally */
  let outcome = $state<Outcome>(bet?.outcome ?? "pending");
  /* svelte-ignore state_referenced_locally */
  let notes = $state<string>(bet?.notes ?? "");
  /* svelte-ignore state_referenced_locally */
  let strategy_ids = $state<number[]>(bet?.strategy_ids ?? []);
  let submitting = $state(false);

  // Recommended-stake suggestion based on current bankroll settings.
  let settings = $state<BankrollSettings | null>(null);
  let suggested = $state<number>(0);
  $effect(() => {
    api.getBankrollSettings().then((s) => (settings = s));
  });

  // Debounced recompute when odds / fair_odds change.
  let debounceHandle: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const o = Number(odds);
    const f = fair_odds === null || Number.isNaN(fair_odds) ? null : Number(fair_odds);
    if (!Number.isFinite(o)) return;
    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      api
        .recommendedStake(o, f)
        .then((v) => (suggested = v))
        .catch(() => (suggested = 0));
    }, 120);
  });

  const needsFairOdds = $derived(
    settings?.unit_sizing_method === "kelly" &&
      (fair_odds === null || Number.isNaN(fair_odds))
  );

  const methodLabel = $derived(() => {
    if (!settings) return "";
    switch (settings.unit_sizing_method) {
      case "fixed_percent":
        return `${settings.unit_size_value}% fixed`;
      case "fixed_amount":
        return `$${settings.unit_size_value} fixed`;
      case "kelly":
        return settings.kelly_fraction === 1
          ? "Full Kelly"
          : `${settings.kelly_fraction}× Kelly`;
    }
  });

  const ratio = $derived(
    suggested > 0 && Number(stake) > 0 ? Number(stake) / suggested : 0
  );

  function useSuggested() {
    if (suggested > 0) stake = Math.round(suggested * 100) / 100;
  }

  function toggleStrategy(id: number) {
    strategy_ids = strategy_ids.includes(id)
      ? strategy_ids.filter((x) => x !== id)
      : [...strategy_ids, id];
  }

  async function submit(e: Event) {
    e.preventDefault();
    submitting = true;
    try {
      await onSubmit({
        bet_date,
        sportsbook_id,
        league_id,
        bet_type_id,
        odds: Number(odds),
        fair_odds: fair_odds === null || Number.isNaN(fair_odds) ? null : Number(fair_odds),
        closing_odds:
          closing_odds === null || Number.isNaN(closing_odds) ? null : Number(closing_odds),
        stake: Number(stake),
        outcome,
        notes: notes.trim() || null,
        strategy_ids,
      });
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={submit} class="space-y-5">
  <div class="grid grid-cols-2 gap-4">
    <label class="block">
      <span class="kicker mb-2 block">Date</span>
      <input type="date" bind:value={bet_date} required class="input" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Outcome</span>
      <select bind:value={outcome} class="input">
        <option value="pending">Pending</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
        <option value="push">Push</option>
      </select>
    </label>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <label class="block">
      <span class="kicker mb-2 block">Sportsbook</span>
      <select bind:value={sportsbook_id} class="input">
        <option value={null}>—</option>
        {#each sportsbooks as s (s.id)}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="kicker mb-2 block">League</span>
      <select bind:value={league_id} class="input">
        <option value={null}>—</option>
        {#each leagues as l (l.id)}
          <option value={l.id}>{l.name}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Bet type</span>
      <select bind:value={bet_type_id} class="input">
        <option value={null}>—</option>
        {#each betTypes as b (b.id)}
          <option value={b.id}>{b.name}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="grid grid-cols-4 gap-4">
    <label class="block">
      <span class="kicker mb-2 block">Odds</span>
      <input type="number" bind:value={odds} required class="input num" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Stake</span>
      <input type="number" step="0.01" min="0" bind:value={stake} required class="input num" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Fair odds</span>
      <input type="number" bind:value={fair_odds} class="input num" placeholder="—" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Closing</span>
      <input type="number" bind:value={closing_odds} class="input num" placeholder="—" />
    </label>
  </div>

  <!-- Recommended stake strip -->
  <div
    class="flex flex-wrap items-center gap-3 px-4 py-3"
    style="background: var(--bg-sunken); border: 1.5px solid var(--ink-primary); border-radius: 10px;"
  >
    <div class="kicker">Recommended</div>
    {#if needsFairOdds}
      <div class="text-sm text-secondary">Enter fair odds to compute a Kelly stake.</div>
    {:else if suggested <= 0}
      <div class="text-sm text-secondary">—</div>
    {:else}
      <div class="num font-semibold" style="font-size: 16px">{fmtMoney(suggested)}</div>
      <div class="text-xs text-muted">· {methodLabel()}</div>
      <button type="button" class="btn btn-secondary btn-sm ml-auto" onclick={useSuggested}>
        Use
      </button>
    {/if}
    {#if ratio > 0 && !needsFairOdds && suggested > 0}
      <div
        class="num text-xs font-semibold"
        style="padding: 2px 8px; border-radius: 999px; {ratio > 1.5 ? 'background: var(--loss); color: var(--bg-page);' : ratio < 0.5 ? 'background: var(--bg-page); border: 1px solid var(--ink-3); color: var(--ink-2);' : 'background: var(--win); color: var(--bg-page);'}"
      >
        {ratio.toFixed(2)}×
      </div>
    {/if}
  </div>

  {#if strategies.length > 0}
    <div>
      <span class="kicker mb-2 block">Strategies</span>
      <div class="flex flex-wrap gap-2">
        {#each strategies as s (s.id)}
          <button
            type="button"
            onclick={() => toggleStrategy(s.id)}
            class="tag-pill"
            class:on={strategy_ids.includes(s.id)}
          >
            {s.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <label class="block">
    <span class="kicker mb-2 block">Notes</span>
    <textarea bind:value={notes} rows="2" class="input"></textarea>
  </label>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" onclick={onCancel} class="btn btn-secondary">Cancel</button>
    <button type="submit" disabled={submitting} class="btn btn-primary">
      {submitting ? "Saving…" : bet ? "Save changes" : "Add bet"}
    </button>
  </div>
</form>
