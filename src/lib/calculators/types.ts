// Types for calculator command IO. Mirror the Rust-side structs in
// `src-tauri/src/calc_commands.rs`. Use snake_case throughout (Rust's
// default serde shape) — Tauri ships the values as-is.

export type OddsFormat = "american" | "decimal" | "fractional";

// Odds Converter
export interface OddsConvertInput { value: string; format: OddsFormat; }
export interface OddsConvertOutput {
  american: string | null;
  decimal: number | null;
  fractional: string | null;
  implied_prob: number | null;
}

// Sharp Implied
export interface SharpImpliedInput {
  home_american: number;
  away_american: number;
  spread: number | null;
  total: number | null;
}
export interface SharpImpliedOutput {
  home_implied: number;
  away_implied: number;
  margin_pct: number;
  home_fair_prob: number;
  away_fair_prob: number;
  home_fair_american: number;
  away_fair_american: number;
  home_score_projection: number | null;
  away_score_projection: number | null;
}

// Devig
export interface DevigInput {
  implied_probs: number[];
  bet_implied: number | null;
}
export interface DevigMethodResult {
  method: string;
  name: string;
  fair_probs: number[] | null;
  ev_percent: number | null;
}
export interface DevigOutput {
  methods: DevigMethodResult[];
  margin_pct: number;
}

// EV
export interface EVInput { your_odds: number; fair_odds: number; stake: number; }
export interface EVOutput {
  ev_dollars: number;
  ev_percent: number;
  edge_percent: number;
  your_implied: number;
  fair_prob: number;
  break_even_win_rate: number;
}

// Kelly
export interface KellyInput {
  win_probability: number;
  decimal_odds: number;
  bankroll: number;
  fraction: number;
}
export interface KellyOutput {
  kelly_fraction: number;
  recommended_fraction: number;
  recommended_stake: number;
  edge_percent: number;
}

// Parlay
export interface ParlayInput { legs: number[]; stake: number; }
export interface ParlayOutput {
  combined_decimal: number;
  combined_american: number;
  combined_implied_prob: number;
  stake: number;
  profit: number;
  payout: number;
}

// Arbitrage
export interface ArbitrageInput { legs: number[]; total_stake: number; }
export interface ArbSplit { stake: number; payout: number; }
export interface ArbitrageOutput {
  total_stake: number;
  total_implied: number;
  is_arb: boolean;
  arb_percent: number;
  guaranteed_profit: number;
  splits: ArbSplit[];
}

// Hedge
export interface HedgeInput {
  original_stake: number;
  original_odds: number;
  hedge_odds: number;
}
export interface HedgeOutput {
  hedge_stake: number;
  total_stake: number;
  payout_if_original_wins: number;
  payout_if_hedge_wins: number;
  guaranteed_profit: number;
}

// CLV
export interface ClvInput { placed_odds: number; closing_odds: number; stake: number | null; }
export interface ClvOutput {
  clv_percent: number;
  clv_dollars: number | null;
  placed_decimal: number;
  closing_decimal: number;
  placed_implied: number;
  closing_implied: number;
}

// Hold
export interface HoldInput { odds_a: number; odds_b: number; }
export interface HoldOutput {
  implied_a: number;
  implied_b: number;
  total_implied: number;
  hold_pct: number;
  no_vig_prob_a: number;
  no_vig_prob_b: number;
  fair_american_a: number;
  fair_american_b: number;
}

// Risk of Ruin
export interface RuinInput {
  win_prob: number;
  decimal_odds: number;
  bet_size: number;
  bankroll: number;
  num_bets: number;
  num_sims: number;
  seed: number | null;
}
export interface RuinSurvivalPoint { bet: number; survival: number; }
export interface RuinOutput {
  ruin_pct: number;
  median_bankroll: number;
  avg_bankroll: number;
  max_drawdown_avg_pct: number;
  ev_per_bet: number;
  edge_pct: number;
  survival_curve: RuinSurvivalPoint[];
}

// Bayesian
export interface BayesianInput {
  mkt_home_american: number;
  mkt_away_american: number;
  model_prob_home: number;
  market_n: number;
  model_n: number;
}
export interface BayesianOutput {
  mkt_fair_home: number;
  mkt_fair_away: number;
  prior_alpha: number;
  prior_beta: number;
  posterior_alpha: number;
  posterior_beta: number;
  post_prob_home: number;
  post_prob_away: number;
  post_fair_american_home: number;
  post_fair_american_away: number;
}

// Regression
export interface RegressionInput {
  observed: number;
  baseline: number;
  sample_size: number;
  regression_constant: number;
}
export interface RegressionOutput {
  observed: number;
  baseline: number;
  regressed: number;
  weight: number;
  ci_low: number;
  ci_high: number;
}

// Better Line
export type BetType = "spread" | "total";
export type TotalSide = "over" | "under";
export interface BetterLineInput {
  bet_type: BetType;
  side: TotalSide | null;
  std: number;
  line_1: number;
  odds_1: number;
  line_2: number;
  odds_2: number;
}
export interface BetterLineOutput {
  implied_1: number;
  implied_2: number;
  cover_1: number;
  cover_2: number;
  winner: 0 | 1 | 2;
  diff: number;
}

// Alt Line Pricer
export interface AltLineInput {
  main_line: number;
  odds: number;
  std: number;
  bet_type: BetType;
  side: TotalSide | null;
  range: number;
  step: number;
}
export interface AltLadderRow {
  line: number;
  fair_prob: number;
  fair_odds: number;
}
export interface AltLineOutput {
  true_line: number;
  ladder: AltLadderRow[];
}

// Middle Finder
export interface MiddleInput {
  bet_type: BetType;
  std: number;
  line_1: number;
  odds_1: number;
  stake_1: number;
  line_2: number;
  odds_2: number;
  stake_2: number;
}
export interface MiddleOutcome {
  label: string;
  probability: number;
  net_profit: number;
}
export interface MiddleOutput {
  is_middle: boolean;
  gap_size: number;
  gap_prob: number;
  true_center: number;
  ev: number;
  ev_percent: number;
  total_staked: number;
  outcomes: MiddleOutcome[];
}

// Teaser EV
export interface TeaserLegIn { spread: number; odds: number; }
export interface TeaserInput {
  legs: TeaserLegIn[];
  teaser_pts: number;
  teaser_odds: number;
  std: number;
}
export interface TeaserLegOut {
  spread: number;
  teased_spread: number;
  true_line: number;
  cover_prob: number;
  fair_odds: number;
  key_numbers_crossed: number[];
}
export interface TeaserOutput {
  legs: TeaserLegOut[];
  combined_prob: number;
  fair_teaser_odds: number;
  book_teaser_odds: number;
  break_even_prob: number;
  ev_pct: number;
}

// Match Predictors (Poisson / NBinom share output shape)
export interface MatchScoreline { home: number; away: number; prob: number; }
export interface MatchSpread { spread: number; home_covers: number; away_covers: number; }
export interface MatchTotal { line: number; over: number; under: number; }
export interface MatchOutput {
  home_win: number;
  draw: number;
  away_win: number;
  top_scorelines: MatchScoreline[];
  spreads: MatchSpread[];
  totals: MatchTotal[];
}

export interface PoissonMatchInput {
  lambda_home: number;
  lambda_away: number;
  max_score: number;
  allow_draw: boolean;
  spread_lines: number[];
  total_lines: number[];
}

export interface NBinomMatchInput {
  mean_home: number;
  mean_away: number;
  r_home: number;
  r_away: number;
  max_score: number;
  allow_draw: boolean;
  spread_lines: number[];
  total_lines: number[];
}

// Prop Simulator
export type PropDistribution = "poisson" | "nbinom" | "gamma" | "lognormal";
export interface PropSimInput {
  distribution: PropDistribution;
  mu: number;
  var_multiplier: number;
  line: number;
  num_sims: number;
  seed: number | null;
}
export interface PropSimHistBucket { center: number; count: number; }
export interface PropSimOutput {
  samples: number;
  mean: number;
  median: number;
  std_dev: number;
  prob_over: number;
  prob_under: number;
  prob_push: number;
  histogram: PropSimHistBucket[];
}

// Vig Compare
export interface VigBookEntry { name: string; odds_a: number; odds_b: number; }
export interface VigCompareInput { books: VigBookEntry[]; }
export interface VigBookResult {
  name: string;
  implied_a: number;
  implied_b: number;
  total_implied: number;
  vig_pct: number;
  no_vig_prob_a: number;
  no_vig_prob_b: number;
  fair_american_a: number;
  fair_american_b: number;
}
