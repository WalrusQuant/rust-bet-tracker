//! Hedge calculator — given an existing bet, compute a hedge stake on the
//! opposite side that equalizes payout between outcomes.

use super::odds::american_to_decimal;

#[derive(Debug, Clone)]
pub struct HedgeResult {
    pub hedge_stake: f64,
    pub total_stake: f64,
    pub payout_if_original_wins: f64,
    pub payout_if_hedge_wins: f64,
    pub guaranteed_profit: f64, // min of the two payouts - total_stake
}

/// Given original bet (stake + American odds) and hedge odds (American),
/// return the hedge stake that equalizes net payout across both outcomes.
pub fn calculate_hedge(
    original_stake: f64,
    original_odds: i32,
    hedge_odds: i32,
) -> Option<HedgeResult> {
    if original_stake <= 0.0 {
        return None;
    }
    let d_orig = american_to_decimal(original_odds);
    let d_hedge = american_to_decimal(hedge_odds);
    if d_orig <= 1.0 || d_hedge <= 1.0 {
        return None;
    }

    // Equalize: original_stake * d_orig = hedge_stake * d_hedge
    // (ignoring refunded stakes on losing side, which is standard sportsbook behavior)
    let hedge_stake = original_stake * d_orig / d_hedge;
    let payout_original = original_stake * d_orig;
    let payout_hedge = hedge_stake * d_hedge;
    let total = original_stake + hedge_stake;
    let min_payout = payout_original.min(payout_hedge);

    Some(HedgeResult {
        hedge_stake,
        total_stake: total,
        payout_if_original_wins: payout_original,
        payout_if_hedge_wins: payout_hedge,
        guaranteed_profit: min_payout - total,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_payouts_after_hedge() {
        let r = calculate_hedge(100.0, 200, -150).unwrap();
        assert!((r.payout_if_original_wins - r.payout_if_hedge_wins).abs() < 1e-6);
    }

    #[test]
    fn negative_ev_hedge_still_computes() {
        // Hedging often locks in a loss; we still compute it.
        let r = calculate_hedge(100.0, 120, -200).unwrap();
        assert!(r.hedge_stake > 0.0);
    }
}
