// Types mirror the Rust side exactly (snake_case field names — we do not
// rely on Tauri's camelCase conversion, which only applies to top-level
// command argument names, not struct contents).

export type TagKind = "sportsbook" | "league" | "bet_type" | "strategy";
export type Outcome = "pending" | "won" | "lost" | "push";
export type UnitSizingMethod = "fixed_percent" | "kelly" | "fixed_amount";
export type TransactionType = "deposit" | "withdrawal";
export type Bucket = "day" | "week" | "month";

export interface Tag {
  id: number;
  name: string;
}

export interface Bet {
  id: number;
  bet_date: string;
  sportsbook_id: number | null;
  league_id: number | null;
  bet_type_id: number | null;
  odds: number;
  fair_odds: number | null;
  closing_odds: number | null;
  stake: number;
  outcome: Outcome;
  notes: string | null;
  created_at: string;
  strategy_ids: number[];
}

export interface NewBet {
  bet_date: string;
  sportsbook_id: number | null;
  league_id: number | null;
  bet_type_id: number | null;
  odds: number;
  fair_odds: number | null;
  closing_odds: number | null;
  stake: number;
  outcome: Outcome;
  notes: string | null;
  strategy_ids: number[];
}

export interface BetFilter {
  from_date?: string | null;
  to_date?: string | null;
  sportsbook_id?: number | null;
  league_id?: number | null;
  bet_type_id?: number | null;
  outcome?: Outcome | null;
}

export interface BankrollSettings {
  starting_bankroll: number;
  unit_sizing_method: UnitSizingMethod;
  unit_size_value: number;
  kelly_fraction: number;
}

export interface Transaction {
  id: number;
  tx_date: string;
  transaction_type: TransactionType;
  amount: number;
  sportsbook_id: number | null;
  notes: string | null;
}

export interface NewTransaction {
  tx_date: string;
  transaction_type: TransactionType;
  amount: number;
  sportsbook_id: number | null;
  notes: string | null;
}

export interface Stats {
  total_bets: number;
  settled_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  win_rate: number;
  total_stake: number;
  total_profit: number;
  roi: number;
  avg_ev: number;
  avg_clv: number;

  pending_count: number;
  pending_stake: number;
  pending_best_case: number;
  pending_worst_case: number;

  current_bankroll: number;
  starting_bankroll: number;
  peak_bankroll: number;
  max_drawdown: number;
  max_drawdown_pct: number;

  expected_profit: number;
  expected_profit_sample: number;
  clv_beat_rate: number;
  clv_sample: number;

  rolling_profit_30d: number;
  rolling_roi_30d: number;
  rolling_wins_30d: number;
  rolling_losses_30d: number;
  rolling_pushes_30d: number;
}

export type Dimension = "sportsbook" | "league" | "bet_type" | "strategy";

export interface GroupStats {
  id: number | null;
  name: string;
  n_bets: number;
  settled_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  staked: number;
  settled_stake: number;
  profit: number;
  roi: number;
  avg_clv: number;
  clv_sample: number;
}

export interface SportsbookBalance {
  id: number | null;
  name: string;
  balance: number;
  deposits: number;
  withdrawals: number;
  profit: number;
  n_bets: number;
  pending_stake: number;
}

export interface BankrollPoint {
  bucket: string;
  bankroll: number;
  peak: number;
  drawdown: number;
  rolling_roi: number | null;
}

export interface ProfitPoint {
  bucket: string;
  profit: number;
  cumulative: number;
}
