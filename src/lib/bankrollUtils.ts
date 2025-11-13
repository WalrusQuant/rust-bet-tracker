import { americanToImpliedProbability, calculateEV } from './oddsUtils';

interface BankrollSettings {
  starting_bankroll: number;
  unit_sizing_method: 'fixed_percent' | 'kelly' | 'fixed_amount';
  unit_size_value: number;
  kelly_fraction: 'full' | 'half' | 'quarter';
}

/**
 * Calculate recommended bet size based on bankroll settings
 */
export function calculateRecommendedStake(
  currentBankroll: number,
  settings: BankrollSettings,
  betOdds?: number,
  fairOdds?: number
): { amount: number; explanation: string } {
  const { unit_sizing_method, unit_size_value, kelly_fraction } = settings;

  switch (unit_sizing_method) {
    case 'fixed_amount':
      return {
        amount: unit_size_value,
        explanation: `Fixed amount of $${unit_size_value.toFixed(2)}`
      };

    case 'fixed_percent':
      const percentAmount = (currentBankroll * unit_size_value) / 100;
      return {
        amount: percentAmount,
        explanation: `${unit_size_value}% of $${currentBankroll.toFixed(2)} bankroll`
      };

    case 'kelly': {
      // Kelly requires fair odds to calculate EV
      if (!betOdds || !fairOdds) {
        // Fallback to fixed percent if no fair odds provided
        const fallbackAmount = (currentBankroll * 2) / 100;
        return {
          amount: fallbackAmount,
          explanation: `2% of bankroll (fair odds needed for Kelly)`
        };
      }

      // Calculate Kelly percentage
      const fairProbability = americanToImpliedProbability(fairOdds);
      const betProbability = americanToImpliedProbability(betOdds);
      
      // Kelly formula: f = (bp - q) / b
      // where b = decimal odds - 1, p = win probability, q = lose probability
      const b = betOdds > 0 ? betOdds / 100 : 100 / Math.abs(betOdds);
      const p = fairProbability;
      const q = 1 - p;
      
      let kellyPercent = ((b * p - q) / b) * 100;
      
      // Apply Kelly fraction
      const fractionMultiplier = kelly_fraction === 'full' ? 1 : kelly_fraction === 'half' ? 0.5 : 0.25;
      kellyPercent = kellyPercent * fractionMultiplier;
      
      // Never bet more than 10% of bankroll (safety cap)
      kellyPercent = Math.min(Math.max(kellyPercent, 0), 10);
      
      const kellyAmount = (currentBankroll * kellyPercent) / 100;
      const ev = calculateEV(betOdds, fairOdds, kellyAmount);
      const evPercent = (ev / kellyAmount) * 100;
      
      const fractionName = kelly_fraction === 'full' ? 'Full' : kelly_fraction === 'half' ? 'Half' : 'Quarter';
      
      return {
        amount: kellyAmount,
        explanation: `${fractionName} Kelly based on ${evPercent >= 0 ? '+' : ''}${evPercent.toFixed(1)}% EV`
      };
    }

    default:
      return {
        amount: 0,
        explanation: 'Unknown unit sizing method'
      };
  }
}
