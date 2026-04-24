<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api";
  import type { Tag, TagKind } from "../lib/types";
  import SketchDivider from "../lib/components/SketchDivider.svelte";
  import { openConfirm } from "../lib/confirm.svelte";

  type Group = {
    kind: TagKind;
    label: string;
    kicker: string;
    tags: Tag[];
    newName: string;
    error: string | null;
  };

  let groups = $state<Group[]>([
    { kind: "sportsbook", label: "Sportsbooks", kicker: "Where you play", tags: [], newName: "", error: null },
    { kind: "league",     label: "Leagues",     kicker: "What you bet on", tags: [], newName: "", error: null },
    { kind: "bet_type",   label: "Bet Types",   kicker: "The shape of the wager", tags: [], newName: "", error: null },
    { kind: "strategy",   label: "Strategies",  kicker: "Your systems", tags: [], newName: "", error: null },
  ]);

  let firstLoad = $state(true);

  async function load() {
    const results = await Promise.all(groups.map((g) => api.listTags(g.kind)));
    groups.forEach((g, i) => (g.tags = results[i]));
    firstLoad = false;
  }

  async function addTag(g: Group) {
    const name = g.newName.trim();
    if (!name) return;
    g.error = null;
    try {
      await api.createTag(g.kind, name);
      g.newName = "";
      g.tags = await api.listTags(g.kind);
    } catch (e) {
      g.error = String(e);
    }
  }

  async function removeTag(g: Group, t: Tag) {
    const ok = await openConfirm(
      `Delete "${t.name}"?`,
      `Bets and transactions tagged with "${t.name}" will lose the tag but stay intact.`
    );
    if (!ok) return;
    await api.deleteTag(g.kind, t.id);
    g.tags = await api.listTags(g.kind);
  }

  let resetting = $state(false);
  let resetError = $state<string | null>(null);
  let resetFlash = $state(false);

  async function resetDb() {
    const ok = await openConfirm(
      "Wipe everything?",
      "This deletes ALL bets, transactions, and tags, then restores the default sportsbooks / leagues / bet types and resets the bankroll to $0 at 1% fixed. It can't be undone.",
      { confirmLabel: "Wipe it" }
    );
    if (!ok) return;
    resetting = true;
    resetError = null;
    try {
      await api.resetDatabase();
      await load();
      resetFlash = true;
      setTimeout(() => (resetFlash = false), 2000);
    } catch (e) {
      resetError = String(e);
    } finally {
      resetting = false;
    }
  }

  onMount(load);
</script>

<header>
  <div class="kicker">Lists you curate</div>
  <h1 class="display display-xl mt-2">THE SETTINGS.</h1>
</header>

<div class="mt-6">
  <SketchDivider />
</div>

{#if firstLoad}
  <p class="mt-8 text-secondary">Loading…</p>
{:else}
  <div class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
    {#each groups as g (g.kind)}
      <section class="card">
        <div class="kicker">{g.kicker}</div>
        <h2 class="display display-lg mt-1">{g.label.toUpperCase()}.</h2>

        <form
          class="mt-5 flex items-end gap-3"
          onsubmit={(e) => { e.preventDefault(); addTag(g); }}
        >
          <label class="block flex-1">
            <span class="kicker mb-2 block">Add new</span>
            <input
              type="text"
              bind:value={g.newName}
              class="input"
              placeholder={`e.g. ${g.kind === "sportsbook" ? "Caesars" : g.kind === "league" ? "NCAAF" : g.kind === "bet_type" ? "Alt line" : "CLV hunting"}`}
            />
          </label>
          <button type="submit" class="btn btn-primary btn-sm" disabled={!g.newName.trim()}>
            + Add
          </button>
        </form>

        {#if g.error}
          <p class="mt-3 text-sm" style="color: var(--loss)">{g.error}</p>
        {/if}

        <ul class="mt-5 space-y-2">
          {#if g.tags.length === 0}
            <li class="text-secondary text-sm">Nothing here yet.</li>
          {:else}
            {#each g.tags as t (t.id)}
              <li
                class="flex items-center justify-between px-3 py-2"
                style="border: 1.5px solid var(--ink-primary); border-radius: 8px; background: var(--bg-page);"
              >
                <span>{t.name}</span>
                <button class="link-btn danger" onclick={() => removeTag(g, t)}>Delete</button>
              </li>
            {/each}
          {/if}
        </ul>
      </section>
    {/each}
  </div>

  <section class="mt-10">
    <div class="mb-4">
      <div class="kicker">Danger zone</div>
      <h2 class="display display-lg mt-1">START OVER.</h2>
    </div>

    <div
      class="card"
      style="border-color: var(--loss)"
    >
      <div class="flex items-start justify-between gap-6">
        <div class="flex-1">
          <p class="text-sm">
            Wipe every bet, transaction, and custom tag. Re-seeds the default
            sportsbooks, leagues, and bet types, and resets the bankroll to
            $0 at 1% fixed. There is no undo.
          </p>
          {#if resetError}
            <p class="mt-3 text-sm" style="color: var(--loss)">{resetError}</p>
          {/if}
          {#if resetFlash}
            <p class="mt-3 kicker" style="color: var(--win)">Database reset</p>
          {/if}
        </div>
        <button
          type="button"
          class="btn btn-primary"
          style="background-color: var(--loss); border-color: var(--loss)"
          onclick={resetDb}
          disabled={resetting}
        >
          {resetting ? "Wiping…" : "Reset database"}
        </button>
      </div>
    </div>
  </section>
{/if}
