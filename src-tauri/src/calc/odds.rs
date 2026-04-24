//! American/decimal/fractional odds conversions, implied probability,
//! profit math, EV/CLV percent, and Kelly sizing. Pure — no I/O.

/// Convert American odds to decimal odds.
pub fn american_to_decimal(odds: i32) -> f64 {
    if odds >= 100 {
        1.0 + (odds as f64) / 100.0
    } else if odds <= -100 {
        1.0 + 100.0 / (-odds as f64)
    } else {
        // Non-standard odds between -99 and 99 are invalid; treat as 1.0.
        1.0
    }
}

/// Convert decimal odds back to American odds.
#[allow(dead_code)]
pub fn decimal_to_american(decimal: f64) -> i32 {
    if decimal <= 1.0 {
        return 0;
    }
    if decimal >= 2.0 {
        ((decimal - 1.0) * 100.0).round() as i32
    } else {
        (-100.0 / (decimal - 1.0)).round() as i32
    }
}

/// American odds → implied probability in [0, 1].
pub fn american_to_implied_prob(odds: i32) -> f64 {
    if odds >= 100 {
        100.0 / ((odds as f64) + 100.0)
    } else if odds <= -100 {
        (-odds as f64) / ((-odds as f64) + 100.0)
    } else {
        0.5
    }
}

/// Decimal odds → implied probability.
#[allow(dead_code)]
pub fn decimal_to_implied_prob(decimal: f64) -> f64 {
    if decimal <= 1.0 {
        return 0.0;
    }
    1.0 / decimal
}

/// Implied probability → American odds. Uses -10000 sentinel for p ≥ 1.
#[allow(dead_code)]
pub fn implied_prob_to_american(p: f64) -> i32 {
    if p <= 0.0 {
        return 0;
    }
    if p >= 1.0 {
        return -10000;
    }
    let d = 1.0 / p;
    decimal_to_american(d)
}

/// Implied probability → decimal odds.
#[allow(dead_code)]
pub fn implied_prob_to_decimal(p: f64) -> f64 {
    if p <= 0.0 {
        return f64::INFINITY;
    }
    1.0 / p
}

/// Profit for a winning bet at the given American odds and stake.
/// Does NOT include the stake itself.
pub fn profit(odds: i32, stake: f64) -> f64 {
    if odds >= 100 {
        stake * (odds as f64) / 100.0
    } else if odds <= -100 {
        stake * 100.0 / (-odds as f64)
    } else {
        0.0
    }
}

/// Expected Value as a percentage of stake.
/// EV% = (fair_prob * profit - (1 - fair_prob) * stake) / stake * 100
pub fn ev_percent(odds: i32, stake: f64, fair_odds: i32) -> f64 {
    if stake <= 0.0 {
        return 0.0;
    }
    let fair_prob = american_to_implied_prob(fair_odds);
    let p = profit(odds, stake);
    (fair_prob * p - (1.0 - fair_prob) * stake) / stake * 100.0
}

/// Closing Line Value as a percentage.
/// CLV% = (decimal_placed / decimal_closing - 1) * 100
/// Positive = you beat the close.
pub fn clv_percent(odds: i32, closing_odds: i32) -> f64 {
    let placed = american_to_decimal(odds);
    let close = american_to_decimal(closing_odds);
    if close <= 1.0 {
        return 0.0;
    }
    (placed / close - 1.0) * 100.0
}

/// Kelly Criterion stake, capped at 10% of bankroll. Returns a dollar amount.
/// Applies an optional fraction (1.0 = full Kelly, 0.5 = half Kelly, etc.)
pub fn kelly_stake(bankroll: f64, odds: i32, fair_odds: i32, fraction: f64) -> f64 {
    if bankroll <= 0.0 {
        return 0.0;
    }
    let b = american_to_decimal(odds) - 1.0;
    if b <= 0.0 {
        return 0.0;
    }
    let p = american_to_implied_prob(fair_odds);
    let q = 1.0 - p;
    let f = ((b * p - q) / b).max(0.0);
    let f_scaled = (f * fraction).min(0.10);
    bankroll * f_scaled
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx(a: f64, b: f64) {
        assert!((a - b).abs() < 1e-4, "{a} !~= {b}");
    }

    #[test]
    fn decimal_conversions() {
        approx(american_to_decimal(100), 2.0);
        approx(american_to_decimal(150), 2.5);
        approx(american_to_decimal(-110), 1.9091);
        approx(american_to_decimal(-200), 1.5);
    }

    #[test]
    fn decimal_round_trip() {
        for odds in [-500, -200, -110, 100, 150, 300] {
            let d = american_to_decimal(odds);
            assert_eq!(decimal_to_american(d), odds);
        }
    }

    #[test]
    fn implied_probabilities() {
        approx(american_to_implied_prob(100), 0.5);
        approx(american_to_implied_prob(-110), 0.5238);
        approx(american_to_implied_prob(200), 0.3333);
    }

    #[test]
    fn implied_round_trip() {
        for odds in [-500, -200, -110, 100, 150, 300] {
            let p = american_to_implied_prob(odds);
            assert_eq!(implied_prob_to_american(p), odds);
        }
    }

    #[test]
    fn decimal_implied_round_trip() {
        for d in [1.5f64, 1.91, 2.0, 2.5, 3.5] {
            let p = decimal_to_implied_prob(d);
            approx(implied_prob_to_decimal(p), d);
        }
    }

    #[test]
    fn profits() {
        approx(profit(100, 100.0), 100.0);
        approx(profit(-110, 110.0), 100.0);
        approx(profit(200, 50.0), 100.0);
    }

    #[test]
    fn ev_positive_when_odds_beat_fair() {
        let ev = ev_percent(150, 100.0, 100);
        assert!(ev > 0.0, "ev should be positive: {ev}");
    }

    #[test]
    fn ev_negative_when_odds_worse_than_fair() {
        let ev = ev_percent(-150, 100.0, 100);
        assert!(ev < 0.0, "ev should be negative: {ev}");
    }

    #[test]
    fn clv_positive_when_placed_better_than_close() {
        let clv = clv_percent(150, 120);
        assert!(clv > 0.0, "{clv}");
    }

    #[test]
    fn kelly_caps_at_ten_percent() {
        let k = kelly_stake(1000.0, 500, -500, 1.0);
        assert!(k <= 100.0 + 1e-6, "{k}");
    }

    #[test]
    fn kelly_zero_when_no_edge() {
        let k = kelly_stake(1000.0, -110, -110, 1.0);
        assert!(k.abs() < 1e-6, "{k}");
    }

    #[test]
    fn kelly_fraction_scales() {
        let full = kelly_stake(1000.0, 150, 130, 1.0);
        let half = kelly_stake(1000.0, 150, 130, 0.5);
        assert!(full < 100.0, "should be under cap: {full}");
        approx(half, full * 0.5);
    }
}
