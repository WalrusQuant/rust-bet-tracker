//! Poisson match predictor — analytical scoreline probabilities from a
//! pair of independent Poisson rates.

/// P(X = k) for Poisson(λ), log-space to avoid overflow.
pub fn poisson_pmf(k: usize, lambda: f64) -> f64 {
    if lambda < 0.0 {
        return 0.0;
    }
    if lambda == 0.0 {
        return if k == 0 { 1.0 } else { 0.0 };
    }
    let mut log_p = -lambda + (k as f64) * lambda.ln();
    for i in 2..=k {
        log_p -= (i as f64).ln();
    }
    log_p.exp()
}

/// Build joint probability matrix: matrix[h][a] = P(home=h) * P(away=a).
pub fn build_score_matrix(lambda_home: f64, lambda_away: f64, max_score: usize) -> Vec<Vec<f64>> {
    let mut matrix: Vec<Vec<f64>> = Vec::with_capacity(max_score + 1);
    for h in 0..=max_score {
        let ph = poisson_pmf(h, lambda_home);
        let mut row = Vec::with_capacity(max_score + 1);
        for a in 0..=max_score {
            row.push(ph * poisson_pmf(a, lambda_away));
        }
        matrix.push(row);
    }
    matrix
}

#[derive(Debug, Clone, Copy)]
pub struct Scoreline {
    pub home: usize,
    pub away: usize,
    pub prob: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct SpreadProb {
    pub spread: f64,
    pub home_covers: f64,
    pub away_covers: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct TotalProb {
    pub line: f64,
    pub over: f64,
    pub under: f64,
}

#[derive(Debug, Clone)]
pub struct MarketProbs {
    pub home_win: f64,
    pub draw: f64,
    pub away_win: f64,
    pub top_scorelines: Vec<Scoreline>,
    pub spreads: Vec<SpreadProb>,
    pub totals: Vec<TotalProb>,
}

pub fn derive_market_probs(
    matrix: &[Vec<f64>],
    spread_lines: &[f64],
    total_lines: &[f64],
    allow_draw: bool,
) -> MarketProbs {
    let n = matrix.len();
    let mut home_win = 0.0_f64;
    let mut draw = 0.0_f64;
    let mut away_win = 0.0_f64;
    let mut scorelines: Vec<Scoreline> = Vec::with_capacity(n * n);

    for h in 0..n {
        for a in 0..n {
            let p = matrix[h][a];
            if h > a {
                home_win += p;
            } else if h == a {
                draw += p;
            } else {
                away_win += p;
            }
            scorelines.push(Scoreline { home: h, away: a, prob: p });
        }
    }

    if !allow_draw && draw > 0.0 {
        let total = home_win + away_win;
        if total > 0.0 {
            let home_share = home_win / total;
            home_win += draw * home_share;
            away_win += draw * (1.0 - home_share);
        }
        draw = 0.0;
    }

    scorelines.sort_by(|a, b| b.prob.partial_cmp(&a.prob).unwrap_or(std::cmp::Ordering::Equal));
    let top_scorelines: Vec<Scoreline> = scorelines.into_iter().take(10).collect();

    let spreads: Vec<SpreadProb> = spread_lines
        .iter()
        .map(|&spread| {
            let mut hc = 0.0_f64;
            let mut ac = 0.0_f64;
            for h in 0..n {
                for a in 0..n {
                    let margin = (h as f64) - (a as f64);
                    if margin > spread {
                        hc += matrix[h][a];
                    } else if margin < spread {
                        ac += matrix[h][a];
                    }
                }
            }
            SpreadProb { spread, home_covers: hc, away_covers: ac }
        })
        .collect();

    let totals: Vec<TotalProb> = total_lines
        .iter()
        .map(|&line| {
            let mut over = 0.0_f64;
            let mut under = 0.0_f64;
            for h in 0..n {
                for a in 0..n {
                    let t = (h as f64) + (a as f64);
                    if t > line {
                        over += matrix[h][a];
                    } else if t < line {
                        under += matrix[h][a];
                    }
                }
            }
            TotalProb { line, over, under }
        })
        .collect();

    MarketProbs { home_win, draw, away_win, top_scorelines, spreads, totals }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pmf_sums_to_one() {
        let sum: f64 = (0..=30).map(|k| poisson_pmf(k, 3.5)).sum();
        assert!((sum - 1.0).abs() < 1e-9);
    }

    #[test]
    fn score_matrix_sums_to_one() {
        let m = build_score_matrix(1.2, 1.5, 15);
        let s: f64 = m.iter().flat_map(|r| r.iter()).sum();
        assert!((s - 1.0).abs() < 1e-6);
    }

    #[test]
    fn market_probs_sum_to_one_in_no_draw_mode() {
        let m = build_score_matrix(4.5, 4.8, 25);
        let mp = derive_market_probs(&m, &[], &[], false);
        assert!((mp.home_win + mp.away_win - 1.0).abs() < 1e-6);
        assert!(mp.draw.abs() < 1e-9);
    }
}
