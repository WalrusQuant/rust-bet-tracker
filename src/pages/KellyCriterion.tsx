import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const KellyCriterion = () => {
  const [bankroll, setBankroll] = useState("");
  const [odds, setOdds] = useState("");
  const [winProbability, setWinProbability] = useState("");
  const [result, setResult] = useState<any>(null);

  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  const calculateKelly = () => {
    const bankrollNum = parseFloat(bankroll);
    const oddsNum = parseFloat(odds);
    const winProb = parseFloat(winProbability) / 100;

    if (isNaN(bankrollNum) || isNaN(oddsNum) || isNaN(winProb)) return;
    if (winProb <= 0 || winProb >= 1) return;

    const decimalOdds = americanToDecimal(oddsNum);
    const b = decimalOdds - 1; // net odds received on the wager
    const p = winProb; // probability of winning
    const q = 1 - p; // probability of losing

    // Kelly formula: f = (bp - q) / b
    const kellyFraction = (b * p - q) / b;
    const kellyPercent = kellyFraction * 100;
    const fullKellyBet = bankrollNum * kellyFraction;
    const halfKellyBet = fullKellyBet * 0.5;
    const quarterKellyBet = fullKellyBet * 0.25;

    setResult({
      kellyPercent,
      fullKellyBet,
      halfKellyBet,
      quarterKellyBet,
      shouldBet: kellyFraction > 0
    });
  };

  const handleClear = () => {
    setBankroll("");
    setOdds("");
    setWinProbability("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Kelly Criterion Calculator</CardTitle>
            <CardDescription className="text-base">
              Calculate the optimal bet size using the Kelly Criterion formula. This helps you 
              maximize long-term growth while managing risk based on your edge and bankroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bankroll">Bankroll ($)</Label>
              <Input
                id="bankroll"
                type="number"
                step="0.01"
                placeholder="e.g., 10000"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Your total betting bankroll</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds">Odds (American)</Label>
              <Input
                id="odds"
                type="number"
                placeholder="e.g., +150"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">The odds you're receiving</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g., 45"
                value={winProbability}
                onChange={(e) => setWinProbability(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Your estimated probability of winning (0-100%)</p>
            </div>

            <Button onClick={calculateKelly} className="w-full">
              Calculate Kelly Bet
            </Button>

            {result && (
              <div className="space-y-4">
                {result.shouldBet ? (
                  <>
                    <div className="p-4 bg-secondary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Kelly Percentage</p>
                      <p className="text-3xl font-bold text-secondary">
                        {result.kellyPercent.toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Of your bankroll
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="text-sm text-muted-foreground">Full Kelly (Aggressive)</p>
                        <p className="text-2xl font-bold text-primary">
                          ${result.fullKellyBet.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="text-sm text-muted-foreground">Half Kelly (Recommended)</p>
                        <p className="text-2xl font-bold text-primary">
                          ${result.halfKellyBet.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="text-sm text-muted-foreground">Quarter Kelly (Conservative)</p>
                        <p className="text-2xl font-bold text-primary">
                          ${result.quarterKellyBet.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Most professionals use half Kelly to reduce volatility while maintaining good growth.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-destructive/20 rounded-lg">
                    <p className="text-lg font-bold text-destructive">No Bet Recommended</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Kelly Criterion suggests not betting. Your estimated edge is not favorable at these odds.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleClear} variant="outline" className="w-full">
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KellyCriterion;
