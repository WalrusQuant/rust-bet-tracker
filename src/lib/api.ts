import { invoke } from "@tauri-apps/api/core";
import type {
  BankrollPoint,
  BankrollSettings,
  Bet,
  BetFilter,
  Bucket,
  Dimension,
  GroupStats,
  NewBet,
  NewTransaction,
  Outcome,
  ProfitPoint,
  SportsbookBalance,
  Stats,
  Tag,
  TagKind,
  Transaction,
} from "./types";

export const api = {
  // bets
  listBets: (filter?: BetFilter) => invoke<Bet[]>("list_bets", { filter: filter ?? null }),
  createBet: (input: NewBet) => invoke<Bet>("create_bet", { input }),
  updateBet: (id: number, input: NewBet) => invoke<Bet>("update_bet", { id, input }),
  deleteBet: (id: number) => invoke<void>("delete_bet", { id }),
  settleBet: (id: number, outcome: Outcome) => invoke<Bet>("settle_bet", { id, outcome }),

  // tags
  listTags: (kind: TagKind) => invoke<Tag[]>("list_tags", { kind }),
  createTag: (kind: TagKind, name: string) => invoke<Tag>("create_tag", { kind, name }),
  deleteTag: (kind: TagKind, id: number) => invoke<void>("delete_tag", { kind, id }),

  // bankroll + transactions
  getBankrollSettings: () => invoke<BankrollSettings>("get_bankroll_settings"),
  updateBankrollSettings: (input: BankrollSettings) =>
    invoke<BankrollSettings>("update_bankroll_settings", { input }),
  currentBankroll: () => invoke<number>("current_bankroll"),
  recommendedStake: (odds: number, fair_odds: number | null) =>
    invoke<number>("recommended_stake", { odds, fairOdds: fair_odds }),
  listTransactions: () => invoke<Transaction[]>("list_transactions"),
  createTransaction: (input: NewTransaction) =>
    invoke<Transaction>("create_transaction", { input }),
  updateTransaction: (id: number, input: NewTransaction) =>
    invoke<Transaction>("update_transaction", { id, input }),
  deleteTransaction: (id: number) => invoke<void>("delete_transaction", { id }),
  sportsbookBalances: () => invoke<SportsbookBalance[]>("sportsbook_balances"),

  // analytics
  stats: (filter?: BetFilter) => invoke<Stats>("stats", { filter: filter ?? null }),
  statsBy: (dimension: Dimension) => invoke<GroupStats[]>("stats_by", { dimension }),
  profitOverTime: (bucket: Bucket) => invoke<ProfitPoint[]>("profit_over_time", { bucket }),
  bankrollSeries: (bucket: Bucket) => invoke<BankrollPoint[]>("bankroll_series", { bucket }),

  // admin
  resetDatabase: () => invoke<void>("reset_database"),
};
