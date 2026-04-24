//! Regression to the mean — Bayesian shrinkage for small-sample rate stats.

#[derive(Debug, Clone)]
pub struct RegressionResult {
    pub observed: f64,
    pub baseline: f64,
    pub regressed: f64,
    pub weight: f64,         // 0..1 — weight placed on observed
    pub ci_low: f64,
    pub ci_high: f64,
}

pub fn regression_weight(sample_size: f64, regression_constant: f64) -> f64 {
    if sample_size <= 0.0 || regression_constant <= 0.0 {
        return 0.0;
    }
    sample_size / (sample_size + regression_constant)
}

pub fn regress_to_mean(
    observed: f64,
    baseline: f64,
    sample_size: f64,
    regression_constant: f64,
) -> f64 {
    let w = regression_weight(sample_size, regression_constant);
    baseline + (observed - baseline) * w
}

/// 90% confidence interval using a normal-normal posterior approximation.
pub fn confidence_interval(
    observed: f64,
    baseline: f64,
    sample_size: f64,
    regression_constant: f64,
) -> (f64, f64) {
    let regressed = regress_to_mean(observed, baseline, sample_size, regression_constant);
    let p = regressed.clamp(0.001, 0.999);
    let variance = p * (1.0 - p) / (sample_size + regression_constant);
    let se = variance.sqrt();
    let z = 1.645_f64; // 90% CI
    (
        (regressed - z * se).max(0.0),
        (regressed + z * se).min(1.0),
    )
}

pub fn calculate(
    observed: f64,
    baseline: f64,
    sample_size: f64,
    regression_constant: f64,
) -> RegressionResult {
    let regressed = regress_to_mean(observed, baseline, sample_size, regression_constant);
    let weight = regression_weight(sample_size, regression_constant);
    let (lo, hi) = confidence_interval(observed, baseline, sample_size, regression_constant);
    RegressionResult {
        observed,
        baseline,
        regressed,
        weight,
        ci_low: lo,
        ci_high: hi,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn half_weight_at_regression_constant() {
        let w = regression_weight(100.0, 100.0);
        assert!((w - 0.5).abs() < 1e-12);
    }

    #[test]
    fn zero_sample_means_all_baseline() {
        let r = regress_to_mean(0.4, 0.25, 0.0, 100.0);
        assert!((r - 0.25).abs() < 1e-12);
    }

    #[test]
    fn infinite_sample_means_all_observed() {
        let r = regress_to_mean(0.4, 0.25, 1e12, 100.0);
        assert!((r - 0.4).abs() < 1e-4);
    }
}
