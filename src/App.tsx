import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Eagerly loaded pages (frequently accessed)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy loaded pages
const Calculators = lazy(() => import("./pages/Calculators"));
const About = lazy(() => import("./pages/About"));
const Auth = lazy(() => import("./pages/Auth"));
const BetTracker = lazy(() => import("./pages/BetTracker"));
const Analytics = lazy(() => import("./pages/Analytics"));
const TagManagement = lazy(() => import("./pages/TagManagement"));
const Bankroll = lazy(() => import("./pages/Bankroll"));

// Lazy loaded calculator pages
const OddsConverter = lazy(() => import("./pages/OddsConverter"));
const ImpliedProbability = lazy(() => import("./pages/ImpliedProbability"));
const ParlayCalculator = lazy(() => import("./pages/ParlayCalculator"));
const ArbitrageCalculator = lazy(() => import("./pages/ArbitrageCalculator"));
const KellyCriterion = lazy(() => import("./pages/KellyCriterion"));
const ExpectedValue = lazy(() => import("./pages/ExpectedValue"));
const NoVigOdds = lazy(() => import("./pages/NoVigOdds"));
const HedgeCalculator = lazy(() => import("./pages/HedgeCalculator"));
const CLVCalculator = lazy(() => import("./pages/CLVCalculator"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Main pages */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/auth" element={<Auth />} />

                {/* Core app features */}
                <Route path="/bet-tracker" element={<BetTracker />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/bankroll" element={<Bankroll />} />
                <Route path="/tag-management" element={<TagManagement />} />

                {/* Calculators - standardized under /calculators/ prefix */}
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/calculators/odds-converter" element={<OddsConverter />} />
                <Route path="/calculators/implied-probability" element={<ImpliedProbability />} />
                <Route path="/calculators/parlay" element={<ParlayCalculator />} />
                <Route path="/calculators/arbitrage" element={<ArbitrageCalculator />} />
                <Route path="/calculators/kelly-criterion" element={<KellyCriterion />} />
                <Route path="/calculators/expected-value" element={<ExpectedValue />} />
                <Route path="/calculators/no-vig-odds" element={<NoVigOdds />} />
                <Route path="/calculators/hedge" element={<HedgeCalculator />} />
                <Route path="/calculators/clv" element={<CLVCalculator />} />

                {/* Legacy routes - redirect to new paths for backwards compatibility */}
                <Route path="/odds-converter" element={<OddsConverter />} />
                <Route path="/implied-probability" element={<ImpliedProbability />} />
                <Route path="/parlay-calculator" element={<ParlayCalculator />} />
                <Route path="/arbitrage-calculator" element={<ArbitrageCalculator />} />
                <Route path="/kelly-criterion" element={<KellyCriterion />} />
                <Route path="/expected-value" element={<ExpectedValue />} />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
