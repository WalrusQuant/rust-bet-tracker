//! Bayesian update for win probability via Beta-Binomial conjugate prior.

#[derive(Debug, Clone)]
pub struct BayesianProbResult {
    pub prior_alpha: f64,
    pub prior_beta: f64,
    pub posterior_alpha: f64,
    pub posterior_beta: f64,
    pub post_prob_a: f64,
    pub post_prob_b: f64,
    pub mkt_fair_a: f64,
    pub mkt_fair_b: f64,
}

/// Beta-Binomial conjugate: prior = sharp market converted to pseudo-counts,
/// evidence = model probability treated as N model trials.
pub fn bayesian_prob_update(
    mkt_fair_a: f64,
    model_prob_a: f64,
    market_n: f64,
    model_n: f64,
) -> BayesianProbResult {
    let prior_alpha = mkt_fair_a * market_n;
    let prior_beta = (1.0 - mkt_fair_a) * market_n;

    let posterior_alpha = prior_alpha + model_prob_a * model_n;
    let posterior_beta = prior_beta + (1.0 - model_prob_a) * model_n;

    let post_a = posterior_alpha / (posterior_alpha + posterior_beta);

    BayesianProbResult {
        prior_alpha,
        prior_beta,
        posterior_alpha,
        posterior_beta,
        post_prob_a: post_a,
        post_prob_b: 1.0 - post_a,
        mkt_fair_a,
        mkt_fair_b: 1.0 - mkt_fair_a,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_evidence_preserves_prior() {
        let r = bayesian_prob_update(0.6, 0.75, 100.0, 0.0);
        assert!((r.post_prob_a - 0.6).abs() < 1e-12);
    }

    #[test]
    fn equal_weight_averages_prior_and_evidence() {
        // prior=0.5, evidence=0.7, equal N → posterior = 0.6
        let r = bayesian_prob_update(0.5, 0.7, 100.0, 100.0);
        assert!((r.post_prob_a - 0.6).abs() < 1e-12);
    }

    #[test]
    fn stronger_evidence_pulls_further() {
        let light = bayesian_prob_update(0.5, 0.7, 100.0, 50.0);
        let heavy = bayesian_prob_update(0.5, 0.7, 100.0, 200.0);
        assert!(heavy.post_prob_a > light.post_prob_a);
    }
}
