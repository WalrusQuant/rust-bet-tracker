import { useState } from "react";
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
      </div>
    </div>
  );
};

export default ParlayCalculator;
