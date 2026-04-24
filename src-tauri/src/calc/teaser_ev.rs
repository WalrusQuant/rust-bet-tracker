//! Teaser EV — analyze a football teaser by tracing each leg's implied
//! true line, then pricing the teased spread's cover probability.

use super::altline::fair_prob_at_line;
use super::bestline::{implied_true_line, BetType};
use super::odds::{american_to_implied_prob, implied_prob_to_american};

pub const FOOTBALL_KEY_NUMBERS: &[f64] = &[3.0, 7.0, 10.0, 14.0];

#[derive(Debug, Clone)]
pub struct TeaserLegInput {
    pub spread: f64,
    pub odds: i32,
}

#[derive(Debug, Clone)]
pub struct TeaserLegResult {
    pub spread: f64,
    pub teased_spread: f64,
    pub true_line: f64,
    pub cover_prob: f64,
    pub fair_odds: i32,
    pub key_numbers_crossed: Vec<f64>,
}

#[derive(Debug, Clone)]
pub struct TeaserResult {
    pub legs: Vec<TeaserLegResult>,
    pub combined_prob: f64,
    pub fair_teaser_odds: i32,
    pub book_teaser_odds: i32,
    pub break_even_prob: f64,
    pub ev_pct: f64,
}

fn key_numbers_crossed(spread: f64, teased: f64) -> Vec<f64> {
    let lo = spread.min(teased);
    let hi = spread.max(teased);
    let mut out = Vec::new();
    for &k in FOOTBALL_KEY_NUMBERS {
        if (lo < -k && -k < hi) || (lo < k && k < hi) {
            out.push(k);
        }
    }
    out
}

pub fn analyze_teaser_leg(
    spread: f64,
    odds: i32,
    teaser_pts: f64,
    std: f64,
) -> Option<TeaserLegResult> {
    let true_line = implied_true_line(spread, odds, std, BetType::Spread, None)?;
    let teased = spread + teaser_pts;
    let cover = fair_prob_at_line(true_line, teased, std, BetType::Spread, None);
    Some(TeaserLegResult {
        spread,
        teased_spread: teased,
        true_line,
        cover_prob: cover,
        fair_odds: implied_prob_to_american(cover),
        key_numbers_crossed: key_numbers_crossed(spread, teased),
    })
}

pub fn analyze_teaser(
    legs: &[TeaserLegInput],
    teaser_pts: f64,
    teaser_odds: i32,
    std: f64,
) -> Option<TeaserResult> {
    let mut leg_results: Vec<TeaserLegResult> = Vec::with_capacity(legs.len());
    let mut combined = 1.0_f64;
    for l in legs {
        let r = analyze_teaser_leg(l.spread, l.odds, teaser_pts, std)?;
        combined *= r.cover_prob;
        leg_results.push(r);
    }
    let break_even = american_to_implied_prob(teaser_odds);
    let ev_pct = if break_even > 0.0 {
        (combined - break_even) / break_even * 100.0
    } else {
        0.0
    };
    Some(TeaserResult {
        legs: leg_results,
        combined_prob: combined,
        fair_teaser_odds: implied_prob_to_american(combined),
        book_teaser_odds: teaser_odds,
        break_even_prob: break_even,
        ev_pct,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_numbers_crossed_through_three() {
        // Teasing -3.5 up 6 pts to +2.5 crosses 3 but not 7 (because 2.5 < 7)
        let c = key_numbers_crossed(-3.5, 2.5);
        assert!(c.contains(&3.0));
        assert!(!c.contains(&7.0));
    }

    #[test]
    fn two_leg_teaser_combined_prob_is_product() {
        let legs = [
            TeaserLegInput { spread: -7.5, odds: -110 },
            TeaserLegInput { spread: -3.5, odds: -110 },
        ];
        let r = analyze_teaser(&legs, 6.0, -110, 14.0).unwrap();
        let expected = r.legs[0].cover_prob * r.legs[1].cover_prob;
        assert!((r.combined_prob - expected).abs() < 1e-9);
    }
}
