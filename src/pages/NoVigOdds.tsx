import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatAmericanOdds, americanToImpliedProbability } from "@/lib/oddsUtils";

const NoVigOdds = () => {
  const [sideAOdds, setSideAOdds] = useState<string>("");
  const [sideBOdds, setSideBOdds] = useState<string>("");
  const [result, setResult] = useState<{
    totalVig: number;
    noVigSideA: number;
    noVigSideB: number;
    fairProbA: number;
    fairProbB: number;
  } | null>(null);

  const calculateNoVig = () => {
    const oddsA = parseInt(sideAOdds);
    const oddsB = parseInt(sideBOdds);

    if (isNaN(oddsA) || isNaN(oddsB)) {
      return;
    }

    // Get implied probabilities with vig
    const impliedProbA = americanToImpliedProbability(oddsA);
    const impliedProbB = americanToImpliedProbability(oddsB);
    
    // Total probability (should be > 1 if there's vig)
    const totalProb = impliedProbA + impliedProbB;
    
    // Calculate vig percentage
    const vigPercent = ((totalProb - 1) * 100);
    
    // Remove vig to get fair probabilities
    const fairProbA = impliedProbA / totalProb;
    const fairProbB = impliedProbB / totalProb;
    
    // Convert fair probabilities back to American odds
    const noVigOddsA = fairProbA >= 0.5 
      ? -Math.round((fairProbA / (1 - fairProbA)) * 100)
      : Math.round(((1 - fairProbA) / fairProbA) * 100);
      
    const noVigOddsB = fairProbB >= 0.5
      ? -Math.round((fairProbB / (1 - fairProbB)) * 100)
      : Math.round(((1 - fairProbB) / fairProbB) * 100);

    setResult({
      totalVig: vigPercent,
      noVigSideA: noVigOddsA,
      noVigSideB: noVigOddsB,
      fairProbA: fairProbA * 100,
      fairProbB: fairProbB * 100
    });
  };

  const handleClear = () => {
    setSideAOdds("");
    setSideBOdds("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            No-Vig Fair Odds Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Remove the bookmaker's vig to find the true fair odds for any market
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Betting Odds</CardTitle>
            <CardDescription>
              Input the American odds for both sides of the market
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sideA">Side A Odds</Label>
                <Input
                  id="sideA"
                  type="number"
                  placeholder="e.g., -110"
                  value={sideAOdds}
                  onChange={(e) => setSideAOdds(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sideB">Side B Odds</Label>
                <Input
                  id="sideB"
                  type="number"
                  placeholder="e.g., -110"
                  value={sideBOdds}
                  onChange={(e) => setSideBOdds(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={calculateNoVig} className="flex-1">
                Calculate No-Vig Odds
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
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Market Vig</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.totalVig.toFixed(2)}%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">No-Vig Side A Odds</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatAmericanOdds(result.noVigSideA)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fair Probability: {result.fairProbA.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">No-Vig Side B Odds</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatAmericanOdds(result.noVigSideB)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fair Probability: {result.fairProbB.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Fair probabilities sum to exactly 100%
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Bookmakers add "vig" (also called "juice" or "margin") to odds to guarantee profit. 
              This calculator removes the vig to show what the true fair odds should be.
            </p>
            
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Example:</p>
              <p>
                If both sides of a market are -110, the bookmaker is charging approximately 4.5% vig. 
                The true fair odds would be closer to +100 (50/50), meaning each side has exactly 50% 
                probability with no bookmaker advantage.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground">Why This Matters:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Identify true value by comparing no-vig odds to available lines</li>
                <li>Shop for the best odds by knowing the fair market price</li>
                <li>Understand how much edge you need to overcome the vig</li>
                <li>Compare vig across different sportsbooks and markets</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoVigOdds;