// Regression-to-mean defaults per sport + stat.
// Ported verbatim from bettor-calculator/src/lib/math/regressionConfig.ts.

export interface RegressionStatConfig {
  label: string;
  regression_constant: number;
  league_average: number;
  default_observed: number;
  default_sample_size: number;
  unit: string;
  sample_unit: string;
}

export interface RegressionSportConfig {
  label: string;
  stats: Record<string, RegressionStatConfig>;
}

export const REGRESSION_SPORTS: Record<string, RegressionSportConfig> = {
  mlb: {
    label: "MLB",
    stats: {
      avg:      { label: "Batting Average", regression_constant: 910, league_average: 0.245, default_observed: 0.320, default_sample_size: 100, unit: "AVG", sample_unit: "PA" },
      hr_rate:  { label: "HR Rate",         regression_constant: 170, league_average: 0.035, default_observed: 0.055, default_sample_size: 100, unit: "HR/PA", sample_unit: "PA" },
      k_rate:   { label: "K Rate",          regression_constant:  60, league_average: 0.225, default_observed: 0.180, default_sample_size:  50, unit: "K%", sample_unit: "PA" },
      babip:    { label: "BABIP",           regression_constant: 820, league_average: 0.300, default_observed: 0.370, default_sample_size: 100, unit: "BABIP", sample_unit: "BIP" },
      woba:     { label: "wOBA",            regression_constant: 320, league_average: 0.315, default_observed: 0.370, default_sample_size: 100, unit: "wOBA", sample_unit: "PA" },
    },
  },
  nba: {
    label: "NBA",
    stats: {
      fg_pct:    { label: "FG%",   regression_constant: 600, league_average: 0.461, default_observed: 0.520, default_sample_size: 100, unit: "FG%", sample_unit: "FGA" },
      three_pct: { label: "3PT%",  regression_constant: 750, league_average: 0.362, default_observed: 0.420, default_sample_size: 100, unit: "3P%", sample_unit: "3PA" },
      ft_pct:    { label: "FT%",   regression_constant: 300, league_average: 0.775, default_observed: 0.850, default_sample_size:  80, unit: "FT%", sample_unit: "FTA" },
    },
  },
  nfl: {
    label: "NFL",
    stats: {
      comp_pct: { label: "Completion %", regression_constant: 400, league_average: 0.645, default_observed: 0.710, default_sample_size: 100, unit: "CMP%", sample_unit: "att" },
      td_rate:  { label: "TD Rate",      regression_constant: 350, league_average: 0.045, default_observed: 0.065, default_sample_size: 100, unit: "TD%", sample_unit: "att" },
    },
  },
  nhl: {
    label: "NHL",
    stats: {
      save_pct:     { label: "Save %",      regression_constant: 1500, league_average: 0.910, default_observed: 0.935, default_sample_size: 400, unit: "SV%", sample_unit: "shots" },
      shooting_pct: { label: "Shooting %",  regression_constant:  150, league_average: 0.095, default_observed: 0.140, default_sample_size:  50, unit: "SH%", sample_unit: "shots" },
    },
  },
  soccer: {
    label: "Soccer",
    stats: {
      goals_per_90: { label: "Goals/90", regression_constant: 34, league_average: 0.035, default_observed: 0.060, default_sample_size: 10, unit: "G/90",  sample_unit: "matches" },
      xg_per_90:    { label: "xG/90",    regression_constant: 34, league_average: 0.040, default_observed: 0.055, default_sample_size: 10, unit: "xG/90", sample_unit: "matches" },
    },
  },
};
