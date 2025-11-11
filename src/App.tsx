import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Calculators from "./pages/Calculators";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import OddsConverter from "./pages/OddsConverter";
import ImpliedProbability from "./pages/ImpliedProbability";
import ParlayCalculator from "./pages/ParlayCalculator";
import ArbitrageCalculator from "./pages/ArbitrageCalculator";
import KellyCriterion from "./pages/KellyCriterion";
import ExpectedValue from "./pages/ExpectedValue";
import Auth from "./pages/Auth";
import BetTracker from "./pages/BetTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calculators" element={<Calculators />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/bet-tracker" element={<BetTracker />} />
            <Route path="/odds-converter" element={<OddsConverter />} />
            <Route path="/implied-probability" element={<ImpliedProbability />} />
            <Route path="/parlay-calculator" element={<ParlayCalculator />} />
            <Route path="/arbitrage-calculator" element={<ArbitrageCalculator />} />
            <Route path="/kelly-criterion" element={<KellyCriterion />} />
            <Route path="/expected-value" element={<ExpectedValue />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
