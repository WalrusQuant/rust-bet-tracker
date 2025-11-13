import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Calculator, TrendingUp, BarChart3, CheckCircle2, DollarSign, Target, Filter, Download, Tags, LineChart, PieChart, Percent, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  const calculators = [{
    title: "Odds Converter",
    icon: ArrowLeftRight,
    link: "/calculators/odds-converter"
  }, {
    title: "Implied Probability",
    icon: Percent,
    link: "/calculators/implied-probability"
  }, {
    title: "Parlay Calculator",
    icon: Calculator,
    link: "/calculators/parlay"
  }, {
    title: "Arbitrage Calculator",
    icon: TrendingUp,
    link: "/calculators/arbitrage"
  }, {
    title: "Kelly Criterion",
    icon: Target,
    link: "/calculators/kelly"
  }, {
    title: "Expected Value",
    icon: DollarSign,
    link: "/calculators/expected-value"
  }, {
    title: "No-Vig Odds",
    icon: Percent,
    link: "/calculators/no-vig-odds"
  }, {
    title: "Hedge Calculator",
    icon: Shield,
    link: "/calculators/hedge"
  }, {
    title: "CLV Calculator",
    icon: LineChart,
    link: "/calculators/clv"
  }];
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            WalrusQuant
          </h1>
          <p className="text-2xl md:text-3xl text-foreground mb-3 font-semibold">
            Track Every Bet. Analyze Your Edge. Build Your Bankroll.
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            Complete bet tracking system with professional calculators all for FREE      
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/bet-tracker')} className="text-lg px-8 py-6">
              Start Tracking Bets
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/calculators')} className="text-lg px-8 py-6">
              Explore Tools
            </Button>
          </div>
        </div>
      </section>

      {/* Main Bet Tracker Showcase */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Feature Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 mb-8">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl md:text-4xl mb-3">
                Professional Bet Tracking & Bankroll Management
              </CardTitle>
              <CardDescription className="text-base md:text-lg max-w-3xl mx-auto">
                Everything you need to track, analyze, and improve your betting performance. Know exactly where your edge is - or isn't.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Bet Tracking */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  Bet Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Log every bet with complete details (odds, stakes, outcomes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track closing line value (CLV) automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Record fair odds to measure your edge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Add notes and strategy tags to each bet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Filter className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Filter by sportsbook, league, bet type, outcome</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Export your complete betting history to CSV</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-primary" />
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Profit/Loss tracking over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Percent className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>ROI by sport, league, and bet type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Win rate and average odds analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LineChart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>CLV performance charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PieChart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Scatter plot visualizations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Filter className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Date range and strategy filtering</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Bankroll Management */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                  Bankroll Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smart unit sizing (Fixed %, Kelly Criterion, Fixed Amount)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Recommended stake calculator with Kelly fractions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track deposits and withdrawals by sportsbook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LineChart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Visual bankroll growth charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Starting bankroll configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Real-time bankroll updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CLV Callout + Tag Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* CLV Callout */}
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Why CLV Matters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong className="text-foreground">Beat the closing line = long-term profitability.</strong> Professional bettors use CLV as the #1 metric for measuring success.
                </p>
                <p className="text-sm text-muted-foreground">
                  Even if you lose individual bets, consistently beating the closing line means you're identifying value before the market does. WalrusQuant tracks your CLV automatically on every bet.
                </p>
              </CardContent>
            </Card>

            {/* Tag Management */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Tags className="w-6 h-6 text-primary" />
                  Tag Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Organize everything with custom tags for better analysis and filtering.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Custom sportsbooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>League tags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Bet type categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Strategy labels</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => navigate('/bet-tracker')} className="text-lg px-10 py-6">
              Start Tracking Your Bets
            </Button>
          </div>
        </div>
      </section>

      {/* Calculators as Bonus Tools */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Nine Betting Calculators
            </h2>
            <p className="text-lg text-muted-foreground">
              All the math tools you need, included with your bet tracker
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {calculators.map(calc => <Card key={calc.title} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-primary" onClick={() => navigate(calc.link)}>
                <CardHeader className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mx-auto mb-2">
                    <calc.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-sm md:text-base">
                    {calc.title}
                  </CardTitle>
                </CardHeader>
              </Card>)}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" onClick={() => navigate('/calculators')}>
              View All Calculators
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 text-center">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl mb-2">Built by a Bettor, for Bettors</CardTitle>
              <CardDescription>
                Created by someone who understands the grind. Free tools that professional trackers charge $50+/month for.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 text-center">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl mb-2">Your Data, Your Privacy</CardTitle>
              <CardDescription>
                All your betting data stays with you. No sharing, no selling, no nonsense.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 text-center">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl mb-2">Forever Free</CardTitle>
              <CardDescription>
                Core bet tracking and all calculators. No hidden fees, no paywalls, no credit card required.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start Tracking Your Edge Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join bettors using WalrusQuant to improve their betting performance
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-10 py-6 mb-4">
            Create Free Account
          </Button>
          <p className="text-sm text-muted-foreground">
            No credit card required • Takes 30 seconds
          </p>
        </div>
      </section>
    </div>;
};
export default Index;