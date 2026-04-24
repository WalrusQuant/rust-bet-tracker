<script lang="ts">
  import { confirmState, resolveConfirm } from "../confirm.svelte";

  function onKey(e: KeyboardEvent) {
    if (!confirmState.open) return;
    if (e.key === "Escape") resolveConfirm(false);
    if (e.key === "Enter") resolveConfirm(true);
  }
</script>

<svelte:window on:keydown={onKey} />

{#if confirmState.open}
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style="background-color: rgba(42, 38, 34, 0.35)"
    onclick={() => resolveConfirm(false)}
    role="presentation"
  >
    <div
      class="w-full max-w-md"
      style="background-color: var(--bg-card); border: 1.5px solid var(--ink-primary); border-radius: 14px;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="px-6 pt-5">
        <div class="kicker">Confirm</div>
        <h2 class="display display-md mt-2">{confirmState.title}</h2>
        <p class="mt-3 text-sm text-secondary">{confirmState.message}</p>
      </div>
      <div
        class="mt-5 flex justify-end gap-3 px-6 py-4"
        style="border-top: 1.5px solid var(--ink-primary)"
      >
        <button class="btn btn-secondary" onclick={() => resolveConfirm(false)}>
          Cancel
        </button>
        <button
          class="btn btn-primary"
          style={confirmState.danger
            ? "background-color: var(--loss); border-color: var(--loss)"
            : ""}
          onclick={() => resolveConfirm(true)}
        >
          {confirmState.confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
