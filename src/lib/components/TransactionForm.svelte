<script lang="ts">
  import type { NewTransaction, Tag, Transaction, TransactionType } from "../types";
  import { today } from "../format";

  interface Props {
    transaction?: Transaction | null;
    sportsbooks: Tag[];
    onSubmit: (input: NewTransaction) => Promise<void>;
    onCancel: () => void;
  }

  let { transaction = null, sportsbooks, onSubmit, onCancel }: Props = $props();

  /* svelte-ignore state_referenced_locally */
  let tx_date = $state(transaction?.tx_date ?? today());
  /* svelte-ignore state_referenced_locally */
  let transaction_type: TransactionType = $state(transaction?.transaction_type ?? "deposit");
  /* svelte-ignore state_referenced_locally */
  let amount = $state<number>(transaction?.amount ?? 100);
  /* svelte-ignore state_referenced_locally */
  let sportsbook_id = $state<number | null>(transaction?.sportsbook_id ?? null);
  /* svelte-ignore state_referenced_locally */
  let notes = $state<string>(transaction?.notes ?? "");
  let submitting = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    submitting = true;
    try {
      await onSubmit({
        tx_date,
        transaction_type,
        amount: Number(amount),
        sportsbook_id,
        notes: notes.trim() || null,
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
      <input type="date" bind:value={tx_date} required class="input" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Type</span>
      <select bind:value={transaction_type} class="input">
        <option value="deposit">Deposit</option>
        <option value="withdrawal">Withdrawal</option>
      </select>
    </label>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <label class="block">
      <span class="kicker mb-2 block">Amount</span>
      <input type="number" step="0.01" min="0" bind:value={amount} required class="input num" />
    </label>
    <label class="block">
      <span class="kicker mb-2 block">Sportsbook</span>
      <select bind:value={sportsbook_id} class="input">
        <option value={null}>—</option>
        {#each sportsbooks as s (s.id)}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </label>
  </div>

  <label class="block">
    <span class="kicker mb-2 block">Notes</span>
    <input type="text" bind:value={notes} class="input" />
  </label>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" onclick={onCancel} class="btn btn-secondary">Cancel</button>
    <button type="submit" disabled={submitting} class="btn btn-primary">
      {submitting ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
    </button>
  </div>
</form>
