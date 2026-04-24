# Bet Tracker

Local-first sports-betting performance tracker with 21 analysis calculators.
Desktop app built with Rust + Tauri 2 + Svelte 5 + SQLite. Single-user,
fully offline, no auth, no cloud sync — every number is computed on your
machine from your own data.

## Features

### Core workflow

- **Tracker** — Log bets with sportsbook, league, bet type, odds, fair odds,
  closing odds, stake, outcome, and strategy tags. Sortable table, filter
  by date range / book / outcome, inline settle (W/L/P), edit, delete.
- **Analytics** — Three-section dashboard:
  - *Where you stand* — current bankroll, peak, max drawdown, live
    exposure on pending bets, last-30-days record + ROI.
  - *Are you sharp?* — expected-vs-actual profit (running hot / cold /
    calibrated), CLV beat rate, bankroll curve with drawdown shading.
  - *Where profit comes from* — per-sportsbook / league / bet-type /
    strategy breakdown with ROI bars and small-sample flags.
- **Bankroll** — Overall balance + per-sportsbook balances, sizing rule
  (fixed %, fixed $, fractional Kelly), deposits/withdrawals log with
  edit + delete.
- **Settings** — Manage sportsbooks, leagues, bet types, strategies. Full
  database reset (re-seeds defaults).

### Calculators

Twenty-one focused tools for odds math, bet sizing, market analysis, and
simulations. All math runs locally in Rust.

- **Odds & probability** — Odds Converter · Sharp Implied · Devig (5
  methods: EM, Proportional, Shin, Odds Ratio, Logarithmic) · Hold ·
  Vig Comparison
- **Bet sizing & value** — Expected Value · Kelly Criterion · Parlay
- **Lines & markets** — Arbitrage · Hedge · CLV · Better Line (CDF
  analysis) · Alt Line Pricer
- **Simulations** — Risk of Ruin (seeded Monte Carlo) · Poisson Match
  Predictor · Negative Binomial Match Predictor · Player Prop Simulator
  (Poisson / NegBin / Gamma / LogNormal)
- **Advanced** — Bayesian Update (Beta-Binomial) · Regression to the
  Mean · Middle Finder · Teaser EV

## Stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Backend  | Rust, Tauri 2, rusqlite (bundled SQLite), statrs, rand   |
| Frontend | Svelte 5 (runes), Vite 6, Tailwind v4, TypeScript        |
| Charts   | layerchart (bankroll curve), hand-rolled SVG (sparklines) |
| Router   | svelte-spa-router (hash routing)                         |

Data lives in a single SQLite file under the OS app-data dir
(`~/Library/Application Support/com.adamwickwire.bettracker/` on macOS).

## Develop

```sh
bun install
bun tauri dev      # launches the desktop app
```

When you change Rust code, the app rebuilds automatically. Svelte changes
hot-reload. If you add a new `#[tauri::command]`, restart `bun tauri dev`
so the new handler registers on fresh boot.

## Build

```sh
bun tauri build    # .dmg / .app in src-tauri/target/release/bundle/
```

## Test

```sh
cd src-tauri && cargo test --lib calc::
```

All Rust math is unit-tested with known-value assertions. Monte Carlo
simulators take an optional `seed` parameter for deterministic tests.

## Layout

```
src/                          Svelte frontend
  App.svelte                  Top-level layout + router
  routes/
    Tracker.svelte            Bet list + filters + modal form
    Analytics.svelte          Three-section dashboard
    Bankroll.svelte           Balances, sizing, transactions
    Settings.svelte           Tag management + DB reset
    Calculators.svelte        Grid of 21 calculators by category
    CalculatorPage.svelte     Dynamic dispatch for /calculators/:slug
    calculators/              One Svelte file per calculator (21)
  lib/
    api.ts                    Tracker/Analytics/Bankroll Tauri wrappers
    types.ts                  Core domain types
    format.ts                 money / pct / odds formatters
    confirm.svelte.ts         App-wide confirm dialog store
    calculators/
      api.ts                  calc_* Tauri wrappers (21)
      types.ts                calc input/output types
      registry.ts             central calc list (slug, category, blurb)
      format.ts               calc-specific formatters
      sports.ts               per-sport spread/total std-dev defaults
      regression-config.ts    sport × stat regression defaults
    components/
      BetForm.svelte          shared bet add/edit form (used by Tracker)
      TransactionForm.svelte  shared tx add/edit form (used by Bankroll)
      BankrollChart.svelte    layerchart — bankroll + peak + drawdown
      ConfirmDialog.svelte    app-wide confirm modal
      Modal.svelte            generic modal chrome
      SketchDivider.svelte    wobbly hand-drawn divider
      Ghost.svelte            empty-state mascot
      LineChart.svelte        tiny SVG line chart
      calc/                   11 shared primitives for calc pages

src-tauri/                    Rust backend
  Cargo.toml                  tauri, rusqlite, statrs, rand, rand_chacha
  migrations/                 versioned .sql files
  tauri.conf.json
  src/
    main.rs
    lib.rs                    Tauri builder + invoke_handler
    db.rs                     rusqlite connection + migration runner
    error.rs                  AppError + serde
    models.rs                 Bet, Transaction, Stats, GroupStats, ...
    commands.rs               DB-backed IPC commands
    calc_commands.rs          21 calc_* IPC commands
    calc/
      mod.rs                  re-exports
      odds.rs                 American/decimal/fractional, EV, Kelly, CLV
      probability.rs          normal CDF + inverse (via statrs)
      devig.rs                5 devig methods
      hold.rs                 hold%
      vig_comparison.rs       multi-book vig sort
      parlay.rs               combined decimal odds
      arbitrage.rs            arb detection + stake splits
      hedge.rs                hedge stake equalizer
      bayesian.rs             Beta-Binomial update
      regression.rs           shrinkage + 90% CI
      bestline.rs             implied true line + comparison
      altline.rs              alternate-line ladder
      risk_of_ruin.rs         Monte Carlo bankroll paths
      middle.rs               middle/trap gap math
      teaser_ev.rs            NFL teaser analyzer
      poisson.rs              match predictor from Poisson λ
      nbinom.rs               match predictor with overdispersion
      prop_sim.rs             player prop Monte Carlo

docs/
  blog/                       15 MDX posts for future GitHub Pages site
                              (authored in the source app; stashed here
                              for the standalone docs site to build)
```

## Docs

Long-form write-ups for each calculator live as MDX files in
`docs/blog/`. They are **not** rendered inside the Tauri app — the app
shows a short 3–4 sentence blurb per calc (authored in
`src/lib/calculators/registry.ts`). The `.mdx` files are the canonical
source for a separate GitHub Pages documentation site; swap
`DOCS_BASE_URL` in the registry when that site goes live.
