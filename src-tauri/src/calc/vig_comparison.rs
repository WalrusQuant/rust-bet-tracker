//! Compare vig across multiple books for the same two-sided market.

#[derive(Debug, Clone)]
pub struct BookEntry {
    pub name: String,
    pub implied_a: f64,
    pub implied_b: f64,
}

#[derive(Debug, Clone)]
pub struct BookResult {
    pub name: String,
    pub implied_a: f64,
    pub implied_b: f64,
    pub total_implied: f64,
    pub vig_pct: f64,
    pub no_vig_prob_a: f64,
    pub no_vig_prob_b: f64,
}

/// Analyze vig across a set of books. Skips invalid entries. Result sorted
/// ascending by vig (sharpest first).
pub fn compare_vig(books: &[BookEntry]) -> Vec<BookResult> {
    let mut out: Vec<BookResult> = books
        .iter()
        .filter(|b| b.implied_a > 0.0 && b.implied_b > 0.0)
        .map(|b| {
            let total = b.implied_a + b.implied_b;
            BookResult {
                name: b.name.clone(),
                implied_a: b.implied_a,
                implied_b: b.implied_b,
                total_implied: total,
                vig_pct: (total - 1.0) * 100.0,
                no_vig_prob_a: b.implied_a / total,
                no_vig_prob_b: b.implied_b / total,
            }
        })
        .collect();
    out.sort_by(|a, b| a.vig_pct.partial_cmp(&b.vig_pct).unwrap_or(std::cmp::Ordering::Equal));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sorts_sharpest_first() {
        let books = vec![
            BookEntry { name: "A".into(), implied_a: 0.525, implied_b: 0.525 }, // vig 5%
            BookEntry { name: "B".into(), implied_a: 0.515, implied_b: 0.515 }, // vig 3%
            BookEntry { name: "C".into(), implied_a: 0.500, implied_b: 0.500 }, // vig 0%
        ];
        let results = compare_vig(&books);
        assert_eq!(results[0].name, "C");
        assert_eq!(results[1].name, "B");
        assert_eq!(results[2].name, "A");
    }

    #[test]
    fn filters_invalid_rows() {
        let books = vec![
            BookEntry { name: "ok".into(), implied_a: 0.5, implied_b: 0.5 },
            BookEntry { name: "bad".into(), implied_a: 0.0, implied_b: 0.5 },
        ];
        assert_eq!(compare_vig(&books).len(), 1);
    }
}
