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
          <div className="space-y-6 text-lg text-foreground/90">
            <p>The tracker logs everything you need - odds, stakes, closing lines, EV calculations, strategy tags, and notes. Nine betting calculators included. Export your data to CSV anytime.</p>
            
            <p>No picks selling, no affiliate spam, just tools for tracking your bets and understanding the math.</p>
            
            <p className="text-foreground/70">X: <a href="https://x.com/walrusquant" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@walrusquant</a></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
