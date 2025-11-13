import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ImpliedProbability = () => {
  const [oddsFormat, setOddsFormat] = useState("american");
  const [odds, setOdds] = useState("");
  const [probability, setProbability] = useState<number | null>(null);

  const calculateProbability = () => {
    const num = parseFloat(odds);
    if (isNaN(num)) return;

    let prob = 0;

    if (oddsFormat === "american") {
      if (num > 0) {
        prob = 100 / (num + 100);
      } else {
        prob = Math.abs(num) / (Math.abs(num) + 100);
      }
    } else if (oddsFormat === "decimal") {
      prob = 1 / num;
    } else if (oddsFormat === "fractional") {
      const parts = odds.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        prob = denominator / (numerator + denominator);
      }
    }

    setProbability(prob * 100);
  };

  const handleClear = () => {
    setOdds("");
    setProbability(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Implied Probability Calculator</CardTitle>
            <CardDescription className="text-base">
              Calculate the implied probability of odds in any format. This shows what percentage 
              chance the bookmaker's odds suggest for an outcome to occur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="format">Odds Format</Label>
              <Select value={oddsFormat} onValueChange={setOddsFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="american">American</SelectItem>
                  <SelectItem value="decimal">Decimal</SelectItem>
                  <SelectItem value="fractional">Fractional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds">Enter Odds</Label>
              <Input
                id="odds"
                type="text"
                placeholder={
                  oddsFormat === "american" ? "e.g., -110 or +150" :
                  oddsFormat === "decimal" ? "e.g., 1.91 or 2.50" :
                  "e.g., 10/11 or 3/2"
                }
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
            </div>

            <Button onClick={calculateProbability} className="w-full">
              Calculate Probability
            </Button>

            {probability !== null && (
              <div className="p-6 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Implied Probability</p>
                <p className="text-4xl font-bold text-primary">
                  {probability.toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The bookmaker's odds suggest a {probability.toFixed(2)}% chance of this outcome
                </p>
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
            <CardTitle className="text-2xl">What Implied Probability Tells You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Implied probability converts betting odds into a percentage chance of winning. This is crucial for finding value.
            </p>
            
            <div>
              <p className="font-semibold text-foreground mb-2">How it works:</p>
              <p>
                If a team is -200 (implied probability 66.7%), the bookmaker is saying this team has a 66.7% chance to win. But is that accurate?
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Finding value:</p>
              <p>
                If you believe the true probability is 75%, then -200 offers +EV (Expected Value). Your edge is the difference between the true probability and the implied probability.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">The vig factor:</p>
              <p>
                When you add both sides of a market together, implied probabilities will sum to more than 100%. That extra percentage is the bookmaker's vig (juice). For example, -110 on both sides = 52.4% + 52.4% = 104.8% total. The 4.8% is the vig.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Think in probabilities:</p>
              <p>
                Sharp bettors think in probabilities, not odds. Convert everything to percentages to see where the real value is.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm">
                Track your edge automatically with{" "}
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

export default ImpliedProbability;
