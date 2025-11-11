import { NavLink } from "@/components/NavLink";
import walrusLogo from "@/assets/walrus-logo.png";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
              to="/calculators" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary font-medium"
            >
              Calculators
            </NavLink>

            <NavLink 
              to="/bet-tracker" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary font-medium"
            >
              Bet Tracker
            </NavLink>

            <NavLink 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary font-medium"
            >
              About
            </NavLink>

            {user ? (
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Button variant="default" onClick={() => navigate('/auth')} className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
