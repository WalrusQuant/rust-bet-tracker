import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Calculator, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            WalrusQuant
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
            Professional Sports Betting Tools
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            Free calculators and bet tracking built by a profitable bettor
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/calculators')}
              className="text-lg px-8 py-6"
            >
              Try Calculators
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/bet-tracker')}
              className="text-lg px-8 py-6"
            >
              Track Your Bets
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Calculators */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Calculator className="w-8 h-8 text-primary" />
                Free Calculators
              </CardTitle>
              <CardDescription className="text-base">
                Professional betting tools at your fingertips
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <ArrowLeftRight className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Odds Converter</h3>
                  <p className="text-sm text-muted-foreground">Convert between all odds formats instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Parlay Calculator</h3>
                  <p className="text-sm text-muted-foreground">Calculate potential parlay payouts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Kelly Criterion</h3>
                  <p className="text-sm text-muted-foreground">Optimize your bet sizing strategy</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/calculators')}
              >
                View All Calculators
              </Button>
            </CardContent>
          </Card>

          {/* Bet Tracker */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                Bet Tracker
              </CardTitle>
              <CardDescription className="text-base">
                Track your bets and analyze your performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Log all your bets with detailed information</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Track win rate, profit/loss, and ROI</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Filter by sport, date, and outcome</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Export your betting history to CSV</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4"
                onClick={() => navigate('/bet-tracker')}
              >
                Start Tracking
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
