<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api";
  import type {
    BankrollSettings,
    NewTransaction,
    SportsbookBalance,
    Tag,
    Transaction,
    TransactionType,
  } from "../lib/types";
  import { fmtMoney, fmtSignedMoney, today } from "../lib/format";
  import Ghost from "../lib/components/Ghost.svelte";
  import SketchDivider from "../lib/components/SketchDivider.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import TransactionForm from "../lib/components/TransactionForm.svelte";
  import { openConfirm } from "../lib/confirm.svelte";

  let settings = $state<BankrollSettings>({
    starting_bankroll: 0,
    unit_sizing_method: "fixed_percent",
    unit_size_value: 1,
    kelly_fraction: 0.5,
  });
  let currentBankroll = $state(0);
  let transactions = $state<Transaction[]>([]);
  let sportsbooks = $state<Tag[]>([]);
  let balances = $state<SportsbookBalance[]>([]);
  let firstLoad = $state(true);
  let savedFlash = $state(false);

  let tx_date = $state(today());
  let tx_type: TransactionType = $state("deposit");
  let tx_amount = $state(100);
  let tx_sportsbook: number | null = $state(null);
  let tx_notes = $state("");

  let showTxForm = $state(false);
  let editingTx = $state<Transaction | null>(null);

  async function load() {
    const [s, br, tx, sb, bal] = await Promise.all([
      api.getBankrollSettings(),
      api.currentBankroll(),
      api.listTransactions(),
      api.listTags("sportsbook"),
      api.sportsbookBalances(),
    ]);
    settings = s;
    currentBankroll = br;
    transactions = tx;
    sportsbooks = sb;
    balances = bal;
    firstLoad = false;
  }

  async function saveSettings(e: Event) {
    e.preventDefault();
    settings = await api.updateBankrollSettings(settings);
    savedFlash = true;
    setTimeout(() => (savedFlash = false), 1500);
  }

  async function addTransaction(e: Event) {
    e.preventDefault();
    const input: NewTransaction = {
      tx_date,
      transaction_type: tx_type,
      amount: Number(tx_amount),
      sportsbook_id: tx_sportsbook,
      notes: tx_notes.trim() || null,
    };
    await api.createTransaction(input);
    tx_amount = 100;
    tx_notes = "";
    await load();
  }

  function openEditTx(t: Transaction) {
    editingTx = t;
    showTxForm = true;
  }

  async function saveTxEdit(input: NewTransaction) {
    if (!editingTx) return;
    await api.updateTransaction(editingTx.id, input);
    showTxForm = false;
    editingTx = null;
    await load();
  }

  async function removeTx(t: Transaction) {
    const ok = await openConfirm(
      "Delete transaction?",
      `This removes the ${t.transaction_type} of ${fmtMoney(t.amount)} on ${t.tx_date}. It can't be undone.`
    );
    if (!ok) return;
    await api.deleteTransaction(t.id);
    await load();
  }

  const sbName = $derived(new Map(sportsbooks.map((s) => [s.id, s.name])));

  // Breakdown derived from transactions + current bankroll.
  const totalDeposits = $derived(
    transactions.filter((t) => t.transaction_type === "deposit")
      .reduce((s, t) => s + t.amount, 0)
  );
  const totalWithdrawals = $derived(
    transactions.filter((t) => t.transaction_type === "withdrawal")
      .reduce((s, t) => s + t.amount, 0)
  );
  const netPL = $derived(
    currentBankroll - settings.starting_bankroll - (totalDeposits - totalWithdrawals)
  );

  onMount(load);
</script>

<header>
  <div class="kicker">Money in, money out</div>
  <h1 class="display display-xl mt-2">THE BANKROLL.</h1>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

{#if firstLoad}
  <p class="mt-8 text-secondary">Loading…</p>
{:else}
  <div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
    <!-- Left: overall bankroll -->
    <div class="card flex flex-col">
      <div class="kicker">Current bankroll</div>
      <div class="display display-xl num mt-3">{fmtMoney(currentBankroll)}</div>
      <p class="mt-2 text-sm text-secondary flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Deposits
          <span class="num text-win ml-1">+{fmtMoney(totalDeposits)}</span>
        </span>
        {#if totalWithdrawals > 0}
          <span>
            Withdrawals
            <span class="num text-loss ml-1">-{fmtMoney(totalWithdrawals)}</span>
          </span>
        {/if}
        <span>
          Wagering P/L
          <span
            class="num ml-1"
            class:text-win={netPL > 0}
            class:text-loss={netPL < 0}
          >{fmtSignedMoney(netPL)}</span>
        </span>
      </p>

      <div class="mt-auto pt-5">
        <div class="kicker">Sizing rule</div>
        <p class="mt-2 text-sm">
          {#if settings.unit_sizing_method === "fixed_percent"}
            <span class="num font-semibold">{settings.unit_size_value}%</span> of bankroll per bet
          {:else if settings.unit_sizing_method === "fixed_amount"}
            <span class="num font-semibold">{fmtMoney(settings.unit_size_value)}</span> per bet
          {:else}
            <span class="font-semibold">
              {settings.kelly_fraction === 1 ? "Full Kelly" : `${settings.kelly_fraction}× Kelly`}
            </span>
            <span class="text-secondary text-xs">
              (capped at 10% of bankroll, requires fair odds)
            </span>
          {/if}
        </p>
        <p class="mt-1 text-muted text-xs">
          Used when adding a bet. Adjust below.
        </p>
      </div>
    </div>

    <!-- Right: per-sportsbook balances -->
    <div class="card">
      <div class="kicker">By sportsbook</div>
      <h3 class="display display-md mt-1">BALANCES.</h3>

      {#if balances.length === 0}
        <p class="mt-4 text-sm text-secondary">
          No activity yet. Log a deposit to track balances per book.
        </p>
      {:else}
        <div class="balances-scroll mt-4">
          {#each balances as b (b.id ?? "unassigned")}
            <div
              class="flex items-center justify-between py-3"
              style="border-top: 1px solid var(--bg-sunken)"
            >
              <div class="min-w-0">
                <div
                  class="font-semibold text-sm"
                  class:text-muted={b.id === null}
                >
                  {b.name}
                </div>
                <div class="text-xs text-muted mt-0.5 num">
                  {b.n_bets} {b.n_bets === 1 ? "bet" : "bets"}
                  {#if b.pending_stake > 0}
                    · <span class="text-secondary">{fmtMoney(b.pending_stake)} pending</span>
                  {/if}
                </div>
              </div>
              <div class="text-right">
                <div
                  class="num font-semibold"
                  style="font-size: 16px"
                  class:text-win={b.balance > 0}
                  class:text-loss={b.balance < 0}
                >
                  {fmtMoney(b.balance)}
                </div>
                <div class="text-xs text-muted num mt-0.5">
                  <span
                    class:text-win={b.profit > 0}
                    class:text-loss={b.profit < 0}
                  >
                    {fmtSignedMoney(b.profit)}
                  </span>
                  P/L
                </div>
              </div>
            </div>
          {/each}
        </div>
        {#if balances.length > 3}
          <p class="mt-2 text-xs text-muted text-center">
            {balances.length} books · scroll to see all
          </p>
        {/if}
      {/if}
    </div>
  </div>

  <section class="mt-10">
    <div class="mb-4 flex items-end justify-between">
      <div>
        <div class="kicker">Sizing settings</div>
        <h2 class="display display-lg mt-1">HOW MUCH, BY DEFAULT.</h2>
      </div>
      {#if savedFlash}
        <span class="kicker" style="color: var(--win)">Saved</span>
      {/if}
    </div>

    <form onsubmit={saveSettings} class="card">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label class="block">
          <span class="kicker mb-2 block">Method</span>
          <select bind:value={settings.unit_sizing_method} class="input">
            <option value="fixed_percent">Fixed % of bankroll</option>
            <option value="fixed_amount">Fixed amount</option>
            <option value="kelly">Kelly criterion</option>
          </select>
        </label>
        <label class="block">
          <span class="kicker mb-2 block">
            {settings.unit_sizing_method === "fixed_percent" ? "Percent (%)" : "Amount ($)"}
          </span>
          <input type="number" step="0.01" bind:value={settings.unit_size_value} class="input num" />
        </label>
        <label class="block">
          <span class="kicker mb-2 block">Kelly fraction</span>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            bind:value={settings.kelly_fraction}
            class="input num"
            disabled={settings.unit_sizing_method !== "kelly"}
          />
        </label>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="submit" class="btn btn-primary">Save settings</button>
      </div>
    </form>
  </section>

  <section class="mt-10">
    <div class="mb-4">
      <div class="kicker">Transactions</div>
      <h2 class="display display-lg mt-1">DEPOSITS &amp; WITHDRAWALS.</h2>
    </div>

    <form onsubmit={addTransaction} class="card">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
        <label class="block">
          <span class="kicker mb-2 block">Date</span>
          <input type="date" bind:value={tx_date} required class="input" />
        </label>
        <label class="block">
          <span class="kicker mb-2 block">Type</span>
          <select bind:value={tx_type} class="input">
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </label>
        <label class="block">
          <span class="kicker mb-2 block">Amount</span>
          <input type="number" step="0.01" min="0" bind:value={tx_amount} required class="input num" />
        </label>
        <label class="block">
          <span class="kicker mb-2 block">Sportsbook</span>
          <select bind:value={tx_sportsbook} class="input">
            <option value={null}>—</option>
            {#each sportsbooks as s (s.id)}
              <option value={s.id}>{s.name}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="kicker mb-2 block">Notes</span>
          <input type="text" bind:value={tx_notes} class="input" />
        </label>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="submit" class="btn btn-primary">+ Add transaction</button>
      </div>
    </form>

    <div class="card mt-5" style="padding: 0; overflow: hidden;">
      {#if transactions.length === 0}
        <div class="flex flex-col items-center py-12">
          <Ghost pose="thinking" size={120} />
          <p class="mt-4 display display-md">NO TRANSACTIONS YET.</p>
          <p class="mt-2 text-secondary text-sm">Log deposits and withdrawals above.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th style="text-align: right">Amount</th>
                <th>Sportsbook</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each transactions as t (t.id)}
                <tr>
                  <td class="num whitespace-nowrap">{t.tx_date}</td>
                  <td class="capitalize">{t.transaction_type}</td>
                  <td class="num" style="text-align: right"
                      class:text-win={t.transaction_type === "deposit"}
                      class:text-loss={t.transaction_type === "withdrawal"}>
                    {t.transaction_type === "deposit" ? "+" : "-"}{fmtMoney(t.amount)}
                  </td>
                  <td>{t.sportsbook_id ? sbName.get(t.sportsbook_id) ?? "—" : "—"}</td>
                  <td class="text-secondary">{t.notes ?? ""}</td>
                  <td class="whitespace-nowrap" style="text-align: right">
                    <button
                      type="button"
                      class="link-btn"
                      onclick={(e) => { e.stopPropagation(); openEditTx(t); }}
                    >Edit</button>
                    <span class="mx-2 text-muted">·</span>
                    <button
                      type="button"
                      class="link-btn danger"
                      onclick={(e) => { e.stopPropagation(); removeTx(t); }}
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

  <Modal
    open={showTxForm}
    title="Edit transaction"
    onClose={() => { showTxForm = false; editingTx = null; }}
  >
    <TransactionForm
      transaction={editingTx}
      {sportsbooks}
      onSubmit={saveTxEdit}
      onCancel={() => { showTxForm = false; editingTx = null; }}
    />
  </Modal>
{/if}
