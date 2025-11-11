import { NavLink } from "@/components/NavLink";
import walrusLogo from "@/assets/walrus-logo.png";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 text-2xl font-bold text-foreground hover:text-primary transition-colors">
            <img src={walrusLogo} alt="WalrusQuant" className="w-10 h-10 rounded-full" />
            <span>WalrusQuant</span>
          </NavLink>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary font-medium"
            >
              Home
            </NavLink>
            <NavLink 
              to="/odds-converter" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary font-medium"
            >
              Calculators
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
