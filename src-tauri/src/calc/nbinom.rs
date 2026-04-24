//! Negative Binomial match predictor — analytical scoreline probabilities
//! using Negative Binomial marginals (overdispersed alternative to Poisson).

/// Log-gamma via Lanczos approximation (ported verbatim from source).
fn log_gamma(mut z: f64) -> f64 {
    let g = 7.0_f64;
    let c = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];
    if z < 0.5 {
        return (std::f64::consts::PI / (std::f64::consts::PI * z).sin()).ln() - log_gamma(1.0 - z);
    }
    z -= 1.0;
    let mut x = c[0];
    for (i, ci) in c.iter().enumerate().skip(1).take(g as usize + 2 - 1) {
        x += ci / (z + i as f64);
    }
    let t = z + g + 0.5;
    0.5 * (2.0 * std::f64::consts::PI).ln() + (z + 0.5) * t.ln() - t + x.ln()
}

/// PMF of NegativeBinomial(r, p) where p = r / (r + μ).
pub fn nbinom_pmf(k: usize, mean: f64, r: f64) -> f64 {
    if mean < 0.0 || r <= 0.0 {
        return 0.0;
    }
    if mean == 0.0 {
        return if k == 0 { 1.0 } else { 0.0 };
    }
    let p = r / (r + mean);
    let log_binom = log_gamma(k as f64 + r) - log_gamma(k as f64 + 1.0) - log_gamma(r);
    let log_prob = log_binom + r * p.ln() + (k as f64) * (1.0 - p).ln();
    log_prob.exp()
}

pub fn build_nb_score_matrix(
    mean_home: f64,
    mean_away: f64,
    r_home: f64,
    r_away: f64,
    max_score: usize,
) -> Vec<Vec<f64>> {
    let mut matrix: Vec<Vec<f64>> = Vec::with_capacity(max_score + 1);
    for h in 0..=max_score {
        let ph = nbinom_pmf(h, mean_home, r_home);
        let mut row = Vec::with_capacity(max_score + 1);
        for a in 0..=max_score {
            row.push(ph * nbinom_pmf(a, mean_away, r_away));
        }
        matrix.push(row);
    }
    matrix
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pmf_sums_to_one() {
        let sum: f64 = (0..=50).map(|k| nbinom_pmf(k, 5.0, 3.0)).sum();
        assert!((sum - 1.0).abs() < 1e-6, "got {sum}");
    }

    #[test]
    fn mean_zero_is_delta_at_zero() {
        assert_eq!(nbinom_pmf(0, 0.0, 2.0), 1.0);
        assert_eq!(nbinom_pmf(1, 0.0, 2.0), 0.0);
    }

    #[test]
    fn large_r_converges_to_poisson() {
        // As r → ∞ NB ≈ Poisson
        let nb = nbinom_pmf(5, 3.0, 1e6);
        // Poisson(3.0).PMF(5) = e^-3 * 3^5 / 5! ≈ 0.1008
        assert!((nb - 0.1008).abs() < 0.002, "got {nb}");
    }
}
