//! Standard-normal CDF and inverse. Thin wrappers over `statrs`.

use statrs::distribution::{ContinuousCDF, Normal};

fn standard() -> Normal {
    Normal::new(0.0, 1.0).expect("valid standard normal")
}

/// Φ(z) — cumulative distribution function of the standard normal.
pub fn normal_cdf(z: f64) -> f64 {
    if z.is_nan() {
        return f64::NAN;
    }
    if !z.is_finite() {
        return if z > 0.0 { 1.0 } else { 0.0 };
    }
    standard().cdf(z)
}

/// Φ⁻¹(p) — inverse of the standard-normal CDF.
pub fn inverse_normal_cdf(p: f64) -> f64 {
    if p <= 0.0 {
        return f64::NEG_INFINITY;
    }
    if p >= 1.0 {
        return f64::INFINITY;
    }
    standard().inverse_cdf(p)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx(a: f64, b: f64, tol: f64) {
        assert!((a - b).abs() < tol, "{a} !~= {b}");
    }

    #[test]
    fn normal_cdf_symmetry() {
        approx(normal_cdf(0.0), 0.5, 1e-12);
        approx(normal_cdf(1.0) + normal_cdf(-1.0), 1.0, 1e-12);
    }

    #[test]
    fn normal_cdf_tabulated() {
        // Known CDF values
        approx(normal_cdf(-1.96), 0.025, 1e-4);
        approx(normal_cdf(1.96), 0.975, 1e-4);
        approx(normal_cdf(1.645), 0.95, 1e-3);
    }

    #[test]
    fn inverse_round_trip() {
        for p in [0.1f64, 0.25, 0.5, 0.75, 0.9, 0.99] {
            let z = inverse_normal_cdf(p);
            approx(normal_cdf(z), p, 1e-8);
        }
    }
}
