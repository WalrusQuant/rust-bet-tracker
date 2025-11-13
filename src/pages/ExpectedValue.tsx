import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ExpectedValue = () => {
  const [odds, setOdds] = useState("");
  const [winProbability, setWinProbability] = useState("");
  const [stake, setStake] = useState("");
  const [result, setResult] = useState<any>(null);

  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  const calculateEV = () => {
    const oddsNum = parseFloat(odds);
    const winProb = parseFloat(winProbability) / 100;
    const stakeNum = parseFloat(stake);

    if (isNaN(oddsNum) || isNaN(winProb) || isNaN(stakeNum)) return;
    if (winProb <= 0 || winProb >= 1) return;

    const decimalOdds = americanToDecimal(oddsNum);
    const loseProb = 1 - winProb;

    // Expected value = (probability of winning × amount won per bet) - (probability of losing × amount lost per bet)
    const winAmount = stakeNum * (decimalOdds - 1); // profit if win
    const loseAmount = stakeNum; // loss if lose

    const ev = (winProb * winAmount) - (loseProb * loseAmount);
    const evPercent = (ev / stakeNum) * 100;
    const roi = evPercent;

    // Break-even probability (what probability you need to break even)
    const impliedProb = 1 / decimalOdds;
    const edge = winProb - impliedProb;

    setResult({
      ev,
      evPercent,
      roi,
      isPositive: ev > 0,
      breakEvenProb: impliedProb * 100,
      edge: edge * 100,
      impliedOddsProb: impliedProb * 100
    });
  };

  const handleClear = () => {
    setOdds("");
    setWinProbability("");
    setStake("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Expected Value (EV) Calculator</CardTitle>
            <CardDescription className="text-base">
              Calculate the expected value of a bet to determine if it's profitable in the long run. 
              Positive EV bets are profitable over time, while negative EV bets will lose money.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="odds">Odds (American)</Label>
              <Input
                id="odds"
                type="number"
                placeholder="e.g., +150 or -110"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">The odds being offered</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Your Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g., 55"
                value={winProbability}
                onChange={(e) => setWinProbability(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Your estimated probability that this bet wins (0-100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stake">Stake ($)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Amount you plan to bet</p>
            </div>

            <Button onClick={calculateEV} className="w-full">
              Calculate Expected Value
            </Button>

            {result && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${result.isPositive ? 'bg-secondary/20' : 'bg-destructive/20'}`}>
                  <p className="text-sm text-muted-foreground mb-1">Expected Value (EV)</p>
                  <p className="text-4xl font-bold" style={{ color: result.isPositive ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))' }}>
                    {result.ev >= 0 ? '+' : ''}${result.ev.toFixed(2)}
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {result.evPercent >= 0 ? '+' : ''}{result.evPercent.toFixed(2)}% ROI
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {result.isPositive 
                      ? "✓ Positive EV - This is a profitable bet long-term" 
                      : "✗ Negative EV - This bet will lose money long-term"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Your Edge</p>
                    <p className="text-xl font-bold text-primary">
                      {result.edge >= 0 ? '+' : ''}{result.edge.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Break-even %</p>
                    <p className="text-xl font-bold text-primary">
                      {result.breakEvenProb.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Your probability:</span> {parseFloat(winProbability).toFixed(1)}%
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Implied odds probability:</span> {result.impliedOddsProb.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You have an edge when your probability is higher than the implied odds probability.
                  </p>
                </div>
              </div>
            )}

            <Button onClick={handleClear} variant="outline" className="w-full">
              Clear
            </Button>
          </CardContent>
        </Card>

        {/* Educational Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Expected Value: The Only Bet That Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Expected Value (EV) is the average amount you expect to win or lose per bet over the long run. It's the single most important concept in sports betting.
            </p>
            
            <div>
              <p className="font-semibold text-foreground mb-2">The formula:</p>
              <p>
                EV = (Win Probability × Profit) - (Lose Probability × Stake)
              </p>
              <p className="mt-2">
                <span className="font-semibold text-foreground">Positive EV (+EV):</span> You expect to profit long-term. These are the only bets you should make.
              </p>
              <p>
                <span className="font-semibold text-foreground">Negative EV (-EV):</span> You expect to lose long-term. This is what recreational bettors bet into.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Example:</p>
              <p>
                You find a bet at +200 (3.00 decimal) that you estimate has a 40% chance to win.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>EV = (0.40 × $200) - (0.60 × $100) = $80 - $60 = +$20 EV</li>
                <li>On average, this $100 bet will profit $20 long-term. That's a +20% EV bet.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">The paradox:</p>
              <p>
                You can lose +EV bets and win -EV bets. A +20% EV bet still loses 60% of the time. The key is volume - make 100 of these bets and you'll likely be very profitable.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Where EV comes from:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Better information (injury news, weather, lineup changes)</li>
                <li>Better models (your probability estimate is sharper than the market)</li>
                <li>Line shopping (finding the best available odds)</li>
                <li>Market inefficiencies (low-limit sports, props, live betting)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">The professional approach:</p>
              <p>
                Track EV on every bet. Ignore short-term W/L. Focus on consistently finding and betting +EV opportunities. Long-term profit is guaranteed with enough volume.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm">
                Track your EV automatically with{" "}
                <Link to="/bet-tracker" className="text-primary hover:underline font-semibold">
                  WalrusQuant Bet Tracker
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpectedValue;
