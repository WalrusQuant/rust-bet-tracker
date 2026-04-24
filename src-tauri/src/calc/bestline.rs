//! Better Line calculator — compare two lines using implied true-line math.
//!
//! Given a spread or total line and its American odds, you can solve for the
//! "implied true line" — the market's unbiased point estimate — by inverting
//! the normal CDF of the cover probability.

use super::odds::american_to_implied_prob;
use super::probability::inverse_normal_cdf;

#[derive(Debug, Clone, Copy)]
pub enum BetType {
    Spread,
    Total,
}

#[derive(Debug, Clone, Copy)]
pub enum TotalSide {
    Over,
    Under,
}

/// Back out the implied true line from a market line + odds.
///   spread: trueLine = line - std * Φ⁻¹(coverProb)
///   total over:   trueTotal = line + std * Φ⁻¹(coverProb)
///   total under:  trueTotal = line - std * Φ⁻¹(coverProb)
pub fn implied_true_line(
    line: f64,
    odds: i32,
    std: f64,
    bet_type: BetType,
    side: Option<TotalSide>,
) -> Option<f64> {
    if std <= 0.0 || !line.is_finite() {
        return None;
    }
    let cover = american_to_implied_prob(odds);
    let z = inverse_normal_cdf(cover);
    Some(match bet_type {
        BetType::Spread => line - std * z,
        BetType::Total => match side.unwrap_or(TotalSide::Over) {
            TotalSide::Over => line + std * z,
            TotalSide::Under => line - std * z,
        },
    })
}

#[derive(Debug, Clone)]
pub struct BestLineResult {
    pub implied_1: f64,
    pub implied_2: f64,
    pub cover_1: f64,
    pub cover_2: f64,
    pub winner: u8, // 0 = tie, 1 = line 1, 2 = line 2
    pub diff: f64,
}

pub fn compare_best_line(
    line_1: f64,
    odds_1: i32,
    line_2: f64,
    odds_2: i32,
    std: f64,
    bet_type: BetType,
    side: Option<TotalSide>,
) -> Option<BestLineResult> {
    let cover_1 = american_to_implied_prob(odds_1);
    let cover_2 = american_to_implied_prob(odds_2);
    let implied_1 = implied_true_line(line_1, odds_1, std, bet_type, side)?;
    let implied_2 = implied_true_line(line_2, odds_2, std, bet_type, side)?;

    let winner = match bet_type {
        BetType::Spread => {
            // Higher implied (closer to 0 from below, farther from 0 if positive) → better for bettor
            if implied_2 > implied_1 {
                2
            } else if implied_1 > implied_2 {
                1
            } else {
                0
            }
        }
        BetType::Total => match side.unwrap_or(TotalSide::Over) {
            TotalSide::Over => {
                // Lower implied total better for over bettors
                if implied_1 < implied_2 {
                    1
                } else if implied_2 < implied_1 {
                    2
                } else {
                    0
                }
            }
            TotalSide::Under => {
                if implied_2 > implied_1 {
                    2
                } else if implied_1 > implied_2 {
                    1
                } else {
                    0
                }
            }
        },
    };

    Some(BestLineResult {
        implied_1,
        implied_2,
        cover_1,
        cover_2,
        winner,
        diff: (implied_2 - implied_1).abs(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_lines_are_tie() {
        let r = compare_best_line(-3.0, -110, -3.0, -110, 10.0, BetType::Spread, None).unwrap();
        assert_eq!(r.winner, 0);
        assert!((r.diff).abs() < 1e-9);
    }

    #[test]
    fn better_spread_wins() {
        // -3.0 at -110 vs -3.5 at -110: -3.0 is the better line for the bettor
        let r = compare_best_line(-3.0, -110, -3.5, -110, 10.0, BetType::Spread, None).unwrap();
        assert_eq!(r.winner, 1);
        assert!(r.diff > 0.0);
    }

    #[test]
    fn implied_true_line_at_pickem() {
        // At -110 the cover prob is ~0.524 → z ≈ 0.06. trueLine ≈ line - std*0.06
        let t = implied_true_line(-7.0, -110, 10.0, BetType::Spread, None).unwrap();
        assert!(t < -7.0); // slightly more pessimistic than the line
    }
}
