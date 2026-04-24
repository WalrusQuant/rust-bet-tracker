use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum TagKind {
    Sportsbook,
    League,
    BetType,
    Strategy,
}

impl TagKind {
    pub fn table(self) -> &'static str {
        match self {
            TagKind::Sportsbook => "sportsbooks",
            TagKind::League => "leagues",
            TagKind::BetType => "bet_types",
            TagKind::Strategy => "strategies",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Outcome {
    Pending,
    Won,
    Lost,
    Push,
}

impl Outcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Outcome::Pending => "pending",
            Outcome::Won => "won",
            Outcome::Lost => "lost",
            Outcome::Push => "push",
        }
    }
    pub fn from_str(s: &str) -> Option<Self> {
        Some(match s {
            "pending" => Outcome::Pending,
            "won" => Outcome::Won,
            "lost" => Outcome::Lost,
            "push" => Outcome::Push,
            _ => return None,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bet {
    pub id: i64,
    pub bet_date: String,
    pub sportsbook_id: Option<i64>,
    pub league_id: Option<i64>,
    pub bet_type_id: Option<i64>,
    pub odds: i32,
    pub fair_odds: Option<i32>,
    pub closing_odds: Option<i32>,
    pub stake: f64,
    pub outcome: Outcome,
    pub notes: Option<String>,
    pub created_at: String,
    pub strategy_ids: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewBet {
    pub bet_date: String,
    pub sportsbook_id: Option<i64>,
    pub league_id: Option<i64>,
    pub bet_type_id: Option<i64>,
    pub odds: i32,
    pub fair_odds: Option<i32>,
    pub closing_odds: Option<i32>,
    pub stake: f64,
    pub outcome: Outcome,
    pub notes: Option<String>,
    #[serde(default)]
    pub strategy_ids: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct BetFilter {
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub sportsbook_id: Option<i64>,
    pub league_id: Option<i64>,
    pub bet_type_id: Option<i64>,
    pub outcome: Option<Outcome>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum UnitSizingMethod {
    FixedPercent,
    Kelly,
    FixedAmount,
}

impl UnitSizingMethod {
    pub fn as_str(self) -> &'static str {
        match self {
            UnitSizingMethod::FixedPercent => "fixed_percent",
            UnitSizingMethod::Kelly => "kelly",
            UnitSizingMethod::FixedAmount => "fixed_amount",
        }
    }
    pub fn from_str(s: &str) -> Option<Self> {
        Some(match s {
            "fixed_percent" => UnitSizingMethod::FixedPercent,
            "kelly" => UnitSizingMethod::Kelly,
            "fixed_amount" => UnitSizingMethod::FixedAmount,
            _ => return None,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BankrollSettings {
    pub starting_bankroll: f64,
    pub unit_sizing_method: UnitSizingMethod,
    pub unit_size_value: f64,
    pub kelly_fraction: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum TransactionType {
    Deposit,
    Withdrawal,
}

impl TransactionType {
    pub fn as_str(self) -> &'static str {
        match self {
            TransactionType::Deposit => "deposit",
            TransactionType::Withdrawal => "withdrawal",
        }
    }
    pub fn from_str(s: &str) -> Option<Self> {
        Some(match s {
            "deposit" => TransactionType::Deposit,
            "withdrawal" => TransactionType::Withdrawal,
            _ => return None,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: i64,
    pub tx_date: String,
    pub transaction_type: TransactionType,
    pub amount: f64,
    pub sportsbook_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewTransaction {
    pub tx_date: String,
    pub transaction_type: TransactionType,
    pub amount: f64,
    pub sportsbook_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Stats {
    pub total_bets: i64,
    pub settled_bets: i64,
    pub wins: i64,
    pub losses: i64,
    pub pushes: i64,
    pub win_rate: f64,   // 0..1 of decisive outcomes
    pub total_stake: f64,
    pub total_profit: f64,
    pub roi: f64,        // profit / settled_stake
    pub avg_ev: f64,     // avg EV% across bets with fair_odds
    pub avg_clv: f64,    // avg CLV% across bets with closing_odds

    // Live exposure (pending bets)
    pub pending_count: i64,
    pub pending_stake: f64,
    pub pending_best_case: f64,    // sum of profit if every pending wins
    pub pending_worst_case: f64,   // negative: -sum of stake if every pending loses

    // Bankroll health
    pub current_bankroll: f64,
    pub starting_bankroll: f64,
    pub peak_bankroll: f64,
    pub max_drawdown: f64,         // dollars: peak - lowest-point-after-peak
    pub max_drawdown_pct: f64,     // fraction 0..1

    // Skill signals
    pub expected_profit: f64,      // sum over bets with fair_odds of (stake * EV% / 100)
    pub expected_profit_sample: i64,
    pub clv_beat_rate: f64,        // fraction of bets-with-closing where placed beat close
    pub clv_sample: i64,

    // Rolling 30-day window (ending today)
    pub rolling_profit_30d: f64,
    pub rolling_roi_30d: f64,
    pub rolling_wins_30d: i64,
    pub rolling_losses_30d: i64,
    pub rolling_pushes_30d: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum Dimension {
    Sportsbook,
    League,
    BetType,
    Strategy,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct GroupStats {
    pub id: Option<i64>,
    pub name: String,      // e.g. "DraftKings" or "— untagged —"
    pub n_bets: i64,
    pub settled_bets: i64,
    pub wins: i64,
    pub losses: i64,
    pub pushes: i64,
    pub staked: f64,
    pub settled_stake: f64,
    pub profit: f64,
    pub roi: f64,
    pub avg_clv: f64,
    pub clv_sample: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SportsbookBalance {
    pub id: Option<i64>,     // None for the "Unassigned" bucket
    pub name: String,
    pub balance: f64,         // deposits - withdrawals + settled bet P/L
    pub deposits: f64,
    pub withdrawals: f64,
    pub profit: f64,
    pub n_bets: i64,
    pub pending_stake: f64,   // total stake currently at risk on this book
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BankrollPoint {
    pub bucket: String,      // ISO date label
    pub bankroll: f64,       // running bankroll at end of bucket
    pub peak: f64,           // running max up to this point
    pub drawdown: f64,       // bankroll - peak (≤ 0)
    pub rolling_roi: Option<f64>,  // rolling 30-day ROI up to this bucket (null until enough data)
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Bucket {
    Day,
    Week,
    Month,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitPoint {
    pub bucket: String,  // ISO date prefix
    pub profit: f64,
    pub cumulative: f64,
}
