<script lang="ts">
  import Router, { link, location } from "svelte-spa-router";
  import Tracker from "./routes/Tracker.svelte";
  import Analytics from "./routes/Analytics.svelte";
  import Bankroll from "./routes/Bankroll.svelte";
  import Settings from "./routes/Settings.svelte";
  import Calculators from "./routes/Calculators.svelte";
  import CalculatorPage from "./routes/CalculatorPage.svelte";
  import ConfirmDialog from "./lib/components/ConfirmDialog.svelte";

  const routes = {
    "/": Tracker,
    "/analytics": Analytics,
    "/bankroll": Bankroll,
    "/calculators": Calculators,
    "/calculators/:slug": CalculatorPage,
    "/settings": Settings,
  };

  function active(path: string, current: string): string {
    const match =
      path === "/" ? current === "/" || current === "" : current.startsWith(path);
    return match ? "nav-link active" : "nav-link";
  }
</script>

<div class="flex h-full flex-col">
  <nav
    class="flex items-center justify-between px-8 py-4"
    style="border-bottom: 1.5px solid var(--ink-primary)"
  >
    <a href="/" use:link class="display display-md" style="text-decoration: none">
      BET TRACKER.
    </a>
    <div class="flex items-center gap-8">
      <a href="/" use:link class={active("/", $location)}>Tracker</a>
      <a href="/analytics" use:link class={active("/analytics", $location)}>Analytics</a>
      <a href="/bankroll" use:link class={active("/bankroll", $location)}>Bankroll</a>
      <a href="/calculators" use:link class={active("/calculators", $location)}>Calculators</a>
      <a href="/settings" use:link class={active("/settings", $location)}>Settings</a>
    </div>
  </nav>
  <main class="flex-1 overflow-auto px-8 py-10">
    <div class="mx-auto max-w-6xl">
      <Router {routes} />
    </div>
  </main>
</div>

<ConfirmDialog />
