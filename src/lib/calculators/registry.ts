// Central registry of all calculators. Each phase appends entries.
// The Calculators index page groups by category; CalculatorPage looks up by slug.

export type CalcCategory = "odds" | "sizing" | "lines" | "simulation" | "advanced";
export type CalcTier = 1 | 2 | 3;

export interface CalcEntry {
  slug: string;
  name: string;
  category: CalcCategory;
  tier: CalcTier;
  glyph: string;               // 1-3 char monogram for the index-grid icon
  blurb: string;               // 3-4 sentence "what is this / when to use it"
  blogSlug?: string;           // maps to docs/blog/{blogSlug}.mdx
  component: () => Promise<{ default: any }>;
}

// Base URL for the GitHub Pages docs site deployed by .github/workflows/pages.yml.
// Pages serves project pages at <user>.github.io/<repo>/.
export const DOCS_BASE_URL = "https://walrusquant.github.io/rust-bet-tracker";

export const CATEGORY_LABELS: Record<CalcCategory, string> = {
  odds: "Odds & probability",
  sizing: "Bet sizing & value",
  lines: "Lines & markets",
  simulation: "Simulations",
  advanced: "Advanced",
};

export const CATEGORY_KICKERS: Record<CalcCategory, string> = {
  odds: "Convert, compare, de-vig",
  sizing: "How much, how often",
  lines: "What's the true price?",
  simulation: "Run it many times",
  advanced: "Models, multis, middles",
};

export const CALCULATORS: CalcEntry[] = [
  // ---- Odds & probability ----
  {
    slug: "odds-converter",
    name: "Odds Converter",
    category: "odds",
    tier: 1,
    glyph: "OC",
    blurb: "Convert between American, decimal, fractional, and implied probability. Type any format, see them all. Essential for line-shopping between books that display odds differently.",
    blogSlug: "understanding-betting-odds",
    component: () => import("../../routes/calculators/OddsConverter.svelte"),
  },
  {
    slug: "sharp-implied",
    name: "Sharp Implied",
    category: "odds",
    tier: 1,
    glyph: "SI",
    blurb: "Devig a two-way moneyline to get each side's fair probability. Optionally add spread and total for a score projection. A sharp book's no-vig price is the closest thing to a true probability you can get.",
    blogSlug: "devig-methods-compared",
    component: () => import("../../routes/calculators/SharpImplied.svelte"),
  },
  {
    slug: "devig",
    name: "Devig",
    category: "odds",
    tier: 1,
    glyph: "DV",
    blurb: "Strip the book's margin from implied probabilities using five different methods (Equal Margin, Proportional, Shin, Odds Ratio, Logarithmic). Comparing methods tells you how sensitive your EV estimate is to the devig model.",
    blogSlug: "devig-methods-compared",
    component: () => import("../../routes/calculators/Devig.svelte"),
  },
  {
    slug: "hold",
    name: "Hold",
    category: "odds",
    tier: 1,
    glyph: "HD",
    blurb: "Calculate the book's built-in margin on a two-sided market. Standard -110/-110 runs about 4.76%. Under 4% is sharp; above 6% is retail-book territory.",
    blogSlug: "hold-vig-and-arbitrage",
    component: () => import("../../routes/calculators/Hold.svelte"),
  },
  {
    slug: "vig-comparison",
    name: "Vig Comparison",
    category: "odds",
    tier: 1,
    glyph: "VC",
    blurb: "Compare vig across multiple books on the same market. The lowest-vig book almost always has the sharpest line. Use this before you place to make sure you're getting the best available price.",
    blogSlug: "hold-vig-and-arbitrage",
    component: () => import("../../routes/calculators/VigComparison.svelte"),
  },

  // ---- Bet sizing & value ----
  {
    slug: "expected-value",
    name: "Expected Value",
    category: "sizing",
    tier: 1,
    glyph: "EV",
    blurb: "Compare your bet's price against its fair price. Positive EV means the book is paying more than the true probability warrants. Fill in fair odds every time you bet — it's the only way to know you've got an edge.",
    blogSlug: "measuring-your-edge",
    component: () => import("../../routes/calculators/EV.svelte"),
  },
  {
    slug: "kelly-criterion",
    name: "Kelly Criterion",
    category: "sizing",
    tier: 1,
    glyph: "KE",
    blurb: "Given your edge and bankroll, Kelly is the stake size that maximizes long-run growth. Full Kelly is aggressive; most pros use half or quarter Kelly to smooth out drawdowns without giving up much expected growth.",
    blogSlug: "kelly-criterion-guide",
    component: () => import("../../routes/calculators/Kelly.svelte"),
  },
  {
    slug: "parlay",
    name: "Parlay",
    category: "sizing",
    tier: 1,
    glyph: "PY",
    blurb: "Combine multiple legs into a single price. Payout is tempting; the combined win probability drops fast. Great for seeing exactly how much juice you're paying to lump legs together.",
    component: () => import("../../routes/calculators/Parlay.svelte"),
  },

  // ---- Lines & markets ----
  {
    slug: "arbitrage",
    name: "Arbitrage",
    category: "lines",
    tier: 1,
    glyph: "AR",
    blurb: "When two books price the same market inconsistently, you can stake on every outcome and lock in profit regardless of result. Enter each outcome's odds; if total implied probability is under 100%, you have an arb.",
    blogSlug: "hold-vig-and-arbitrage",
    component: () => import("../../routes/calculators/Arbitrage.svelte"),
  },
  {
    slug: "hedge",
    name: "Hedge",
    category: "lines",
    tier: 1,
    glyph: "HG",
    blurb: "You have a live position and want to de-risk. Enter your original bet plus the current hedge-side price — we'll show the stake that equalizes payouts and the guaranteed profit or loss.",
    component: () => import("../../routes/calculators/Hedge.svelte"),
  },
  {
    slug: "clv",
    name: "CLV",
    category: "lines",
    tier: 1,
    glyph: "CV",
    blurb: "Closing Line Value: compare what you got against the closing price. Consistently beating the close is the most reliable indicator that you're +EV long-term — even more so than win rate.",
    blogSlug: "measuring-your-edge",
    component: () => import("../../routes/calculators/CLV.svelte"),
  },
  {
    slug: "better-line",
    name: "Better Line",
    category: "lines",
    tier: 2,
    glyph: "BL",
    blurb: "Two books, same market, different lines. Which is the better bet? We back out each book's implied true line via normal CDF, compare, and tell you exactly how many points the edge is worth.",
    blogSlug: "better-line-cdf-analysis",
    component: () => import("../../routes/calculators/BetterLine.svelte"),
  },
  {
    slug: "alt-line-pricer",
    name: "Alt Line Pricer",
    category: "lines",
    tier: 2,
    glyph: "AL",
    blurb: "From a main spread or total + odds, derive the implied true line, then price fair probability and fair American odds at every alternate line in a range. Spot mispriced alts in seconds.",
    blogSlug: "alternate-line-pricing",
    component: () => import("../../routes/calculators/AltLinePricer.svelte"),
  },

  // ---- Simulations ----
  {
    slug: "risk-of-ruin",
    name: "Risk of Ruin",
    category: "simulation",
    tier: 2,
    glyph: "RR",
    blurb: "Monte Carlo of flat-bet bankroll paths given your edge, bet size, and bankroll. Tells you what fraction of paths end in ruin, the median survivor, and average max drawdown. Size bets with eyes open.",
    blogSlug: "bankroll-management-beyond-kelly",
    component: () => import("../../routes/calculators/RiskOfRuin.svelte"),
  },

  // ---- Advanced ----
  {
    slug: "bayesian",
    name: "Bayesian Update",
    category: "advanced",
    tier: 2,
    glyph: "BA",
    blurb: "Combine a sharp market line (prior) with your model's probability (evidence) via a Beta-Binomial update. Weights come from pseudo-counts — how much confidence you give each source.",
    blogSlug: "bayesian-odds-explained",
    component: () => import("../../routes/calculators/Bayesian.svelte"),
  },
  {
    slug: "regression-to-mean",
    name: "Regression to the Mean",
    category: "advanced",
    tier: 2,
    glyph: "RM",
    blurb: "Small-sample rate stats overstate true talent. Regression pulls observed rates toward league average based on sample size — a player hitting .400 over 40 at-bats is not a true .400 hitter.",
    blogSlug: "regression-to-the-mean",
    component: () => import("../../routes/calculators/RegressionToMean.svelte"),
  },
  {
    slug: "middle-finder",
    name: "Middle Finder",
    category: "advanced",
    tier: 3,
    glyph: "MF",
    blurb: "Two positions on opposite sides of a spread or total. A 'middle' has a gap where both bets win; a 'trap' has a gap where both lose. We compute the gap probability and EV so you know exactly what you're getting.",
    blogSlug: "middle-finder-guide",
    component: () => import("../../routes/calculators/MiddleFinder.svelte"),
  },
  {
    slug: "teaser-ev",
    name: "Teaser EV",
    category: "advanced",
    tier: 3,
    glyph: "TE",
    blurb: "Analyze an NFL or NCAAF teaser by backing out each leg's true line, computing the teased cover probability, and comparing book price to fair. Flags crossings of key numbers 3, 7, 10, 14.",
    blogSlug: "teaser-ev-analysis",
    component: () => import("../../routes/calculators/TeaserEV.svelte"),
  },
  {
    slug: "poisson-match",
    name: "Poisson Match",
    category: "simulation",
    tier: 3,
    glyph: "PO",
    blurb: "Given expected goals (λ) per side, model the joint score matrix via independent Poisson and derive win probabilities, every spread cover, every total, and top scorelines. Best for low-scoring sports: soccer, hockey, MLB.",
    blogSlug: "poisson-match-prediction",
    component: () => import("../../routes/calculators/PoissonMatch.svelte"),
  },
  {
    slug: "nbinom-match",
    name: "Neg. Binomial Match",
    category: "simulation",
    tier: 3,
    glyph: "NB",
    blurb: "Like Poisson but with overdispersion — variance greater than the mean, so blowouts happen more than pure Poisson predicts. Useful for NFL, NBA, and any market where fat-tailed outcomes dominate.",
    blogSlug: "negative-binomial-match-prediction",
    component: () => import("../../routes/calculators/NBinomMatch.svelte"),
  },
  {
    slug: "prop-simulator",
    name: "Player Prop Simulator",
    category: "simulation",
    tier: 3,
    glyph: "PS",
    blurb: "Pick a distribution that matches your stat (Poisson for counts, LogNormal for yards, Gamma for continuous), set mean and variance, sample to estimate over/under probability at your line. Use when no clean analytical formula fits.",
    blogSlug: "player-prop-simulation",
    component: () => import("../../routes/calculators/PropSimulator.svelte"),
  },
];

export function findBySlug(slug: string): CalcEntry | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

export function byCategory(): Record<CalcCategory, CalcEntry[]> {
  const groups: Record<CalcCategory, CalcEntry[]> = {
    odds: [],
    sizing: [],
    lines: [],
    simulation: [],
    advanced: [],
  };
  for (const c of CALCULATORS) {
    groups[c.category].push(c);
  }
  return groups;
}

export const CATEGORY_ORDER: CalcCategory[] = [
  "odds",
  "sizing",
  "lines",
  "simulation",
  "advanced",
];
