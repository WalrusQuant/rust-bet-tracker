import { NavLink } from "@/components/NavLink";
import walrusLogo from "@/assets/walrus-logo.png";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

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

            {user && (
              <>
                <NavLink 
                  to="/analytics" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Analytics
                </NavLink>

                <NavLink 
                  to="/bankroll" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Bankroll
                </NavLink>

                <NavLink 
                  to="/tag-management" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Manage Tags
                </NavLink>
              </>
            )}

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

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLink 
                  to="/" 
                  onClick={closeMenu}
                  className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                  activeClassName="text-primary font-medium"
                >
                  Home
                </NavLink>

                <NavLink 
                  to="/calculators" 
                  onClick={closeMenu}
                  className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                  activeClassName="text-primary font-medium"
                >
                  Calculators
                </NavLink>

                <NavLink 
                  to="/bet-tracker" 
                  onClick={closeMenu}
                  className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                  activeClassName="text-primary font-medium"
                >
                  Bet Tracker
                </NavLink>

                {user && (
                  <>
                    <NavLink 
                      to="/analytics" 
                      onClick={closeMenu}
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      activeClassName="text-primary font-medium"
                    >
                      Analytics
                    </NavLink>

                    <NavLink 
                      to="/bankroll" 
                      onClick={closeMenu}
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      activeClassName="text-primary font-medium"
                    >
                      Bankroll
                    </NavLink>

                    <NavLink 
                      to="/tag-management" 
                      onClick={closeMenu}
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      activeClassName="text-primary font-medium"
                    >
                      Manage Tags
                    </NavLink>
                  </>
                )}

                <NavLink 
                  to="/about" 
                  onClick={closeMenu}
                  className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                  activeClassName="text-primary font-medium"
                >
                  About
                </NavLink>

                <div className="pt-4 border-t border-border">
                  {user ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => { handleSignOut(); closeMenu(); }} 
                      className="w-full justify-start text-lg"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      onClick={() => { navigate('/auth'); closeMenu(); }} 
                      className="w-full justify-start text-lg"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
