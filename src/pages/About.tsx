import Header from "@/components/Header";
const About = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
            About WalrusQuant
          </h1>
          
          {/* Main Content */}
          <div className="space-y-6 text-lg text-foreground/90 mb-12">
            <p>WalrusQuant is a sports betting tracking and analytics platform built by a breakeven sports bettor in an afternoon.</p>
            
            <p>I built the tool with clean bet tracking, real expected value calculations, closing line value analysis, and bankroll management that actually helps you make better decisions.</p>
            
            
            
            <p>The free calculators help you understand the math. </p>
          </div>
          
          {/* Why WalrusQuant Section */}
          <div className="mt-16">
            
            
          </div>
        </div>
      </section>
    </div>;
};
export default About;