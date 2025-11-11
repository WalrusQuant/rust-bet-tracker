import { useState } from "react";
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
      </div>
    </div>
  );
};

export default ImpliedProbability;
