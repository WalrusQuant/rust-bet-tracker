import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About WalrusQuant
          </h1>
          <p className="text-lg text-muted-foreground">
            Coming soon...
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
