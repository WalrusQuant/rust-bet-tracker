//! Hold / overround calculations for a two-sided market.

#[derive(Debug, Clone, Copy)]
pub struct HoldResult {
    pub implied_a: f64,
    pub implied_b: f64,
    pub total_implied: f64,
    pub hold_pct: f64,       // percentage points
    pub no_vig_prob_a: f64,
    pub no_vig_prob_b: f64,
}

/// Compute hold% and no-vig fair probs from a two-sided market's implied probs.
/// Returns None if either side is non-positive.
pub fn calculate_hold(implied_a: f64, implied_b: f64) -> Option<HoldResult> {
    if implied_a <= 0.0 || implied_b <= 0.0 {
        return None;
    }
    let total = implied_a + implied_b;
    Some(HoldResult {
        implied_a,
        implied_b,
        total_implied: total,
        hold_pct: (total - 1.0) * 100.0,
        no_vig_prob_a: implied_a / total,
        no_vig_prob_b: implied_b / total,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hold_minus110_both_sides() {
        // -110 / -110 ≈ 0.5238 each → total 1.0476 → hold 4.76%
        let h = calculate_hold(0.5238, 0.5238).unwrap();
        assert!((h.hold_pct - 4.76).abs() < 0.05);
        assert!((h.no_vig_prob_a - 0.5).abs() < 1e-6);
        assert!((h.no_vig_prob_b - 0.5).abs() < 1e-6);
    }

    #[test]
    fn hold_asymmetric_market() {
        // Favorite at 0.60, dog at 0.45 → sum 1.05 → hold 5%
        let h = calculate_hold(0.60, 0.45).unwrap();
        assert!((h.hold_pct - 5.0).abs() < 1e-6);
        // No-vig favorite retains its lead
        assert!(h.no_vig_prob_a > h.no_vig_prob_b);
        assert!((h.no_vig_prob_a + h.no_vig_prob_b - 1.0).abs() < 1e-12);
    }

    #[test]
    fn hold_rejects_zero() {
        assert!(calculate_hold(0.0, 0.5).is_none());
        assert!(calculate_hold(0.5, -0.1).is_none());
    }
}
