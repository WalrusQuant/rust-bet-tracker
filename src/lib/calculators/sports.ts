// Sport defaults for spread/total modeling standard deviations.
// Ported from bettor-calculator/src/lib/math/sportDefaults.ts.

export interface SportConfig {
  label: string;
  spread_std: number;
  total_std: number;
  three_way: boolean; // moneyline has draw
}

export const SPORT_DEFAULTS: Record<string, SportConfig> = {
  nba:    { label: "NBA",    spread_std: 14.5, total_std: 22.2, three_way: false },
  nfl:    { label: "NFL",    spread_std: 14.2, total_std: 13.9, three_way: false },
  ncaab:  { label: "NCAAB",  spread_std: 16.6, total_std: 19.7, three_way: false },
  ncaaf:  { label: "NCAAF",  spread_std: 22.6, total_std: 17.9, three_way: false },
  nhl:    { label: "NHL",    spread_std: 2.49, total_std: 2.29, three_way: false },
  mlb:    { label: "MLB",    spread_std: 4.48, total_std: 4.61, three_way: false },
  soccer: { label: "Soccer", spread_std: 1.9,  total_std: 1.66, three_way: true  },
};

export const SPORT_OPTIONS = Object.entries(SPORT_DEFAULTS).map(([k, v]) => ({
  value: k,
  label: v.label,
}));
