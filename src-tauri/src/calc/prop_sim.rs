//! Player Prop Simulator — Monte Carlo over distribution families (Poisson,
//! NegativeBinomial, Gamma, LogNormal) to estimate over/under probability
//! for a player's prop line.

use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use rand_distr::{Distribution, Gamma, LogNormal, Poisson};

#[derive(Debug, Clone, Copy)]
pub enum DistKind {
    Poisson,
    NegativeBinomial,
    Gamma,
    LogNormal,
}

pub fn parse_dist(s: &str) -> Option<DistKind> {
    match s {
        "poisson" => Some(DistKind::Poisson),
        "nbinom" => Some(DistKind::NegativeBinomial),
        "gamma" => Some(DistKind::Gamma),
        "lognormal" => Some(DistKind::LogNormal),
        _ => None,
    }
}

#[derive(Debug, Clone)]
pub struct PropSimResult {
    pub samples: usize,
    pub mean: f64,
    pub median: f64,
    pub std_dev: f64,
    pub prob_over: f64,     // P(X > line)
    pub prob_under: f64,    // P(X < line)
    pub prob_push: f64,     // P(X == line) — relevant for integer stats
    pub histogram: Vec<(f64, usize)>, // (bucket_center, count)
}

fn sample_once(kind: DistKind, mu: f64, var_mult: f64, rng: &mut ChaCha8Rng) -> f64 {
    match kind {
        DistKind::Poisson => {
            // statrs::Poisson requires lambda > 0
            if mu <= 0.0 {
                return 0.0;
            }
            let p = Poisson::new(mu).expect("valid poisson");
            p.sample(rng)
        }
        DistKind::NegativeBinomial => {
            // Mean-variance parameterization via Gamma-Poisson mixture:
            // X | λ ~ Poisson(λ), λ ~ Gamma(r, (1-p)/p), where Var(X) = mu * var_mult.
            // mu * var_mult = mu + mu^2 / r  →  r = mu / (var_mult - 1)
            if mu <= 0.0 || var_mult <= 1.0 {
                // fall back to Poisson behavior
                if mu <= 0.0 {
                    return 0.0;
                }
                return Poisson::new(mu).expect("poisson").sample(rng);
            }
            let r = mu / (var_mult - 1.0);
            let scale = var_mult - 1.0;
            // λ ~ Gamma(r, scale)
            let g = Gamma::new(r, scale).expect("valid gamma").sample(rng);
            Poisson::new(g.max(1e-9)).expect("valid poisson").sample(rng)
        }
        DistKind::Gamma => {
            // Mean=mu, Var=var_mult*mu → shape=mu/var_mult, scale=var_mult
            if mu <= 0.0 || var_mult <= 0.0 {
                return 0.0;
            }
            let shape = mu / var_mult;
            let scale = var_mult;
            Gamma::new(shape.max(1e-3), scale).expect("valid gamma").sample(rng)
        }
        DistKind::LogNormal => {
            // Approximate mean=mu with chosen sdlog.
            // If X = exp(μ_ln + σ_ln Z): E[X] = exp(μ_ln + σ²/2).
            // Set σ = sqrt(ln(1 + var_mult / mu)) which gives var_mult * mu variance.
            if mu <= 0.0 {
                return 0.0;
            }
            let sdlog = (1.0 + (var_mult / mu).max(1e-6)).ln().sqrt();
            let meanlog = mu.ln() - 0.5 * sdlog * sdlog;
            LogNormal::new(meanlog, sdlog).expect("valid lognormal").sample(rng)
        }
    }
}

pub fn simulate_prop(
    kind: DistKind,
    mu: f64,
    var_mult: f64,
    line: f64,
    num_sims: usize,
    seed: Option<u64>,
) -> PropSimResult {
    let mut rng: ChaCha8Rng = match seed {
        Some(s) => ChaCha8Rng::seed_from_u64(s),
        None => ChaCha8Rng::from_entropy(),
    };
    let mut samples: Vec<f64> = Vec::with_capacity(num_sims);
    let mut over = 0_usize;
    let mut under = 0_usize;
    let mut push = 0_usize;
    let mut sum = 0.0_f64;
    let mut sum_sq = 0.0_f64;

    for _ in 0..num_sims {
        let x = sample_once(kind, mu, var_mult, &mut rng);
        samples.push(x);
        sum += x;
        sum_sq += x * x;
        if (x - line).abs() < 1e-9 {
            push += 1;
        } else if x > line {
            over += 1;
        } else {
            under += 1;
        }
    }

    let mean = sum / num_sims as f64;
    let variance = (sum_sq / num_sims as f64) - mean * mean;
    let std_dev = variance.max(0.0).sqrt();

    let mut sorted = samples.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = if sorted.is_empty() { 0.0 } else { sorted[sorted.len() / 2] };

    // Histogram: 25 buckets over min..max
    let histogram = if sorted.is_empty() {
        vec![]
    } else {
        let lo = sorted[0];
        let hi = sorted[sorted.len() - 1];
        let span = (hi - lo).max(1.0);
        let n_buckets = 25;
        let width = span / n_buckets as f64;
        let mut counts = vec![0_usize; n_buckets];
        for s in &sorted {
            let mut idx = ((*s - lo) / width) as usize;
            if idx >= n_buckets {
                idx = n_buckets - 1;
            }
            counts[idx] += 1;
        }
        counts
            .into_iter()
            .enumerate()
            .map(|(i, c)| (lo + (i as f64 + 0.5) * width, c))
            .collect()
    };


    PropSimResult {
        samples: num_sims,
        mean,
        median,
        std_dev,
        prob_over: over as f64 / num_sims as f64,
        prob_under: under as f64 / num_sims as f64,
        prob_push: push as f64 / num_sims as f64,
        histogram,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn poisson_mean_close_to_mu() {
        let r = simulate_prop(DistKind::Poisson, 3.0, 1.0, 2.5, 20_000, Some(42));
        assert!((r.mean - 3.0).abs() < 0.1);
    }

    #[test]
    fn deterministic_with_seed() {
        let a = simulate_prop(DistKind::LogNormal, 250.0, 80.0, 249.5, 10_000, Some(7));
        let b = simulate_prop(DistKind::LogNormal, 250.0, 80.0, 249.5, 10_000, Some(7));
        assert!((a.prob_over - b.prob_over).abs() < 1e-12);
    }

    #[test]
    fn over_plus_under_plus_push_is_one() {
        let r = simulate_prop(DistKind::Poisson, 1.5, 1.0, 1.5, 5_000, Some(3));
        assert!((r.prob_over + r.prob_under + r.prob_push - 1.0).abs() < 1e-9);
    }
}
