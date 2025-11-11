import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const OddsConverter = () => {
  const [american, setAmerican] = useState("");
  const [decimal, setDecimal] = useState("");
  const [fractional, setFractional] = useState("");

  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  const decimalToAmerican = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  };

  const decimalToFractional = (decimal: number): string => {
    const numerator = decimal - 1;
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const denominator = 1;
    const multiplier = 100;
    const num = Math.round(numerator * multiplier);
    const den = multiplier;
    const divisor = gcd(num, den);
    return `${num / divisor}/${den / divisor}`;
  };

  const fractionalToDecimal = (fractional: string): number => {
    const parts = fractional.split("/");
    if (parts.length !== 2) return 0;
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    return (num / den) + 1;
  };

  const handleAmericanChange = (value: string) => {
    setAmerican(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num !== 0) {
      const dec = americanToDecimal(num);
      setDecimal(dec.toFixed(2));
      setFractional(decimalToFractional(dec));
    }
  };

  const handleDecimalChange = (value: string) => {
    setDecimal(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 1) {
      setAmerican(decimalToAmerican(num).toString());
      setFractional(decimalToFractional(num));
    }
  };

  const handleFractionalChange = (value: string) => {
    setFractional(value);
    if (value.includes("/")) {
      const dec = fractionalToDecimal(value);
      if (dec > 1) {
        setDecimal(dec.toFixed(2));
        setAmerican(decimalToAmerican(dec).toString());
      }
    }
  };

  const handleClear = () => {
    setAmerican("");
    setDecimal("");
    setFractional("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Odds Converter</CardTitle>
            <CardDescription className="text-base">
              Convert betting odds between American, Decimal, and Fractional formats. 
              Enter odds in any format and see instant conversions to the other formats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="american">American Odds</Label>
              <Input
                id="american"
                type="number"
                placeholder="e.g., -110 or +150"
                value={american}
                onChange={(e) => handleAmericanChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Negative for favorites, positive for underdogs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal">Decimal Odds</Label>
              <Input
                id="decimal"
                type="number"
                step="0.01"
                placeholder="e.g., 1.91 or 2.50"
                value={decimal}
                onChange={(e) => handleDecimalChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Common in Europe and Canada</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fractional">Fractional Odds</Label>
              <Input
                id="fractional"
                type="text"
                placeholder="e.g., 10/11 or 3/2"
                value={fractional}
                onChange={(e) => handleFractionalChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Common in UK, format as numerator/denominator</p>
            </div>

            <Button onClick={handleClear} variant="outline" className="w-full">
              Clear All
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OddsConverter;
