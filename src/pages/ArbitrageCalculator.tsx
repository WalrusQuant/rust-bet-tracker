import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ArbitrageCalculator = () => {
  const [numOutcomes, setNumOutcomes] = useState("2");
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");
  const [odds3, setOdds3] = useState("");
  const [totalStake, setTotalStake] = useState("");
  const [result, setResult] = useState<any>(null);

  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  const calculateArbitrage = () => {
    const stake = parseFloat(totalStake);
    if (isNaN(stake) || stake <= 0) return;

    const decimal1 = americanToDecimal(parseFloat(odds1));
    const decimal2 = americanToDecimal(parseFloat(odds2));
    const decimal3 = numOutcomes === "3" ? americanToDecimal(parseFloat(odds3)) : 0;

    if (isNaN(decimal1) || isNaN(decimal2) || (numOutcomes === "3" && isNaN(decimal3))) return;

    let arbPercentage: number;
    let stake1: number, stake2: number, stake3: number = 0;
    let payout: number, profit: number;

    if (numOutcomes === "2") {
      arbPercentage = (1 / decimal1 + 1 / decimal2) * 100;
      const totalInverse = 1 / decimal1 + 1 / decimal2;
      stake1 = (stake * (1 / decimal1)) / totalInverse;
      stake2 = (stake * (1 / decimal2)) / totalInverse;
      payout = stake1 * decimal1;
      profit = payout - stake;
    } else {
      arbPercentage = (1 / decimal1 + 1 / decimal2 + 1 / decimal3) * 100;
      const totalInverse = 1 / decimal1 + 1 / decimal2 + 1 / decimal3;
      stake1 = (stake * (1 / decimal1)) / totalInverse;
      stake2 = (stake * (1 / decimal2)) / totalInverse;
      stake3 = (stake * (1 / decimal3)) / totalInverse;
      payout = stake1 * decimal1;
      profit = payout - stake;
    }

    setResult({
      arbPercentage,
      isArbitrage: arbPercentage < 100,
      stake1,
      stake2,
      stake3,
      payout,
      profit,
      profitPercent: (profit / stake) * 100
    });
  };

  const handleClear = () => {
    setOdds1("");
    setOdds2("");
    setOdds3("");
    setTotalStake("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Arbitrage Calculator</CardTitle>
            <CardDescription className="text-base">
              Find arbitrage opportunities across different sportsbooks. Enter odds from 2-3 books 
              to determine if a risk-free profit opportunity exists and how to stake each bet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="outcomes">Number of Outcomes</Label>
              <Select value={numOutcomes} onValueChange={setNumOutcomes}>
                <SelectTrigger id="outcomes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Outcomes (e.g., Win/Lose)</SelectItem>
                  <SelectItem value="3">3 Outcomes (e.g., Win/Draw/Lose)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds1">Book 1 Odds (American)</Label>
              <Input
                id="odds1"
                type="number"
                placeholder="e.g., -110"
                value={odds1}
                onChange={(e) => setOdds1(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds2">Book 2 Odds (American)</Label>
              <Input
                id="odds2"
                type="number"
                placeholder="e.g., +120"
                value={odds2}
                onChange={(e) => setOdds2(e.target.value)}
              />
            </div>

            {numOutcomes === "3" && (
              <div className="space-y-2">
                <Label htmlFor="odds3">Book 3 Odds (American)</Label>
                <Input
                  id="odds3"
                  type="number"
                  placeholder="e.g., +300"
                  value={odds3}
                  onChange={(e) => setOdds3(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stake">Total Stake ($)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                placeholder="e.g., 1000"
                value={totalStake}
                onChange={(e) => setTotalStake(e.target.value)}
              />
            </div>

            <Button onClick={calculateArbitrage} className="w-full">
              Calculate Arbitrage
            </Button>

            {result && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${result.isArbitrage ? 'bg-secondary/20' : 'bg-destructive/20'}`}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {result.isArbitrage ? "✓ Arbitrage Opportunity Found!" : "✗ No Arbitrage"}
                  </p>
                  <p className="text-2xl font-bold">
                    {result.arbPercentage.toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.isArbitrage ? "Below 100% = Profit opportunity" : "Above 100% = No arbitrage"}
                  </p>
                </div>

                {result.isArbitrage && (
                  <>
                    <div className="p-4 bg-accent rounded-lg space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Bet on Book 1</p>
                        <p className="text-xl font-bold">${result.stake1.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bet on Book 2</p>
                        <p className="text-xl font-bold">${result.stake2.toFixed(2)}</p>
                      </div>
                      {numOutcomes === "3" && (
                        <div>
                          <p className="text-sm text-muted-foreground">Bet on Book 3</p>
                          <p className="text-xl font-bold">${result.stake3.toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-secondary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Guaranteed Profit</p>
                      <p className="text-3xl font-bold text-secondary">
                        ${result.profit.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.profitPercent.toFixed(2)}% return
                      </p>
                    </div>
                  </>
                )}
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
            <CardTitle className="text-2xl">Arbitrage Betting: Risk-Free Profit?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Arbitrage (or 'arbing') is betting both sides of a market at different sportsbooks to guarantee profit regardless of outcome. When odds discrepancies exist across books, you can exploit them.
            </p>
            
            <div>
              <p className="font-semibold text-foreground mb-2">How it works:</p>
              <p>
                If Book A has Team A at +150 and Book B has Team B at +120, you might be able to bet both sides and profit no matter who wins. The calculator shows you the exact stakes needed.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Why opportunities exist:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Different books have different risk tolerance</li>
                <li>Odds move at different speeds across books</li>
                <li>Promotional odds or boosted bets create temporary gaps</li>
                <li>International books vs US books often have discrepancies</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">The catches:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Arb opportunities close quickly (seconds to minutes)</li>
                <li>Books limit or ban known arbers</li>
                <li>You need accounts at many books with available funds</li>
                <li>Small profit margins (typically 1-5%) require large stakes</li>
                <li>Odds can change between placing bets</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Best for:</p>
              <p>
                New bettors using welcome bonuses, or as a side strategy while building your bankroll. For serious profit, focus on finding +EV bets rather than risk-free arbs.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm">
                Track all your bets with{" "}
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

export default ArbitrageCalculator;
