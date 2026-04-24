//! Alternate-line ladder — given a main spread/total + odds, price the fair
//! cover probability (and thus fair odds) at every alternate line in a range.

use super::bestline::{implied_true_line, BetType, TotalSide};
use super::odds::implied_prob_to_american;
use super::probability::normal_cdf;

#[derive(Debug, Clone, Copy)]
pub struct LadderRow {
    pub line: f64,
    pub fair_prob: f64,
    pub fair_odds: i32,
}

/// P(cover) at an alternate line, given the implied true line.
pub fn fair_prob_at_line(
    true_line: f64,
    alt_line: f64,
    std: f64,
    bet_type: BetType,
    side: Option<TotalSide>,
) -> f64 {
    let z = (alt_line - true_line) / std;
    match bet_type {
        BetType::Spread => normal_cdf(z),
        BetType::Total => match side.unwrap_or(TotalSide::Over) {
            TotalSide::Over => 1.0 - normal_cdf(z),
            TotalSide::Under => normal_cdf(z),
        },
    }
}

#[derive(Debug, Clone)]
pub struct Ladder {
    pub true_line: f64,
    pub ladder: Vec<LadderRow>,
}

pub fn generate_line_ladder(
    main_line: f64,
    odds: i32,
    std: f64,
    bet_type: BetType,
    side: Option<TotalSide>,
    range: f64,
    step: f64,
) -> Option<Ladder> {
    if step <= 0.0 || (range / step) as i64 > 500 {
        return None;
    }
    let true_line = implied_true_line(main_line, odds, std, bet_type, side)?;

    let mut ladder: Vec<LadderRow> = Vec::new();
    let mut line = main_line - range;
    let end = main_line + range + 1e-9;
    while line <= end {
        let rounded = (line * 10.0).round() / 10.0;
        let prob = fair_prob_at_line(true_line, rounded, std, bet_type, side);
        if prob > 0.005 && prob < 0.995 {
            ladder.push(LadderRow {
                line: rounded,
                fair_prob: prob,
                fair_odds: implied_prob_to_american(prob),
            });
        }
        line += step;
    }
    Some(Ladder { true_line, ladder })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn at_true_line_prob_is_half() {
        // Spread at exactly the true line: cover prob = 0.5
        let p = fair_prob_at_line(-3.0, -3.0, 10.0, BetType::Spread, None);
        assert!((p - 0.5).abs() < 1e-9);
    }

    #[test]
    fn easier_spread_has_higher_prob() {
        // A team favored by -3 is easier to cover than -7 (same true line)
        let p_easy = fair_prob_at_line(-7.0, -3.0, 10.0, BetType::Spread, None);
        let p_hard = fair_prob_at_line(-7.0, -10.0, 10.0, BetType::Spread, None);
        assert!(p_easy > p_hard);
    }

    #[test]
    fn ladder_includes_main_line() {
        let r = generate_line_ladder(-3.0, -110, 10.0, BetType::Spread, None, 5.0, 0.5).unwrap();
        assert!(r.ladder.iter().any(|row| (row.line - -3.0).abs() < 1e-9));
    }
}
