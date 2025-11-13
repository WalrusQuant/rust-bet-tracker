import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatAmericanOdds, calculateProfit } from "@/lib/oddsUtils";

const HedgeCalculator = () => {
  const [originalBet, setOriginalBet] = useState<string>("");
  const [originalOdds, setOriginalOdds] = useState<string>("");
  const [hedgeOdds, setHedgeOdds] = useState<string>("");
  const [hedgeStrategy, setHedgeStrategy] = useState<string>("equal");
  const [profitPercent, setProfitPercent] = useState<number[]>([100]);
  const [result, setResult] = useState<{
    hedgeAmount: number;
    profitOriginal: number;
    profitHedge: number;
    totalGuaranteed: number;
    roi: number;
  } | null>(null);

  const calculateHedge = () => {
    const betAmount = parseFloat(originalBet);
    const origOdds = parseInt(originalOdds);
    const hOdds = parseInt(hedgeOdds);

    if (isNaN(betAmount) || isNaN(origOdds) || isNaN(hOdds)) {
      return;
    }

    const originalProfit = calculateProfit(origOdds, betAmount);
    const originalTotalReturn = betAmount + originalProfit;

    let hedgeAmount = 0;
    let profitIfOriginalWins = 0;
    let profitIfHedgeWins = 0;

    if (hedgeStrategy === "equal") {
      // Equal profit both sides
      hedgeAmount = originalTotalReturn / (1 + (hOdds > 0 ? hOdds / 100 : 100 / Math.abs(hOdds)));
      profitIfOriginalWins = originalProfit - hedgeAmount;
      profitIfHedgeWins = calculateProfit(hOdds, hedgeAmount) - betAmount;
    } else if (hedgeStrategy === "breakeven") {
      // Break even on hedge, profit on original
      hedgeAmount = betAmount / (1 + (hOdds > 0 ? hOdds / 100 : 100 / Math.abs(hOdds)));
      profitIfOriginalWins = originalProfit - hedgeAmount;
      profitIfHedgeWins = 0;
    } else {
      // Lock in percentage of profit
      const targetProfit = (originalProfit * profitPercent[0]) / 100;
      hedgeAmount = (originalTotalReturn - targetProfit) / (1 + (hOdds > 0 ? hOdds / 100 : 100 / Math.abs(hOdds)));
      profitIfOriginalWins = originalProfit - hedgeAmount;
      profitIfHedgeWins = calculateProfit(hOdds, hedgeAmount) - betAmount;
    }

    const totalGuaranteed = hedgeStrategy === "breakeven" 
      ? profitIfOriginalWins 
      : Math.min(profitIfOriginalWins, profitIfHedgeWins);
    
    const totalInvested = betAmount + hedgeAmount;
    const roi = (totalGuaranteed / totalInvested) * 100;

    setResult({
      hedgeAmount,
      profitOriginal: profitIfOriginalWins,
      profitHedge: profitIfHedgeWins,
      totalGuaranteed,
      roi
    });
  };

  const handleClear = () => {
    setOriginalBet("");
    setOriginalOdds("");
    setHedgeOdds("");
    setHedgeStrategy("equal");
    setProfitPercent([100]);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Hedge Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Calculate the exact hedge bet needed to guarantee profit or minimize loss
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Original Bet Details</CardTitle>
            <CardDescription>
              Enter information about your original wager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalBet">Original Bet Amount ($)</Label>
                <Input
                  id="originalBet"
                  type="number"
                  placeholder="e.g., 100"
                  value={originalBet}
                  onChange={(e) => setOriginalBet(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalOdds">Original Bet Odds</Label>
                <Input
                  id="originalOdds"
                  type="number"
                  placeholder="e.g., +500"
                  value={originalOdds}
                  onChange={(e) => setOriginalOdds(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hedgeOdds">Current Hedge Odds</Label>
              <Input
                id="hedgeOdds"
                type="number"
                placeholder="e.g., -150"
                value={hedgeOdds}
                onChange={(e) => setHedgeOdds(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The odds available on the opposite side of your original bet
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Hedge Strategy</Label>
              <Select value={hedgeStrategy} onValueChange={setHedgeStrategy}>
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Guarantee equal profit both sides</SelectItem>
                  <SelectItem value="breakeven">Break even on hedge, profit on original</SelectItem>
                  <SelectItem value="percentage">Lock in % of potential profit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hedgeStrategy === "percentage" && (
              <div className="space-y-2">
                <Label>Lock in {profitPercent[0]}% of potential profit</Label>
                <Slider
                  value={profitPercent}
                  onValueChange={setProfitPercent}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={calculateHedge} className="flex-1">
                Calculate Hedge
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
              <CardTitle>Hedge Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Recommended Hedge Bet</p>
                <p className="text-3xl font-bold text-primary">
                  ${result.hedgeAmount.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Profit if Original Wins</p>
                  <p className={`text-2xl font-bold ${result.profitOriginal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${result.profitOriginal.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Profit if Hedge Wins</p>
                  <p className={`text-2xl font-bold ${result.profitHedge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${result.profitHedge.toFixed(2)}
                  </p>
                </div>
              </div>

              {hedgeStrategy !== "breakeven" && (
                <div className="p-4 bg-accent/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Profit Guaranteed</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${result.totalGuaranteed.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Effective ROI: {result.roi.toFixed(2)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Common Hedge Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Scenario 1: Last Leg of a Parlay</p>
              <p>
                Your 10-leg parlay has 9 legs hit with one remaining. Your $50 bet at +10000 odds 
                could pay $5,000, but you can hedge by betting the opposite side at -200. 
                Calculate the exact hedge amount to guarantee profit either way.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground">Scenario 2: Futures Bet Value</p>
              <p>
                You bet a team at +2000 to win the championship months ago. Now they're in the 
                finals and available at -150. Lock in profit by hedging, or let it ride for 
                maximum payout.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground">Scenario 3: Live Betting Opportunity</p>
              <p>
                Your pregame bet is losing, but live odds have shifted dramatically. Use hedging 
                to minimize losses or even guarantee a small profit if the line has moved enough.
              </p>
            </div>

            <div className="mt-6 p-4 bg-accent/20 rounded-lg">
              <p className="font-semibold text-foreground mb-2">Pro Tip:</p>
              <p>
                While hedging reduces variance, it also reduces expected value if your original 
                bet had positive EV. Consider hedging only for life-changing amounts or when 
                the odds have moved significantly in your favor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HedgeCalculator;