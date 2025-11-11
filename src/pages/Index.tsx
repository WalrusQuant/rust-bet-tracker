import Header from "@/components/Header";
import CalculatorCard from "@/components/CalculatorCard";
import { ArrowLeftRight, Percent, Calculator, Scale, TrendingUp, DollarSign } from "lucide-react";

const Index = () => {
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
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Professional Sports Betting Calculators
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Free, accurate betting calculators to help you make smarter wagering decisions. 
            Convert odds, calculate parlays, find arbitrage opportunities, and optimize your bet sizing.
          </p>
        </div>
      </section>

      {/* Calculator Grid */}
      <section className="container mx-auto px-4 pb-24">
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

export default Index;
