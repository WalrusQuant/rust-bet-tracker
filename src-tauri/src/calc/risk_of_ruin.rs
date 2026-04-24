//! Risk of Ruin — Monte Carlo flat-bet bankroll paths.

use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;

#[derive(Debug, Clone, Copy)]
pub struct RuinInput {
    pub win_prob: f64,      // 0..1
    pub decimal_odds: f64,
    pub bet_size: f64,
    pub bankroll: f64,
    pub num_bets: usize,
    pub num_sims: usize,
}

#[derive(Debug, Clone)]
pub struct SurvivalPoint {
    pub bet: usize,
    pub survival: f64,
}

#[derive(Debug, Clone)]
pub struct RuinResult {
    pub ruin_pct: f64,
    pub median_bankroll: f64,
    pub avg_bankroll: f64,
    pub max_drawdown_avg_pct: f64,
    pub ev_per_bet: f64,
    pub edge_pct: f64,
    pub survival_curve: Vec<SurvivalPoint>,
}

pub fn simulate_ruin(input: RuinInput, seed: Option<u64>) -> RuinResult {
    let RuinInput {
        win_prob,
        decimal_odds,
        bet_size,
        bankroll,
        num_bets,
        num_sims,
    } = input;

    // Input sanity
    if win_prob <= 0.0
        || win_prob >= 1.0
        || decimal_odds <= 1.0
        || bet_size <= 0.0
        || bankroll <= 0.0
        || num_bets == 0
        || num_sims == 0
    {
        return RuinResult {
            ruin_pct: 0.0,
            median_bankroll: 0.0,
            avg_bankroll: 0.0,
            max_drawdown_avg_pct: 0.0,
            ev_per_bet: 0.0,
            edge_pct: 0.0,
            survival_curve: vec![],
        };
    }

    let win_payout = bet_size * (decimal_odds - 1.0);
    let loss_cost = bet_size;
    let ev = win_prob * win_payout - (1.0 - win_prob) * loss_cost;

    // Sample points for survival curve
    let sample_count = num_bets.min(200);
    let sample_interval = (num_bets / sample_count).max(1);
    let mut sample_bets: Vec<usize> = Vec::new();
    let mut i = sample_interval;
    while i <= num_bets {
        sample_bets.push(i);
        i += sample_interval;
    }
    if sample_bets.last() != Some(&num_bets) {
        sample_bets.push(num_bets);
    }

    let mut rng: ChaCha8Rng = match seed {
        Some(s) => ChaCha8Rng::seed_from_u64(s),
        None => ChaCha8Rng::from_entropy(),
    };

    let mut alive_at = vec![0u64; sample_bets.len()];
    let mut ending_bankrolls: Vec<f64> = Vec::with_capacity(num_sims);
    let mut ruin_count: usize = 0;
    let mut total_max_dd: f64 = 0.0;
    let mut sum_all_ending: f64 = 0.0;

    for _ in 0..num_sims {
        let mut balance = bankroll;
        let mut peak = bankroll;
        let mut max_dd: f64 = 0.0;
        let mut ruined = false;
        let mut sample_idx: usize = 0;

        for b in 1..=num_bets {
            if balance < bet_size {
                ruined = true;
                break;
            }
            let won = rng.gen::<f64>() < win_prob;
            balance += if won { win_payout } else { -loss_cost };
            if balance > peak {
                peak = balance;
            }
            let dd = if peak > 0.0 { (peak - balance) / peak } else { 0.0 };
            if dd > max_dd {
                max_dd = dd;
            }
            if sample_idx < sample_bets.len() && b == sample_bets[sample_idx] {
                if !ruined && balance >= bet_size {
                    alive_at[sample_idx] += 1;
                }
                sample_idx += 1;
            }
        }

        if ruined || balance < bet_size {
            ruin_count += 1;
        } else {
            ending_bankrolls.push(balance);
            sum_all_ending += balance;
        }
        total_max_dd += max_dd;
    }

    let mut survival: Vec<SurvivalPoint> = Vec::with_capacity(sample_bets.len() + 1);
    survival.push(SurvivalPoint { bet: 0, survival: 1.0 });
    for (idx, b) in sample_bets.iter().enumerate() {
        survival.push(SurvivalPoint {
            bet: *b,
            survival: alive_at[idx] as f64 / num_sims as f64,
        });
    }

    ending_bankrolls.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = if ending_bankrolls.is_empty() {
        0.0
    } else {
        ending_bankrolls[ending_bankrolls.len() / 2]
    };
    let avg = if num_sims > 0 { sum_all_ending / num_sims as f64 } else { 0.0 };

    RuinResult {
        ruin_pct: (ruin_count as f64 / num_sims as f64) * 100.0,
        median_bankroll: median,
        avg_bankroll: avg,
        max_drawdown_avg_pct: (total_max_dd / num_sims as f64) * 100.0,
        ev_per_bet: ev,
        edge_pct: (ev / bet_size) * 100.0,
        survival_curve: survival,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seeded_is_deterministic() {
        let input = RuinInput {
            win_prob: 0.54,
            decimal_odds: 1.91,
            bet_size: 10.0,
            bankroll: 1000.0,
            num_bets: 500,
            num_sims: 200,
        };
        let a = simulate_ruin(input, Some(42));
        let b = simulate_ruin(input, Some(42));
        assert!((a.ruin_pct - b.ruin_pct).abs() < 1e-12);
        assert!((a.avg_bankroll - b.avg_bankroll).abs() < 1e-9);
    }

    #[test]
    fn positive_edge_has_low_ruin() {
        let input = RuinInput {
            win_prob: 0.60,
            decimal_odds: 1.91,
            bet_size: 10.0,
            bankroll: 1000.0,
            num_bets: 500,
            num_sims: 500,
        };
        let r = simulate_ruin(input, Some(123));
        assert!(r.ruin_pct < 10.0, "ruin should be low with big edge: {}", r.ruin_pct);
        assert!(r.ev_per_bet > 0.0);
    }

    #[test]
    fn oversized_bets_cause_ruin() {
        // Betting 50% of bankroll each spin, small edge → frequently ruin
        let input = RuinInput {
            win_prob: 0.55,
            decimal_odds: 1.91,
            bet_size: 500.0,
            bankroll: 1000.0,
            num_bets: 100,
            num_sims: 300,
        };
        let r = simulate_ruin(input, Some(1));
        assert!(r.ruin_pct > 20.0);
    }
}
