import { NavLink } from "@/components/NavLink";
import walrusLogo from "@/assets/walrus-logo.png";
import { ChevronDown, ArrowLeftRight, Percent, Calculator, Scale, TrendingUp, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors outline-none">
                Calculators
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card z-50" align="end">
                <DropdownMenuItem asChild>
                  <NavLink to="/odds-converter" className="flex items-center gap-2 cursor-pointer">
                    <ArrowLeftRight className="w-4 h-4" />
                    Odds Converter
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/implied-probability" className="flex items-center gap-2 cursor-pointer">
                    <Percent className="w-4 h-4" />
                    Implied Probability
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/parlay-calculator" className="flex items-center gap-2 cursor-pointer">
                    <Calculator className="w-4 h-4" />
                    Parlay Calculator
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/arbitrage-calculator" className="flex items-center gap-2 cursor-pointer">
                    <Scale className="w-4 h-4" />
                    Arbitrage Calculator
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/kelly-criterion" className="flex items-center gap-2 cursor-pointer">
                    <TrendingUp className="w-4 h-4" />
                    Kelly Criterion
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/expected-value" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4" />
                    Expected Value
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
