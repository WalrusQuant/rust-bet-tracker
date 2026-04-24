<script lang="ts">
  interface Props {
    open: boolean;
    title: string;
    onClose: () => void;
    children?: import("svelte").Snippet;
    footer?: import("svelte").Snippet;
  }
  let { open, title, onClose, children, footer }: Props = $props();
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background-color: rgba(42, 38, 34, 0.35)"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    role="presentation"
  >
    <div
      class="w-full max-w-xl"
      style="background-color: var(--bg-card); border: 1.5px solid var(--ink-primary); border-radius: 14px;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div
        class="flex items-center justify-between px-6 py-4"
        style="border-bottom: 1.5px solid var(--ink-primary)"
      >
        <h2 id="modal-title" class="display display-md">{title}</h2>
        <button
          type="button"
          class="settle-chip"
          onclick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div class="max-h-[70vh] overflow-auto p-6">
        {@render children?.()}
      </div>
      {#if footer}
        <div
          class="flex justify-end gap-3 px-6 py-4"
          style="border-top: 1.5px solid var(--ink-primary)"
        >
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
