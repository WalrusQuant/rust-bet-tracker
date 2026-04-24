//! Tauri IPC handlers for the calculator pages. One command per calculator,
//! each taking a typed input struct and returning a typed output struct.
//! Math lives in `crate::calc::*`; this layer just shapes IO.

use crate::calc::{
    self, altline, arbitrage, bayesian, bestline, devig, hedge, hold, middle, nbinom, parlay,
    poisson, prop_sim, regression, risk_of_ruin, teaser_ev, vig_comparison,
};
use crate::error::AppResult;
use serde::{Deserialize, Serialize};

// --------------------------------------------------------------------
// Odds Converter
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OddsFormat {
    American,
    Decimal,
    Fractional,
}

#[derive(Debug, Deserialize)]
pub struct OddsConvertInput {
    pub value: String,
    pub format: OddsFormat,
}

#[derive(Debug, Serialize, Default)]
pub struct OddsConvertOutput {
    pub american: Option<String>,
    pub decimal: Option<f64>,
    pub fractional: Option<String>,
    pub implied_prob: Option<f64>, // 0..1
}

fn parse_decimal(value: &str, format: &OddsFormat) -> Option<f64> {
    let v = value.trim();
    if v.is_empty() {
        return None;
    }
    match format {
        OddsFormat::Fractional => {
            if let Some((num, den)) = v.split_once('/') {
                let n: f64 = num.trim().parse().ok()?;
                let d: f64 = den.trim().parse().ok()?;
                if d == 0.0 {
                    return None;
                }
                Some(1.0 + n / d)
            } else {
                None
            }
        }
        OddsFormat::American => {
            let n: f64 = v.parse().ok()?;
            if n > 0.0 {
                Some(1.0 + n / 100.0)
            } else if n < 0.0 {
                Some(1.0 + 100.0 / n.abs())
            } else {
                None
            }
        }
        OddsFormat::Decimal => {
            let n: f64 = v.parse().ok()?;
            if n > 1.0 {
                Some(n)
            } else {
                None
            }
        }
    }
}

fn decimal_to_fractional_string(decimal: f64) -> String {
    let profit = decimal - 1.0;
    // Small curated set of common fractions
    let fractions: &[(i32, i32)] = &[
        (1, 10), (1, 8), (1, 6), (1, 5), (1, 4), (1, 3), (2, 5), (1, 2),
        (4, 7), (4, 6), (4, 5), (1, 1), (11, 10), (6, 5), (5, 4), (11, 8),
        (6, 4), (13, 8), (7, 4), (15, 8), (2, 1), (9, 4), (5, 2), (11, 4),
        (3, 1), (7, 2), (4, 1), (9, 2), (5, 1), (11, 2), (6, 1), (13, 2),
        (7, 1), (15, 2), (8, 1), (9, 1), (10, 1), (12, 1), (15, 1), (20, 1),
        (25, 1), (33, 1), (50, 1), (100, 1),
    ];
    let mut closest = fractions[0];
    let mut min_diff = (profit - closest.0 as f64 / closest.1 as f64).abs();
    for &f in fractions {
        let diff = (profit - f.0 as f64 / f.1 as f64).abs();
        if diff < min_diff {
            min_diff = diff;
            closest = f;
        }
    }
    if min_diff < 0.01 {
        format!("{}/{}", closest.0, closest.1)
    } else {
        let num = (profit * 100.0).round() as i32;
        let den = 100_i32;
        let g = gcd(num.abs(), den);
        format!("{}/{}", num / g, den / g)
    }
}

fn gcd(a: i32, b: i32) -> i32 {
    if b == 0 { a } else { gcd(b, a % b) }
}

#[tauri::command]
pub fn calc_odds_convert(input: OddsConvertInput) -> AppResult<OddsConvertOutput> {
    let Some(decimal) = parse_decimal(&input.value, &input.format) else {
        return Ok(OddsConvertOutput::default());
    };
    let american = if decimal <= 1.0 {
        None
    } else if decimal >= 2.0 {
        Some(format!("+{}", ((decimal - 1.0) * 100.0).round() as i32))
    } else {
        Some(format!("{}", (-100.0 / (decimal - 1.0)).round() as i32))
    };
    Ok(OddsConvertOutput {
        american,
        decimal: Some(decimal),
        fractional: Some(decimal_to_fractional_string(decimal)),
        implied_prob: if decimal > 1.0 { Some(1.0 / decimal) } else { None },
    })
}

// --------------------------------------------------------------------
// Sharp Implied — two-way devig + optional spread/total breakdown
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct SharpImpliedInput {
    pub home_american: i32,
    pub away_american: i32,
    pub spread: Option<f64>,    // negative = home favored
    pub total: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct SharpImpliedOutput {
    pub home_implied: f64,
    pub away_implied: f64,
    pub margin_pct: f64,
    pub home_fair_prob: f64,
    pub away_fair_prob: f64,
    pub home_fair_american: i32,
    pub away_fair_american: i32,
    pub home_score_projection: Option<f64>,
    pub away_score_projection: Option<f64>,
}

#[tauri::command]
pub fn calc_sharp_implied(input: SharpImpliedInput) -> AppResult<SharpImpliedOutput> {
    let home_implied = calc::american_to_implied_prob(input.home_american);
    let away_implied = calc::american_to_implied_prob(input.away_american);
    let fair = devig::devig_mpto(&[home_implied, away_implied])
        .ok_or_else(|| "could not devig".to_string())?;
    let (hp, ap) = (fair[0], fair[1]);

    let (home_proj, away_proj) = match (input.spread, input.total) {
        (Some(spread), Some(total)) if total > 0.0 => {
            // Home score = (total - spread) / 2 where negative spread = home favored
            // So if home is favored by 3 (spread=-3), home_score = (total - (-3))/2 = (total+3)/2
            let home = (total - spread) / 2.0;
            let away = (total + spread) / 2.0;
            (Some(home), Some(away))
        }
        _ => (None, None),
    };

    Ok(SharpImpliedOutput {
        home_implied,
        away_implied,
        margin_pct: (home_implied + away_implied - 1.0) * 100.0,
        home_fair_prob: hp,
        away_fair_prob: ap,
        home_fair_american: calc::implied_prob_to_american(hp),
        away_fair_american: calc::implied_prob_to_american(ap),
        home_score_projection: home_proj,
        away_score_projection: away_proj,
    })
}

// --------------------------------------------------------------------
// Devig — run all 5 methods
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct DevigInput {
    pub implied_probs: Vec<f64>, // 0..1 each, typically sums > 1
    pub bet_implied: Option<f64>, // your bet's implied prob for EV comparison
}

#[derive(Debug, Serialize)]
pub struct DevigMethodResult {
    pub method: String,
    pub name: String,
    pub fair_probs: Option<Vec<f64>>,
    pub ev_percent: Option<f64>, // EV vs bet_implied, if provided
}

#[derive(Debug, Serialize)]
pub struct DevigOutput {
    pub methods: Vec<DevigMethodResult>,
    pub margin_pct: f64,
}

#[tauri::command]
pub fn calc_devig(input: DevigInput) -> AppResult<DevigOutput> {
    let sum: f64 = input.implied_probs.iter().sum();
    let margin_pct = (sum - 1.0) * 100.0;

    let methods_def: &[(&str, &str, fn(&[f64]) -> Option<Vec<f64>>)] = &[
        ("EM", "Equal Margin", devig::devig_em),
        ("MPTO", "Proportional", devig::devig_mpto),
        ("SHIN", "Shin", devig::devig_shin),
        ("OR", "Odds Ratio", devig::devig_or),
        ("LOG", "Logarithmic", devig::devig_log),
    ];

    let mut methods = Vec::with_capacity(5);
    for (k, n, f) in methods_def {
        let fair = f(&input.implied_probs);
        let ev = match (&fair, input.bet_implied) {
            (Some(fp), Some(bi)) if bi > 0.0 && !fp.is_empty() => {
                // EV against first outcome's fair prob
                Some((fp[0] / bi - 1.0) * 100.0)
            }
            _ => None,
        };
        methods.push(DevigMethodResult {
            method: (*k).to_string(),
            name: (*n).to_string(),
            fair_probs: fair,
            ev_percent: ev,
        });
    }

    Ok(DevigOutput { methods, margin_pct })
}

// --------------------------------------------------------------------
// Expected Value
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct EVInput {
    pub your_odds: i32,     // American
    pub fair_odds: i32,     // American
    pub stake: f64,
}

#[derive(Debug, Serialize)]
pub struct EVOutput {
    pub ev_dollars: f64,
    pub ev_percent: f64,
    pub edge_percent: f64,    // (fair_prob - your_implied) / your_implied * 100
    pub your_implied: f64,
    pub fair_prob: f64,
    pub break_even_win_rate: f64,
}

#[tauri::command]
pub fn calc_ev(input: EVInput) -> AppResult<EVOutput> {
    let your_implied = calc::american_to_implied_prob(input.your_odds);
    let fair_prob = calc::american_to_implied_prob(input.fair_odds);
    let your_decimal = calc::american_to_decimal(input.your_odds);
    let ev_dollars = input.stake * (fair_prob * your_decimal - 1.0);
    let ev_percent = (fair_prob * your_decimal - 1.0) * 100.0;
    let edge = if your_implied > 0.0 {
        (fair_prob - your_implied) / your_implied * 100.0
    } else { 0.0 };
    let break_even = if your_decimal > 1.0 { 1.0 / your_decimal } else { 0.0 };
    Ok(EVOutput {
        ev_dollars,
        ev_percent,
        edge_percent: edge,
        your_implied,
        fair_prob,
        break_even_win_rate: break_even,
    })
}

// --------------------------------------------------------------------
// Kelly Criterion
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct KellyInput {
    pub win_probability: f64,  // 0..1
    pub decimal_odds: f64,
    pub bankroll: f64,
    pub fraction: f64, // 1.0 = full Kelly
}

#[derive(Debug, Serialize)]
pub struct KellyOutput {
    pub kelly_fraction: f64,       // raw Kelly f = (bp - q) / b
    pub recommended_fraction: f64, // fraction * kelly_fraction, clamped ≥ 0
    pub recommended_stake: f64,
    pub edge_percent: f64,
}

#[tauri::command]
pub fn calc_kelly(input: KellyInput) -> AppResult<KellyOutput> {
    let b = input.decimal_odds - 1.0;
    if b <= 0.0 || input.win_probability <= 0.0 || input.win_probability >= 1.0 {
        return Ok(KellyOutput {
            kelly_fraction: 0.0,
            recommended_fraction: 0.0,
            recommended_stake: 0.0,
            edge_percent: 0.0,
        });
    }
    let p = input.win_probability;
    let q = 1.0 - p;
    let raw = (b * p - q) / b;
    let rec = (raw * input.fraction).max(0.0);
    let stake = (input.bankroll.max(0.0)) * rec;
    let implied = 1.0 / input.decimal_odds;
    let edge = (p - implied) / implied * 100.0;
    Ok(KellyOutput {
        kelly_fraction: raw,
        recommended_fraction: rec,
        recommended_stake: stake,
        edge_percent: edge,
    })
}

// --------------------------------------------------------------------
// Parlay
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct ParlayInput {
    pub legs: Vec<i32>, // American odds per leg
    pub stake: f64,
}

#[derive(Debug, Serialize)]
pub struct ParlayOutput {
    pub combined_decimal: f64,
    pub combined_american: i32,
    pub combined_implied_prob: f64,
    pub stake: f64,
    pub profit: f64,
    pub payout: f64,
}

#[tauri::command]
pub fn calc_parlay(input: ParlayInput) -> AppResult<ParlayOutput> {
    let legs: Vec<parlay::ParlayLeg> = input.legs.iter().map(|&o| parlay::ParlayLeg { odds: o }).collect();
    match parlay::calculate_parlay(&legs, input.stake) {
        Some(r) => Ok(ParlayOutput {
            combined_decimal: r.combined_decimal,
            combined_american: r.combined_american,
            combined_implied_prob: r.combined_implied_prob,
            stake: r.stake,
            profit: r.profit,
            payout: r.payout,
        }),
        None => Ok(ParlayOutput {
            combined_decimal: 0.0,
            combined_american: 0,
            combined_implied_prob: 0.0,
            stake: input.stake,
            profit: 0.0,
            payout: 0.0,
        }),
    }
}

// --------------------------------------------------------------------
// Arbitrage
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct ArbitrageInput {
    pub legs: Vec<i32>,
    pub total_stake: f64,
}

#[derive(Debug, Serialize)]
pub struct ArbSplitOut {
    pub stake: f64,
    pub payout: f64,
}

#[derive(Debug, Serialize)]
pub struct ArbitrageOutput {
    pub total_stake: f64,
    pub total_implied: f64,
    pub is_arb: bool,
    pub arb_percent: f64,
    pub guaranteed_profit: f64,
    pub splits: Vec<ArbSplitOut>,
}

#[tauri::command]
pub fn calc_arbitrage(input: ArbitrageInput) -> AppResult<ArbitrageOutput> {
    let legs: Vec<arbitrage::ArbLeg> = input.legs.iter().map(|&o| arbitrage::ArbLeg { odds: o }).collect();
    let r = arbitrage::calculate_arbitrage(&legs, input.total_stake)
        .ok_or_else(|| "invalid arbitrage inputs".to_string())?;
    Ok(ArbitrageOutput {
        total_stake: r.total_stake,
        total_implied: r.total_implied,
        is_arb: r.is_arb,
        arb_percent: r.arb_percent,
        guaranteed_profit: r.guaranteed_profit,
        splits: r
            .splits
            .into_iter()
            .map(|s| ArbSplitOut { stake: s.stake, payout: s.payout })
            .collect(),
    })
}

// --------------------------------------------------------------------
// Hedge
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct HedgeInput {
    pub original_stake: f64,
    pub original_odds: i32,
    pub hedge_odds: i32,
}

#[derive(Debug, Serialize)]
pub struct HedgeOutput {
    pub hedge_stake: f64,
    pub total_stake: f64,
    pub payout_if_original_wins: f64,
    pub payout_if_hedge_wins: f64,
    pub guaranteed_profit: f64,
}

#[tauri::command]
pub fn calc_hedge(input: HedgeInput) -> AppResult<HedgeOutput> {
    let r = hedge::calculate_hedge(input.original_stake, input.original_odds, input.hedge_odds)
        .ok_or_else(|| "invalid hedge inputs".to_string())?;
    Ok(HedgeOutput {
        hedge_stake: r.hedge_stake,
        total_stake: r.total_stake,
        payout_if_original_wins: r.payout_if_original_wins,
        payout_if_hedge_wins: r.payout_if_hedge_wins,
        guaranteed_profit: r.guaranteed_profit,
    })
}

// --------------------------------------------------------------------
// CLV
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct ClvInput {
    pub placed_odds: i32,
    pub closing_odds: i32,
    pub stake: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ClvOutput {
    pub clv_percent: f64,
    pub clv_dollars: Option<f64>,
    pub placed_decimal: f64,
    pub closing_decimal: f64,
    pub placed_implied: f64,
    pub closing_implied: f64,
}

#[tauri::command]
pub fn calc_clv(input: ClvInput) -> AppResult<ClvOutput> {
    let placed_d = calc::american_to_decimal(input.placed_odds);
    let closing_d = calc::american_to_decimal(input.closing_odds);
    let clv_pct = calc::clv_percent(input.placed_odds, input.closing_odds);
    let clv_dollars = input.stake.map(|s| s * clv_pct / 100.0);
    Ok(ClvOutput {
        clv_percent: clv_pct,
        clv_dollars,
        placed_decimal: placed_d,
        closing_decimal: closing_d,
        placed_implied: calc::american_to_implied_prob(input.placed_odds),
        closing_implied: calc::american_to_implied_prob(input.closing_odds),
    })
}

// --------------------------------------------------------------------
// Hold
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct HoldInput {
    pub odds_a: i32,
    pub odds_b: i32,
}

#[derive(Debug, Serialize)]
pub struct HoldOutput {
    pub implied_a: f64,
    pub implied_b: f64,
    pub total_implied: f64,
    pub hold_pct: f64,
    pub no_vig_prob_a: f64,
    pub no_vig_prob_b: f64,
    pub fair_american_a: i32,
    pub fair_american_b: i32,
}

#[tauri::command]
pub fn calc_hold(input: HoldInput) -> AppResult<HoldOutput> {
    let ia = calc::american_to_implied_prob(input.odds_a);
    let ib = calc::american_to_implied_prob(input.odds_b);
    let h = hold::calculate_hold(ia, ib).ok_or_else(|| "invalid hold inputs".to_string())?;
    Ok(HoldOutput {
        implied_a: h.implied_a,
        implied_b: h.implied_b,
        total_implied: h.total_implied,
        hold_pct: h.hold_pct,
        no_vig_prob_a: h.no_vig_prob_a,
        no_vig_prob_b: h.no_vig_prob_b,
        fair_american_a: calc::implied_prob_to_american(h.no_vig_prob_a),
        fair_american_b: calc::implied_prob_to_american(h.no_vig_prob_b),
    })
}

// --------------------------------------------------------------------
// Vig Comparison
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct VigBookEntry {
    pub name: String,
    pub odds_a: i32,
    pub odds_b: i32,
}

#[derive(Debug, Deserialize)]
pub struct VigCompareInput {
    pub books: Vec<VigBookEntry>,
}

#[derive(Debug, Serialize)]
pub struct VigBookResult {
    pub name: String,
    pub implied_a: f64,
    pub implied_b: f64,
    pub total_implied: f64,
    pub vig_pct: f64,
    pub no_vig_prob_a: f64,
    pub no_vig_prob_b: f64,
    pub fair_american_a: i32,
    pub fair_american_b: i32,
}

// --------------------------------------------------------------------
// Risk of Ruin (Monte Carlo)
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct RuinInput {
    pub win_prob: f64,
    pub decimal_odds: f64,
    pub bet_size: f64,
    pub bankroll: f64,
    pub num_bets: usize,
    pub num_sims: usize,
    pub seed: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct RuinSurvivalPoint {
    pub bet: usize,
    pub survival: f64,
}

#[derive(Debug, Serialize)]
pub struct RuinOutput {
    pub ruin_pct: f64,
    pub median_bankroll: f64,
    pub avg_bankroll: f64,
    pub max_drawdown_avg_pct: f64,
    pub ev_per_bet: f64,
    pub edge_pct: f64,
    pub survival_curve: Vec<RuinSurvivalPoint>,
}

#[tauri::command]
pub fn calc_risk_of_ruin(input: RuinInput) -> AppResult<RuinOutput> {
    let r = risk_of_ruin::simulate_ruin(
        risk_of_ruin::RuinInput {
            win_prob: input.win_prob,
            decimal_odds: input.decimal_odds,
            bet_size: input.bet_size,
            bankroll: input.bankroll,
            num_bets: input.num_bets,
            num_sims: input.num_sims,
        },
        input.seed,
    );
    Ok(RuinOutput {
        ruin_pct: r.ruin_pct,
        median_bankroll: r.median_bankroll,
        avg_bankroll: r.avg_bankroll,
        max_drawdown_avg_pct: r.max_drawdown_avg_pct,
        ev_per_bet: r.ev_per_bet,
        edge_pct: r.edge_pct,
        survival_curve: r
            .survival_curve
            .into_iter()
            .map(|p| RuinSurvivalPoint { bet: p.bet, survival: p.survival })
            .collect(),
    })
}

// --------------------------------------------------------------------
// Bayesian
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct BayesianInput {
    pub mkt_home_american: i32,
    pub mkt_away_american: i32,
    pub model_prob_home: f64, // 0..1
    pub market_n: f64,        // pseudo-count strength of prior
    pub model_n: f64,         // pseudo-count strength of evidence
}

#[derive(Debug, Serialize)]
pub struct BayesianOutput {
    pub mkt_fair_home: f64,
    pub mkt_fair_away: f64,
    pub prior_alpha: f64,
    pub prior_beta: f64,
    pub posterior_alpha: f64,
    pub posterior_beta: f64,
    pub post_prob_home: f64,
    pub post_prob_away: f64,
    pub post_fair_american_home: i32,
    pub post_fair_american_away: i32,
}

#[tauri::command]
pub fn calc_bayesian(input: BayesianInput) -> AppResult<BayesianOutput> {
    // Devig the market moneyline first (MPTO)
    let h_imp = calc::american_to_implied_prob(input.mkt_home_american);
    let a_imp = calc::american_to_implied_prob(input.mkt_away_american);
    let fair = devig::devig_mpto(&[h_imp, a_imp])
        .ok_or_else(|| "could not devig market moneyline".to_string())?;
    let mkt_fair_home = fair[0];

    let r = bayesian::bayesian_prob_update(
        mkt_fair_home,
        input.model_prob_home,
        input.market_n,
        input.model_n,
    );

    Ok(BayesianOutput {
        mkt_fair_home: r.mkt_fair_a,
        mkt_fair_away: r.mkt_fair_b,
        prior_alpha: r.prior_alpha,
        prior_beta: r.prior_beta,
        posterior_alpha: r.posterior_alpha,
        posterior_beta: r.posterior_beta,
        post_prob_home: r.post_prob_a,
        post_prob_away: r.post_prob_b,
        post_fair_american_home: calc::implied_prob_to_american(r.post_prob_a),
        post_fair_american_away: calc::implied_prob_to_american(r.post_prob_b),
    })
}

// --------------------------------------------------------------------
// Regression to the mean
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct RegressionInput {
    pub observed: f64,
    pub baseline: f64,
    pub sample_size: f64,
    pub regression_constant: f64,
}

#[derive(Debug, Serialize)]
pub struct RegressionOutput {
    pub observed: f64,
    pub baseline: f64,
    pub regressed: f64,
    pub weight: f64,
    pub ci_low: f64,
    pub ci_high: f64,
}

#[tauri::command]
pub fn calc_regression(input: RegressionInput) -> AppResult<RegressionOutput> {
    let r = regression::calculate(
        input.observed,
        input.baseline,
        input.sample_size,
        input.regression_constant,
    );
    Ok(RegressionOutput {
        observed: r.observed,
        baseline: r.baseline,
        regressed: r.regressed,
        weight: r.weight,
        ci_low: r.ci_low,
        ci_high: r.ci_high,
    })
}

// --------------------------------------------------------------------
// Better Line (CDF analysis)
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct BetterLineInput {
    pub bet_type: String,       // "spread" | "total"
    pub side: Option<String>,   // "over" | "under" (totals only)
    pub std: f64,
    pub line_1: f64,
    pub odds_1: i32,
    pub line_2: f64,
    pub odds_2: i32,
}

#[derive(Debug, Serialize)]
pub struct BetterLineOutput {
    pub implied_1: f64,
    pub implied_2: f64,
    pub cover_1: f64,
    pub cover_2: f64,
    pub winner: u8,   // 0 = tie, 1 = line_1, 2 = line_2
    pub diff: f64,
}

fn parse_bet_type(s: &str) -> Option<bestline::BetType> {
    match s {
        "spread" => Some(bestline::BetType::Spread),
        "total" => Some(bestline::BetType::Total),
        _ => None,
    }
}
fn parse_side(s: Option<&str>) -> Option<bestline::TotalSide> {
    s.and_then(|v| match v {
        "over" => Some(bestline::TotalSide::Over),
        "under" => Some(bestline::TotalSide::Under),
        _ => None,
    })
}

#[tauri::command]
pub fn calc_better_line(input: BetterLineInput) -> AppResult<BetterLineOutput> {
    let bt = parse_bet_type(&input.bet_type).ok_or_else(|| "invalid bet type".to_string())?;
    let side = parse_side(input.side.as_deref());
    let r = bestline::compare_best_line(
        input.line_1,
        input.odds_1,
        input.line_2,
        input.odds_2,
        input.std,
        bt,
        side,
    )
    .ok_or_else(|| "could not compute".to_string())?;
    Ok(BetterLineOutput {
        implied_1: r.implied_1,
        implied_2: r.implied_2,
        cover_1: r.cover_1,
        cover_2: r.cover_2,
        winner: r.winner,
        diff: r.diff,
    })
}

// --------------------------------------------------------------------
// Alt Line Pricer
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct AltLineInput {
    pub main_line: f64,
    pub odds: i32,
    pub std: f64,
    pub bet_type: String,      // "spread" | "total"
    pub side: Option<String>,  // "over" | "under"
    pub range: f64,
    pub step: f64,
}

#[derive(Debug, Serialize)]
pub struct AltLadderRow {
    pub line: f64,
    pub fair_prob: f64,
    pub fair_odds: i32,
}

#[derive(Debug, Serialize)]
pub struct AltLineOutput {
    pub true_line: f64,
    pub ladder: Vec<AltLadderRow>,
}

#[tauri::command]
pub fn calc_alt_line(input: AltLineInput) -> AppResult<AltLineOutput> {
    let bt = parse_bet_type(&input.bet_type).ok_or_else(|| "invalid bet type".to_string())?;
    let side = parse_side(input.side.as_deref());
    let r = altline::generate_line_ladder(
        input.main_line,
        input.odds,
        input.std,
        bt,
        side,
        input.range,
        input.step,
    )
    .ok_or_else(|| "could not generate ladder".to_string())?;
    Ok(AltLineOutput {
        true_line: r.true_line,
        ladder: r
            .ladder
            .into_iter()
            .map(|row| AltLadderRow {
                line: row.line,
                fair_prob: row.fair_prob,
                fair_odds: row.fair_odds,
            })
            .collect(),
    })
}

// --------------------------------------------------------------------
// Middle Finder
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct MiddleInput {
    pub bet_type: String, // "spread" | "total"
    pub std: f64,
    pub line_1: f64,
    pub odds_1: i32,
    pub stake_1: f64,
    pub line_2: f64,
    pub odds_2: i32,
    pub stake_2: f64,
}

#[derive(Debug, Serialize)]
pub struct MiddleOutcomeOut {
    pub label: String,
    pub probability: f64,
    pub net_profit: f64,
}

#[derive(Debug, Serialize)]
pub struct MiddleOutput {
    pub is_middle: bool,
    pub gap_size: f64,
    pub gap_prob: f64,
    pub true_center: f64,
    pub ev: f64,
    pub ev_percent: f64,
    pub total_staked: f64,
    pub outcomes: Vec<MiddleOutcomeOut>,
}

#[tauri::command]
pub fn calc_middle(input: MiddleInput) -> AppResult<MiddleOutput> {
    let bt = parse_bet_type(&input.bet_type).ok_or_else(|| "invalid bet type".to_string())?;
    let r = middle::calculate_middle(
        input.line_1,
        input.odds_1,
        input.stake_1,
        input.line_2,
        input.odds_2,
        input.stake_2,
        input.std,
        bt,
    )
    .ok_or_else(|| "invalid middle inputs".to_string())?;
    Ok(MiddleOutput {
        is_middle: r.is_middle,
        gap_size: r.gap_size,
        gap_prob: r.gap_prob,
        true_center: r.true_center,
        ev: r.ev,
        ev_percent: r.ev_percent,
        total_staked: r.total_staked,
        outcomes: r
            .outcomes
            .into_iter()
            .map(|o| MiddleOutcomeOut {
                label: o.label,
                probability: o.probability,
                net_profit: o.net_profit,
            })
            .collect(),
    })
}

// --------------------------------------------------------------------
// Teaser EV
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct TeaserLegIn {
    pub spread: f64,
    pub odds: i32,
}

#[derive(Debug, Deserialize)]
pub struct TeaserInput {
    pub legs: Vec<TeaserLegIn>,
    pub teaser_pts: f64,
    pub teaser_odds: i32,
    pub std: f64,
}

#[derive(Debug, Serialize)]
pub struct TeaserLegOut {
    pub spread: f64,
    pub teased_spread: f64,
    pub true_line: f64,
    pub cover_prob: f64,
    pub fair_odds: i32,
    pub key_numbers_crossed: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct TeaserOutput {
    pub legs: Vec<TeaserLegOut>,
    pub combined_prob: f64,
    pub fair_teaser_odds: i32,
    pub book_teaser_odds: i32,
    pub break_even_prob: f64,
    pub ev_pct: f64,
}

#[tauri::command]
pub fn calc_teaser(input: TeaserInput) -> AppResult<TeaserOutput> {
    let legs: Vec<teaser_ev::TeaserLegInput> = input
        .legs
        .into_iter()
        .map(|l| teaser_ev::TeaserLegInput { spread: l.spread, odds: l.odds })
        .collect();
    let r = teaser_ev::analyze_teaser(&legs, input.teaser_pts, input.teaser_odds, input.std)
        .ok_or_else(|| "invalid teaser inputs".to_string())?;
    Ok(TeaserOutput {
        legs: r
            .legs
            .into_iter()
            .map(|l| TeaserLegOut {
                spread: l.spread,
                teased_spread: l.teased_spread,
                true_line: l.true_line,
                cover_prob: l.cover_prob,
                fair_odds: l.fair_odds,
                key_numbers_crossed: l.key_numbers_crossed,
            })
            .collect(),
        combined_prob: r.combined_prob,
        fair_teaser_odds: r.fair_teaser_odds,
        book_teaser_odds: r.book_teaser_odds,
        break_even_prob: r.break_even_prob,
        ev_pct: r.ev_pct,
    })
}

// --------------------------------------------------------------------
// Poisson Match
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PoissonMatchInput {
    pub lambda_home: f64,
    pub lambda_away: f64,
    pub max_score: usize,
    pub allow_draw: bool,
    pub spread_lines: Vec<f64>,
    pub total_lines: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct MatchScoreline {
    pub home: usize,
    pub away: usize,
    pub prob: f64,
}

#[derive(Debug, Serialize)]
pub struct MatchSpread {
    pub spread: f64,
    pub home_covers: f64,
    pub away_covers: f64,
}

#[derive(Debug, Serialize)]
pub struct MatchTotal {
    pub line: f64,
    pub over: f64,
    pub under: f64,
}

#[derive(Debug, Serialize)]
pub struct PoissonMatchOutput {
    pub home_win: f64,
    pub draw: f64,
    pub away_win: f64,
    pub top_scorelines: Vec<MatchScoreline>,
    pub spreads: Vec<MatchSpread>,
    pub totals: Vec<MatchTotal>,
}

#[tauri::command]
pub fn calc_poisson_match(input: PoissonMatchInput) -> AppResult<PoissonMatchOutput> {
    let m = poisson::build_score_matrix(input.lambda_home, input.lambda_away, input.max_score);
    let mp = poisson::derive_market_probs(&m, &input.spread_lines, &input.total_lines, input.allow_draw);
    Ok(PoissonMatchOutput {
        home_win: mp.home_win,
        draw: mp.draw,
        away_win: mp.away_win,
        top_scorelines: mp.top_scorelines.into_iter().map(|s| MatchScoreline {
            home: s.home, away: s.away, prob: s.prob,
        }).collect(),
        spreads: mp.spreads.into_iter().map(|s| MatchSpread {
            spread: s.spread, home_covers: s.home_covers, away_covers: s.away_covers,
        }).collect(),
        totals: mp.totals.into_iter().map(|t| MatchTotal {
            line: t.line, over: t.over, under: t.under,
        }).collect(),
    })
}

// --------------------------------------------------------------------
// Negative Binomial Match
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct NBinomMatchInput {
    pub mean_home: f64,
    pub mean_away: f64,
    pub r_home: f64,
    pub r_away: f64,
    pub max_score: usize,
    pub allow_draw: bool,
    pub spread_lines: Vec<f64>,
    pub total_lines: Vec<f64>,
}

#[tauri::command]
pub fn calc_nbinom_match(input: NBinomMatchInput) -> AppResult<PoissonMatchOutput> {
    let m = nbinom::build_nb_score_matrix(
        input.mean_home,
        input.mean_away,
        input.r_home,
        input.r_away,
        input.max_score,
    );
    let mp = poisson::derive_market_probs(&m, &input.spread_lines, &input.total_lines, input.allow_draw);
    Ok(PoissonMatchOutput {
        home_win: mp.home_win,
        draw: mp.draw,
        away_win: mp.away_win,
        top_scorelines: mp.top_scorelines.into_iter().map(|s| MatchScoreline {
            home: s.home, away: s.away, prob: s.prob,
        }).collect(),
        spreads: mp.spreads.into_iter().map(|s| MatchSpread {
            spread: s.spread, home_covers: s.home_covers, away_covers: s.away_covers,
        }).collect(),
        totals: mp.totals.into_iter().map(|t| MatchTotal {
            line: t.line, over: t.over, under: t.under,
        }).collect(),
    })
}

// --------------------------------------------------------------------
// Player Prop Simulator
// --------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PropSimInput {
    pub distribution: String, // "poisson" | "nbinom" | "gamma" | "lognormal"
    pub mu: f64,
    pub var_multiplier: f64,
    pub line: f64,
    pub num_sims: usize,
    pub seed: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct PropSimHistBucket {
    pub center: f64,
    pub count: usize,
}

#[derive(Debug, Serialize)]
pub struct PropSimOutput {
    pub samples: usize,
    pub mean: f64,
    pub median: f64,
    pub std_dev: f64,
    pub prob_over: f64,
    pub prob_under: f64,
    pub prob_push: f64,
    pub histogram: Vec<PropSimHistBucket>,
}

#[tauri::command]
pub fn calc_prop_sim(input: PropSimInput) -> AppResult<PropSimOutput> {
    let kind = prop_sim::parse_dist(&input.distribution)
        .ok_or_else(|| "invalid distribution".to_string())?;
    let r = prop_sim::simulate_prop(
        kind,
        input.mu,
        input.var_multiplier,
        input.line,
        input.num_sims,
        input.seed,
    );
    Ok(PropSimOutput {
        samples: r.samples,
        mean: r.mean,
        median: r.median,
        std_dev: r.std_dev,
        prob_over: r.prob_over,
        prob_under: r.prob_under,
        prob_push: r.prob_push,
        histogram: r.histogram.into_iter().map(|(c, n)| PropSimHistBucket {
            center: c, count: n,
        }).collect(),
    })
}

#[tauri::command]
pub fn calc_vig_compare(input: VigCompareInput) -> AppResult<Vec<VigBookResult>> {
    let entries: Vec<vig_comparison::BookEntry> = input
        .books
        .iter()
        .map(|b| vig_comparison::BookEntry {
            name: b.name.clone(),
            implied_a: calc::american_to_implied_prob(b.odds_a),
            implied_b: calc::american_to_implied_prob(b.odds_b),
        })
        .collect();
    let results = vig_comparison::compare_vig(&entries);
    Ok(results
        .into_iter()
        .map(|r| VigBookResult {
            name: r.name,
            implied_a: r.implied_a,
            implied_b: r.implied_b,
            total_implied: r.total_implied,
            vig_pct: r.vig_pct,
            no_vig_prob_a: r.no_vig_prob_a,
            no_vig_prob_b: r.no_vig_prob_b,
            fair_american_a: calc::implied_prob_to_american(r.no_vig_prob_a),
            fair_american_b: calc::implied_prob_to_american(r.no_vig_prob_b),
        })
        .collect())
}
