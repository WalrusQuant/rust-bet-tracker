// Shared types for the WalrusQuant betting toolkit

export interface Sportsbook {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface League {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface BetType {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface Strategy {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface BetStrategy {
  bet_id: string;
  strategy_id: string;
  strategies: Strategy;
}

export interface Bet {
  id: string;
  user_id: string;
  bet_date: string;
  sportsbook_id: string | null;
  league_id: string | null;
  bet_type_id: string | null;
  odds: number;
  fair_odds: number | null;
  closing_odds: number | null;
  stake: number;
  outcome: BetOutcome;
  notes: string | null;
  created_at?: string;
  // Joined relations
  sportsbooks?: { name: string } | null;
  leagues?: { name: string } | null;
  bet_types?: { name: string } | null;
  bet_strategies?: BetStrategy[];
}

export type BetOutcome = 'pending' | 'won' | 'lost' | 'push';

export interface BankrollSettings {
  id?: string;
  user_id?: string;
  starting_bankroll: number;
  unit_sizing_method: UnitSizingMethod;
  unit_size_value: number;
  kelly_fraction: KellyFraction;
  created_at?: string;
  updated_at?: string;
}

export type UnitSizingMethod = 'fixed_percent' | 'kelly' | 'fixed_amount';
export type KellyFraction = 'full' | 'half' | 'quarter';

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  transaction_date: string;
  notes: string | null;
  created_at?: string;
}

export interface BetFormData {
  sportsbook_id: string;
  league_id: string;
  bet_type_id: string;
  odds: string;
  fair_odds: string;
  closing_odds: string;
  stake: string;
  outcome: BetOutcome;
  notes: string;
  strategy_id: string;
}

export interface BetStats {
  totalBets: number;
  winRate: string;
  totalProfit: number;
  roi: string;
  avgEV: string;
  avgCLV: string;
}

export interface FilterState {
  sportsbook: string;
  league: string;
  betType: string;
  outcome: string;
}
