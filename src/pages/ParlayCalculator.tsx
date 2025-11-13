import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Leg {
  id: number;
  odds: string;
}

const ParlayCalculator = () => {
  const [legs, setLegs] = useState<Leg[]>([
    { id: 1, odds: "" },
    { id: 2, odds: "" }
  ]);
  const [stake, setStake] = useState("");
  const [payout, setPayout] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  const addLeg = () => {
    if (legs.length < 10) {
      setLegs([...legs, { id: Date.now(), odds: "" }]);
    }
  };

  const removeLeg = (id: number) => {
    if (legs.length > 2) {
      setLegs(legs.filter(leg => leg.id !== id));
    }
  };

  const updateLeg = (id: number, value: string) => {
    setLegs(legs.map(leg => leg.id === id ? { ...leg, odds: value } : leg));
  };

  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  const calculateParlay = () => {
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) return;

    let combinedDecimal = 1;
    for (const leg of legs) {
      const oddsNum = parseFloat(leg.odds);
      if (isNaN(oddsNum) || leg.odds === "") return;
      combinedDecimal *= americanToDecimal(oddsNum);
    }

    const totalPayout = stakeNum * combinedDecimal;
    const totalProfit = totalPayout - stakeNum;

    setPayout(totalPayout);
    setProfit(totalProfit);
  };

  const handleClear = () => {
    setLegs([{ id: 1, odds: "" }, { id: 2, odds: "" }]);
    setStake("");
    setPayout(null);
    setProfit(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Parlay Calculator</CardTitle>
            <CardDescription className="text-base">
              Calculate potential payouts for parlay bets with 2-10 legs. Enter American odds 
              for each leg and your stake amount to see your total payout and profit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {legs.map((leg, index) => (
                <div key={leg.id} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`leg-${leg.id}`}>Leg {index + 1} (American Odds)</Label>
                    <Input
                      id={`leg-${leg.id}`}
                      type="number"
                      placeholder="e.g., -110"
                      value={leg.odds}
                      onChange={(e) => updateLeg(leg.id, e.target.value)}
                    />
                  </div>
                  {legs.length > 2 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeLeg(leg.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {legs.length < 10 && (
              <Button onClick={addLeg} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Leg ({legs.length}/10)
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount ($)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
            </div>

            <Button onClick={calculateParlay} className="w-full">
              Calculate Parlay
            </Button>

            {payout !== null && profit !== null && (
              <div className="space-y-3">
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Payout</p>
                  <p className="text-3xl font-bold text-primary">
                    ${payout.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Profit</p>
                  <p className="text-2xl font-bold text-secondary">
                    ${profit.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <Button onClick={handleClear} variant="outline" className="w-full">
              Clear All
            </Button>
          </CardContent>
        </Card>

        {/* Educational Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Parlay Math: Why Books Love Them</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Parlays combine multiple bets into one ticket. All legs must win for the parlay to cash. The appeal? Huge payouts from small stakes. The reality? Exponentially harder to win.
            </p>
            
            <div>
              <p className="font-semibold text-foreground mb-2">How parlay odds work:</p>
              <p>
                Multiply the decimal odds of each leg together. A 3-leg parlay at -110 each (1.909 decimal) = 1.909 × 1.909 × 1.909 = 6.96 decimal odds (+596 American). That $100 bet pays $596.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Why books love parlays:</p>
              <p className="mb-2">
                Even if you pick winners at 55% (profitable long-term), your parlay hit rate drops fast:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>2 legs: 30.25% hit rate</li>
                <li>3 legs: 16.6% hit rate</li>
                <li>4 legs: 9.1% hit rate</li>
                <li>10 legs: 0.25% hit rate</li>
              </ul>
              <p className="mt-2">
                The books also often pay less than true odds on parlays. A 2-team parlay should pay +264 true odds, but books typically pay +260.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Smart parlay strategy:</p>
              <p>
                Only parlay correlated outcomes (like team total OVER + game total OVER) where hitting one increases the chance of hitting the other. Or use them for entertainment with small stakes. For serious +EV betting, stick to single bets.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm">
                Track your parlay performance with{" "}
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

export default ParlayCalculator;
