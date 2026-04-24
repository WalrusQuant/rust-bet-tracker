<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api";
  import type { Bet, BetFilter, NewBet, Outcome, Tag } from "../lib/types";
  import { fmtMoney, fmtOdds, fmtSignedMoney } from "../lib/format";
  import Modal from "../lib/components/Modal.svelte";
  import BetForm from "../lib/components/BetForm.svelte";
  import Ghost from "../lib/components/Ghost.svelte";
  import SketchDivider from "../lib/components/SketchDivider.svelte";
  import { openConfirm } from "../lib/confirm.svelte";

  let bets = $state<Bet[]>([]);
  let sportsbooks = $state<Tag[]>([]);
  let leagues = $state<Tag[]>([]);
  let betTypes = $state<Tag[]>([]);
  let strategies = $state<Tag[]>([]);
  let firstLoad = $state(true);
  let error = $state<string | null>(null);

  let filter = $state<BetFilter>({});
  let showForm = $state(false);
  let editing = $state<Bet | null>(null);

  const tagNameMap = $derived({
    sportsbook: new Map(sportsbooks.map((t) => [t.id, t.name])),
    league: new Map(leagues.map((t) => [t.id, t.name])),
    betType: new Map(betTypes.map((t) => [t.id, t.name])),
  });

  async function load() {
    error = null;
    try {
      const [b, sb, lg, bt, st] = await Promise.all([
        api.listBets(filter),
        api.listTags("sportsbook"),
        api.listTags("league"),
        api.listTags("bet_type"),
        api.listTags("strategy"),
      ]);
      bets = b;
      sportsbooks = sb;
      leagues = lg;
      betTypes = bt;
      strategies = st;
    } catch (e) {
      error = String(e);
    } finally {
      firstLoad = false;
    }
  }

  onMount(load);

  function openNew() {
    editing = null;
    showForm = true;
  }

  function openEdit(b: Bet) {
    editing = b;
    showForm = true;
  }

  async function handleSubmit(input: NewBet) {
    if (editing) await api.updateBet(editing.id, input);
    else await api.createBet(input);
    showForm = false;
    await load();
  }

  async function settle(b: Bet, outcome: Outcome) {
    await api.settleBet(b.id, outcome);
    await load();
  }

  async function remove(b: Bet) {
    const ok = await openConfirm(
      "Delete bet?",
      `This removes the bet from ${b.bet_date} for ${fmtMoney(b.stake)} at ${fmtOdds(b.odds)}. It can't be undone.`
    );
    if (!ok) return;
    try {
      await api.deleteBet(b.id);
      await load();
    } catch (e) {
      error = `Delete failed: ${String(e)}`;
    }
  }

  function profitOf(b: Bet): number {
    if (b.outcome === "won") {
      return b.odds >= 100 ? (b.stake * b.odds) / 100 : (b.stake * 100) / -b.odds;
    }
    if (b.outcome === "lost") return -b.stake;
    return 0;
  }
</script>

<header class="flex items-end justify-between">
  <div>
    <div class="kicker">Your log</div>
    <h1 class="display display-xl mt-2">THE TRACKER.</h1>
  </div>
  <button class="btn btn-primary" onclick={openNew}>+ Add bet</button>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

<section class="mt-8 card">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
    <label class="block">
      <span class="kicker mb-2 block">From</span>
      <input type="date" bind:value={filter.from_date} class="input" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">To</span>
      <input type="date" bind:value={filter.to_date} class="input" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Sportsbook</span>
      <select bind:value={filter.sportsbook_id} class="input">
        <option value={null}>All</option>
        {#each sportsbooks as s (s.id)}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Outcome</span>
      <select bind:value={filter.outcome} class="input">
        <option value={null}>All</option>
        <option value="pending">Pending</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
        <option value="push">Push</option>
      </select>
    </label>
  </div>
  <div class="mt-5 flex justify-end gap-3">
    <button class="btn btn-secondary btn-sm" onclick={() => { filter = {}; load(); }}>Clear</button>
    <button class="btn btn-primary btn-sm" onclick={load}>Apply</button>
  </div>
</section>

{#if error}
  <div class="mt-6 card" style="border-color: var(--loss); color: var(--loss)">
    {error}
  </div>
{/if}

<section class="mt-8">
  <div class="mb-4 flex items-end justify-between">
    <div>
      <div class="kicker">Bet list</div>
      <h2 class="display display-lg mt-1">EVERY WAGER, IN ORDER.</h2>
    </div>
    {#if bets.length > 0}
      <div class="kicker">{bets.length} {bets.length === 1 ? "bet" : "bets"}</div>
    {/if}
  </div>

  <div class="card" style="padding: 0; overflow: hidden;">
    {#if firstLoad}
      <div class="p-8 text-center text-secondary">Loading…</div>
    {:else if bets.length === 0}
      <div class="flex flex-col items-center py-16">
        <Ghost pose="sitting" size={140} />
        <p class="mt-4 display display-md">NO BETS YET.</p>
        <p class="mt-2 text-secondary text-sm">Log your first wager to start tracking.</p>
        <button class="btn btn-primary mt-6" onclick={openNew}>+ Add bet</button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sportsbook</th>
              <th>League</th>
              <th>Type</th>
              <th style="text-align: right">Odds</th>
              <th style="text-align: right">Stake</th>
              <th>Outcome</th>
              <th style="text-align: right">P/L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each bets as b (b.id)}
              <tr>
                <td class="num whitespace-nowrap">{b.bet_date}</td>
                <td>{b.sportsbook_id ? tagNameMap.sportsbook.get(b.sportsbook_id) ?? "—" : "—"}</td>
                <td>{b.league_id ? tagNameMap.league.get(b.league_id) ?? "—" : "—"}</td>
                <td>{b.bet_type_id ? tagNameMap.betType.get(b.bet_type_id) ?? "—" : "—"}</td>
                <td class="num" style="text-align: right">{fmtOdds(b.odds)}</td>
                <td class="num" style="text-align: right">{fmtMoney(b.stake)}</td>
                <td>
                  {#if b.outcome === "pending"}
                    <div class="flex gap-1">
                      <button class="settle-chip win" aria-label="Won" onclick={() => settle(b, "won")}>W</button>
                      <button class="settle-chip loss" aria-label="Lost" onclick={() => settle(b, "lost")}>L</button>
                      <button class="settle-chip push" aria-label="Push" onclick={() => settle(b, "push")}>P</button>
                    </div>
                  {:else}
                    <span class="chip chip-{b.outcome}">{b.outcome}</span>
                  {/if}
                </td>
                <td class="num" style="text-align: right"
                    class:text-win={profitOf(b) > 0}
                    class:text-loss={profitOf(b) < 0}>
                  {b.outcome === "pending" ? "—" : fmtSignedMoney(profitOf(b))}
                </td>
                <td class="whitespace-nowrap" style="text-align: right">
                  <button
                    type="button"
                    class="link-btn"
                    onclick={(e) => { e.stopPropagation(); openEdit(b); }}
                  >Edit</button>
                  <span class="mx-2 text-muted">·</span>
                  <button
                    type="button"
                    class="link-btn danger"
                    onclick={(e) => { e.stopPropagation(); remove(b); }}
                  >Delete</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</section>

<Modal open={showForm} title={editing ? "Edit bet" : "Add bet"} onClose={() => (showForm = false)}>
  <BetForm
    bet={editing}
    {sportsbooks}
    {leagues}
    {betTypes}
    {strategies}
    onSubmit={handleSubmit}
    onCancel={() => (showForm = false)}
  />
</Modal>
