import Header from "@/components/Header";
import CalculatorCard from "@/components/CalculatorCard";
import { ArrowLeftRight, Percent, Calculator, Scale, TrendingUp, DollarSign, Sparkles, Shield, LineChart } from "lucide-react";

const Calculators = () => {
  const calculators = [
    {
      title: "Odds Converter",
      description: "Convert between American, Decimal, and Fractional odds formats instantly",
      icon: ArrowLeftRight,
      link: "/odds-converter"
    },
    {
      title: "Implied Probability",
      description: "Calculate the implied probability from any odds format",
      icon: Percent,
      link: "/implied-probability"
    },
    {
      title: "Parlay Calculator",
      description: "Calculate potential payouts for 2-10 leg parlay bets",
      icon: Calculator,
      link: "/parlay-calculator"
    },
    {
      title: "Arbitrage Calculator",
      description: "Find profitable arbitrage opportunities across 2-3 sportsbooks",
      icon: Scale,
      link: "/arbitrage-calculator"
    },
    {
      title: "Kelly Criterion",
      description: "Calculate optimal bet sizing based on your edge and bankroll",
      icon: TrendingUp,
      link: "/kelly-criterion"
    },
    {
      title: "Expected Value (EV)",
      description: "Determine the expected value of any betting opportunity",
      icon: DollarSign,
      link: "/expected-value"
    },
    {
      title: "No-Vig Fair Odds",
      description: "Remove the bookmaker's vig to find the true fair odds for any market",
      icon: Sparkles,
      link: "/calculators/no-vig-odds"
    },
    {
      title: "Hedge Calculator",
      description: "Calculate the exact hedge bet needed to guarantee profit or minimize loss",
      icon: Shield,
      link: "/calculators/hedge"
    },
    {
      title: "Closing Line Value (CLV)",
      description: "Measure how much you beat the closing line - the best predictor of long-term profitability",
      icon: LineChart,
      link: "/calculators/clv"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Free Betting Calculators
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional tools to help you make smarter wagering decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc) => (
            <CalculatorCard
              key={calc.link}
              title={calc.title}
              description={calc.description}
              icon={calc.icon}
              link={calc.link}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Calculators;
