import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
            About WalrusQuant
          </h1>
          
          {/* Main Content */}
          <div className="space-y-6 text-lg text-foreground/90 mb-12">
            <p>
              WalrusQuant is a professional sports betting tracking and analytics platform built by a profitable sports bettor.
            </p>
            
            <p>
              After years of betting successfully on NBA and other sports, I built the tools I wish existed - clean bet tracking, real expected value calculations, closing line value analysis, and bankroll management that actually helps you make better decisions.
            </p>
            
            <p>
              Most betting tools are built by affiliates or media companies trying to sell you picks. WalrusQuant is different. It's built by someone who actually bets, for people who take betting seriously.
            </p>
            
            <p>
              The free calculators help you understand the math. The Pro tracker ($40/year) helps you track your edge and improve your betting process over time.
            </p>
          </div>
          
          {/* Why WalrusQuant Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why WalrusQuant
            </h2>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">Professional-grade EV and CLV calculations</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">Clean interface built for serious bettors</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">Bulk import your betting history</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">Performance analytics that matter</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">Bankroll management tools</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">•</span>
                <span className="text-foreground/90">No BS, no picks selling, just tools</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
