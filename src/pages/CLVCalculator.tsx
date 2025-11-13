import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatAmericanOdds, americanToImpliedProbability, calculateProfit } from "@/lib/oddsUtils";
import { NavLink } from "@/components/NavLink";

const CLVCalculator = () => {
  const [yourOdds, setYourOdds] = useState<string>("");
  const [closingOdds, setClosingOdds] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("");
  const [result, setResult] = useState<{
    clvPercent: number;
    yourProbability: number;
    closingProbability: number;
    evDifference: number | null;
    isPositive: boolean;
  } | null>(null);

  const calculateCLV = () => {
    const yourOddsNum = parseInt(yourOdds);
    const closingOddsNum = parseInt(closingOdds);

    if (isNaN(yourOddsNum) || isNaN(closingOddsNum)) {
      return;
    }

    const yourProb = americanToImpliedProbability(yourOddsNum);
    const closingProb = americanToImpliedProbability(closingOddsNum);

    // CLV calculation: how much better were your odds compared to closing
    // If closing probability is higher, you got better odds (positive CLV)
    const clvPercent = ((closingProb - yourProb) / yourProb) * 100;

    let evDiff = null;
    if (betAmount && !isNaN(parseFloat(betAmount))) {
      const stake = parseFloat(betAmount);
      const yourProfit = calculateProfit(yourOddsNum, stake);
      const closingProfit = calculateProfit(closingOddsNum, stake);
      
      // EV difference: how much more expected value you got
      evDiff = (closingProb * yourProfit) - (closingProb * closingProfit);
    }

    setResult({
      clvPercent,
      yourProbability: yourProb * 100,
      closingProbability: closingProb * 100,
      evDifference: evDiff,
      isPositive: clvPercent > 0
    });
  };

  const handleClear = () => {
    setYourOdds("");
    setClosingOdds("");
    setBetAmount("");
    setResult(null);
  };

  const getCLVRating = (clv: number): { label: string; color: string; description: string } => {
    if (clv >= 2) {
      return {
        label: "Excellent",
        color: "text-green-600",
        description: "Professional-level line shopping"
      };
    } else if (clv >= 0) {
      return {
        label: "Good",
        color: "text-green-500",
        description: "You're beating the market"
      };
    } else if (clv >= -1) {
      return {
        label: "Neutral",
        color: "text-yellow-600",
        description: "Roughly market efficiency"
      };
    } else {
      return {
        label: "Poor",
        color: "text-red-600",
        description: "Getting bad odds, improve line shopping"
      };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Closing Line Value (CLV) Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Measure how much you beat the closing line - the best predictor of long-term profitability
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Calculate Your CLV</CardTitle>
            <CardDescription>
              Compare your odds to the closing line at game time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yourOdds">Your Bet Odds</Label>
                <Input
                  id="yourOdds"
                  type="number"
                  placeholder="e.g., +150"
                  value={yourOdds}
                  onChange={(e) => setYourOdds(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The odds you got when placing the bet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingOdds">Closing Line Odds</Label>
                <Input
                  id="closingOdds"
                  type="number"
                  placeholder="e.g., +130"
                  value={closingOdds}
                  onChange={(e) => setClosingOdds(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The odds at game time / market close
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="betAmount">Bet Amount ($) - Optional</Label>
              <Input
                id="betAmount"
                type="number"
                placeholder="e.g., 100"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                To see the dollar impact of your CLV
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={calculateCLV} className="flex-1">
                Calculate CLV
              </Button>
              <Button onClick={handleClear} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your CLV Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-6 rounded-lg text-center ${
                result.isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <p className="text-sm text-muted-foreground mb-2">Closing Line Value</p>
                <p className={`text-4xl font-bold mb-2 ${
                  result.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.clvPercent > 0 ? '+' : ''}{result.clvPercent.toFixed(2)}%
                </p>
                <div className={`inline-block px-4 py-2 rounded-full ${
                  result.isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <p className={`font-semibold ${getCLVRating(result.clvPercent).color}`}>
                    {getCLVRating(result.clvPercent).label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getCLVRating(result.clvPercent).description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Your Implied Probability</p>
                  <p className="text-2xl font-bold text-foreground">
                    {result.yourProbability.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Closing Implied Probability</p>
                  <p className="text-2xl font-bold text-foreground">
                    {result.closingProbability.toFixed(2)}%
                  </p>
                </div>
              </div>

              {result.evDifference !== null && (
                <div className="p-4 bg-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Expected Value Difference</p>
                  <p className={`text-2xl font-bold ${
                    result.evDifference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.evDifference > 0 ? '+' : ''}${result.evDifference.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Extra expected value gained from beating the closing line
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Why CLV Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Professional bettors use CLV as the #1 metric for measuring success. Even if you 
              lose individual bets, consistently beating the closing line means you're identifying 
              value before the market does.
            </p>

            <p>
              Studies show bettors with positive CLV are profitable long-term, regardless of 
              short-term win rate. The closing line is considered the "sharpest" line because 
              it incorporates all available information and the most betting volume.
            </p>

            <div className="bg-accent/20 p-4 rounded-lg space-y-3">
              <p className="font-semibold text-foreground">CLV Benchmarks:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">+2% or better:</span>
                  <span>Excellent, professional-level line shopping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">0% to +2%:</span>
                  <span>Good, you're beating the market</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">-1% to 0%:</span>
                  <span>Neutral, roughly market efficiency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">Worse than -1%:</span>
                  <span>Getting bad odds, need to improve line shopping</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Your CLV Automatically</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Want to track your CLV across all your bets automatically? The WalrusQuant Bet Tracker 
              records your bet odds and closing odds, calculating your CLV for every wager.
            </p>
            <NavLink to="/bet-tracker">
              <Button className="w-full">
                Go to Bet Tracker
              </Button>
            </NavLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CLVCalculator;