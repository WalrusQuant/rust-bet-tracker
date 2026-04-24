//! Arbitrage detection and stake sizing. 2-way and 3-way markets.

use super::odds::american_to_decimal;

#[derive(Debug, Clone)]
pub struct ArbLeg {
    pub odds: i32, // American
}

#[derive(Debug, Clone)]
pub struct ArbSplit {
    pub stake: f64,
    pub payout: f64,
}

#[derive(Debug, Clone)]
pub struct ArbResult {
    pub total_stake: f64,
    pub total_implied: f64, // sum of 1/decimal across legs
    pub is_arb: bool,
    pub arb_percent: f64,     // profit / total_stake as %, negative when not an arb
    pub guaranteed_profit: f64,
    pub splits: Vec<ArbSplit>,
}

pub fn calculate_arbitrage(legs: &[ArbLeg], total_stake: f64) -> Option<ArbResult> {
    if legs.is_empty() || total_stake <= 0.0 {
        return None;
    }
    let decs: Vec<f64> = legs.iter().map(|l| american_to_decimal(l.odds)).collect();
    if decs.iter().any(|&d| d <= 1.0) {
        return None;
    }
    let total_implied: f64 = decs.iter().map(|d| 1.0 / d).sum();

    // Stake on each leg proportional to 1/decimal_odds.
    let splits: Vec<ArbSplit> = decs
        .iter()
        .map(|&d| {
            let s = total_stake * (1.0 / d) / total_implied;
            ArbSplit { stake: s, payout: s * d }
        })
        .collect();

    // Guaranteed profit = smallest possible payout - total_stake
    let min_payout = splits
        .iter()
        .map(|s| s.payout)
        .fold(f64::INFINITY, f64::min);
    let profit = min_payout - total_stake;
    let is_arb = total_implied < 1.0;

    Some(ArbResult {
        total_stake,
        total_implied,
        is_arb,
        arb_percent: profit / total_stake * 100.0,
        guaranteed_profit: profit,
        splits,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn true_two_way_arb() {
        // +110 / +110 → decimals 2.1 / 2.1 → total implied 0.952 < 1 → arb
        let legs = vec![ArbLeg { odds: 110 }, ArbLeg { odds: 110 }];
        let r = calculate_arbitrage(&legs, 100.0).unwrap();
        assert!(r.is_arb);
        assert!(r.arb_percent > 0.0);
        // Each leg's payout should be equal (balanced arb)
        let p0 = r.splits[0].payout;
        for s in &r.splits {
            assert!((s.payout - p0).abs() < 1e-6);
        }
    }

    #[test]
    fn not_an_arb_standard_vigged_market() {
        // -110 / -110 is NOT an arb
        let legs = vec![ArbLeg { odds: -110 }, ArbLeg { odds: -110 }];
        let r = calculate_arbitrage(&legs, 100.0).unwrap();
        assert!(!r.is_arb);
        assert!(r.arb_percent < 0.0);
    }

    #[test]
    fn splits_sum_to_total_stake() {
        let legs = vec![ArbLeg { odds: 115 }, ArbLeg { odds: 105 }];
        let r = calculate_arbitrage(&legs, 500.0).unwrap();
        let sum: f64 = r.splits.iter().map(|s| s.stake).sum();
        assert!((sum - 500.0).abs() < 1e-6);
    }
}
