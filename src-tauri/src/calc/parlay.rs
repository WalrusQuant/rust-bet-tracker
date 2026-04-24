//! Parlay calculator — multiplicative decimal odds.

use super::odds::{american_to_decimal, american_to_implied_prob, decimal_to_american};

#[derive(Debug, Clone)]
pub struct ParlayLeg {
    pub odds: i32, // American
}

#[derive(Debug, Clone)]
pub struct ParlayResult {
    pub combined_decimal: f64,
    pub combined_american: i32,
    pub combined_implied_prob: f64, // product of leg implied probs
    pub stake: f64,
    pub profit: f64,   // payout - stake
    pub payout: f64,   // total return including stake
}

pub fn calculate_parlay(legs: &[ParlayLeg], stake: f64) -> Option<ParlayResult> {
    if legs.is_empty() || stake <= 0.0 {
        return None;
    }
    let mut combined_dec = 1.0_f64;
    let mut combined_prob = 1.0_f64;
    for l in legs {
        let d = american_to_decimal(l.odds);
        if d <= 1.0 {
            return None;
        }
        combined_dec *= d;
        combined_prob *= american_to_implied_prob(l.odds);
    }
    let payout = stake * combined_dec;
    Some(ParlayResult {
        combined_decimal: combined_dec,
        combined_american: decimal_to_american(combined_dec),
        combined_implied_prob: combined_prob,
        stake,
        profit: payout - stake,
        payout,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn two_leg_minus_110() {
        // -110 * -110 ≈ 1.9091 * 1.9091 ≈ 3.6446
        let r = calculate_parlay(
            &[ParlayLeg { odds: -110 }, ParlayLeg { odds: -110 }],
            100.0,
        )
        .unwrap();
        assert!((r.combined_decimal - 3.6446).abs() < 0.01);
        // 100 stake → 364.46 payout → 264.46 profit
        assert!((r.payout - 364.46).abs() < 0.5);
    }

    #[test]
    fn three_leg_underdogs() {
        let r = calculate_parlay(
            &[
                ParlayLeg { odds: 150 },
                ParlayLeg { odds: 200 },
                ParlayLeg { odds: 100 },
            ],
            50.0,
        )
        .unwrap();
        // Decimals: 2.5 * 3.0 * 2.0 = 15.0
        assert!((r.combined_decimal - 15.0).abs() < 1e-9);
        assert!((r.payout - 750.0).abs() < 1e-9);
    }

    #[test]
    fn empty_parlay_returns_none() {
        assert!(calculate_parlay(&[], 100.0).is_none());
    }
}
