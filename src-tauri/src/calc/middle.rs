//! Middle / Trap finder — given two positions on opposite sides of a spread
//! or total, compute the "gap" probability (middle = both win, trap = both
//! lose), profit outcomes, and EV.

use super::bestline::{implied_true_line, BetType, TotalSide};
use super::odds::american_to_implied_prob;
use super::probability::normal_cdf;

#[derive(Debug, Clone)]
pub struct MiddleOutcome {
    pub label: String,
    pub probability: f64,
    pub net_profit: f64,
}

#[derive(Debug, Clone)]
pub struct MiddleResult {
    pub is_middle: bool,
    pub gap_size: f64,
    pub gap_prob: f64,
    pub true_center: f64,
    pub ev: f64,
    pub ev_percent: f64,
    pub total_staked: f64,
    pub outcomes: Vec<MiddleOutcome>,
}

fn american_profit(odds: i32, stake: f64) -> f64 {
    if odds >= 100 {
        stake * (odds as f64) / 100.0
    } else if odds <= -100 {
        stake * 100.0 / (-odds as f64)
    } else {
        0.0
    }
}

pub fn calculate_middle(
    line1: f64,
    odds1: i32,
    stake1: f64,
    line2: f64,
    odds2: i32,
    stake2: f64,
    std: f64,
    bet_type: BetType,
) -> Option<MiddleResult> {
    if stake1 <= 0.0 || stake2 <= 0.0 || std <= 0.0 {
        return None;
    }
    // Devig each line to implied true center, then average
    let implied1 = implied_true_line(
        line1,
        odds1,
        std,
        bet_type,
        match bet_type {
            BetType::Total => Some(TotalSide::Over),
            BetType::Spread => None,
        },
    )?;
    let implied2 = implied_true_line(
        line2,
        odds2,
        std,
        bet_type,
        match bet_type {
            BetType::Total => Some(TotalSide::Under),
            BetType::Spread => None,
        },
    )?;
    let true_center = (implied1 + implied2) / 2.0;

    let (pos1_threshold, pos2_threshold) = match bet_type {
        BetType::Spread => (line1.abs(), line2.abs()),
        BetType::Total => (line1, line2),
    };
    let lo = pos1_threshold.min(pos2_threshold);
    let hi = pos1_threshold.max(pos2_threshold);
    let gap_size = hi - lo;

    let z_lo = (lo - true_center) / std;
    let z_hi = (hi - true_center) / std;
    let gap_prob = normal_cdf(z_hi) - normal_cdf(z_lo);

    let is_middle = pos2_threshold > pos1_threshold;

    let profit1 = american_profit(odds1, stake1);
    let profit2 = american_profit(odds2, stake2);
    let total_staked = stake1 + stake2;

    let p_pos1_covers = 1.0 - normal_cdf((pos1_threshold - true_center) / std);
    let p_pos2_covers = normal_cdf((pos2_threshold - true_center) / std);

    let (p_pos1_only, p_pos2_only) = if is_middle {
        (
            (p_pos1_covers - gap_prob).max(0.0),
            (p_pos2_covers - gap_prob).max(0.0),
        )
    } else {
        (p_pos1_covers, p_pos2_covers)
    };

    let mut outcomes: Vec<MiddleOutcome> = Vec::new();
    if is_middle {
        outcomes.push(MiddleOutcome {
            label: "Both win".into(),
            probability: gap_prob,
            net_profit: profit1 + profit2,
        });
    }
    let (lbl1, lbl2) = match bet_type {
        BetType::Spread => ("Favorite only", "Underdog only"),
        BetType::Total => ("Over only", "Under only"),
    };
    outcomes.push(MiddleOutcome {
        label: lbl1.into(),
        probability: p_pos1_only,
        net_profit: profit1 - stake2,
    });
    outcomes.push(MiddleOutcome {
        label: lbl2.into(),
        probability: p_pos2_only,
        net_profit: profit2 - stake1,
    });
    if !is_middle {
        outcomes.push(MiddleOutcome {
            label: "Both lose".into(),
            probability: gap_prob,
            net_profit: -(stake1 + stake2),
        });
    }
    // Silence unused _ warning
    let _ = american_to_implied_prob(odds1);

    let ev: f64 = outcomes.iter().map(|o| o.probability * o.net_profit).sum();
    let ev_percent = if total_staked > 0.0 { ev / total_staked * 100.0 } else { 0.0 };

    Some(MiddleResult {
        is_middle,
        gap_size,
        gap_prob,
        true_center,
        ev,
        ev_percent,
        total_staked,
        outcomes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn real_middle_has_positive_both_win_zone() {
        // Fav -3.5 at -110, Dog +7.5 at -110, std=14: 4pt middle zone
        let r = calculate_middle(-3.5, -110, 100.0, 7.5, -110, 100.0, 14.0, BetType::Spread).unwrap();
        assert!(r.is_middle);
        assert!(r.gap_prob > 0.0);
        assert_eq!(r.outcomes[0].label, "Both win");
    }

    #[test]
    fn overlapping_is_trap() {
        // Fav -7.5 at -110, Dog +3.5 at -110: gap 4pt is "both lose" zone
        let r = calculate_middle(-7.5, -110, 100.0, 3.5, -110, 100.0, 14.0, BetType::Spread).unwrap();
        assert!(!r.is_middle);
        assert_eq!(r.outcomes[r.outcomes.len() - 1].label, "Both lose");
    }
}
