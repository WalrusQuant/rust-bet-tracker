// Utility functions for sports betting odds calculations

/**
 * Convert American odds to implied probability
 */
export function americanToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Calculate profit from American odds and stake
 */
export function calculateProfit(odds: number, stake: number): number {
  if (odds > 0) {
    return stake * (odds / 100);
  } else {
    return stake * (100 / Math.abs(odds));
  }
}

/**
 * Calculate Expected Value (EV) percentage
 * EV = (Win Probability × Profit) - (Loss Probability × Stake)
 */
export function calculateEV(betOdds: number, fairOdds: number, stake: number): number {
  const fairProbability = americanToImpliedProbability(fairOdds);
  const profit = calculateProfit(betOdds, stake);
  const lossProbability = 1 - fairProbability;
  
  const ev = (fairProbability * profit) - (lossProbability * stake);
  return (ev / stake) * 100; // Return as percentage
}

/**
 * Calculate Closing Line Value (CLV)
 * CLV = difference between bet odds and closing odds in percentage terms
 */
export function calculateCLV(betOdds: number, closingOdds: number): number {
  const betProbability = americanToImpliedProbability(betOdds);
  const closingProbability = americanToImpliedProbability(closingOdds);
  
  // CLV as percentage improvement
  return ((closingProbability - betProbability) / betProbability) * 100;
}

/**
 * Format American odds with + prefix for positive odds
 */
export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}
