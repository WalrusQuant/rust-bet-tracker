import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateProfit, calculateEV } from '@/lib/oddsUtils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';

interface Bet {
  id: string;
  bet_date: string;
  odds: number;
  fair_odds: number | null;
  closing_odds: number | null;
  stake: number;
  outcome: string;
  sportsbook_id: string | null;
  league_id: string | null;
  bet_type_id: string | null;
}

interface Sportsbook {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
}

interface BetType {
  id: string;
  name: string;
}

interface Strategy {
  id: string;
  name: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [betTypes, setBetTypes] = useState<BetType[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedChart, setSelectedChart] = useState('pl-over-time');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    const [betsRes, sportsbooksRes, leaguesRes, betTypesRes, strategiesRes] = await Promise.all([
      supabase.from('bets').select(`
        *,
        bet_strategies (
          strategies (
            id,
            name
          )
        )
      `).eq('user_id', user?.id).order('bet_date', { ascending: true }),
      supabase.from('sportsbooks').select('*').eq('user_id', user?.id),
      supabase.from('leagues').select('*').eq('user_id', user?.id),
      supabase.from('bet_types').select('*').eq('user_id', user?.id),
      (supabase as any).from('strategies').select('*').eq('user_id', user?.id),
    ]);

    if (betsRes.data) setBets(betsRes.data as any);
    if (sportsbooksRes.data) setSportsbooks(sportsbooksRes.data as Sportsbook[]);
    if (leaguesRes.data) setLeagues(leaguesRes.data as League[]);
    if (betTypesRes.data) setBetTypes(betTypesRes.data as BetType[]);
    if (strategiesRes.data) setStrategies(strategiesRes.data as Strategy[]);
  };

  const filteredBets = bets.filter(bet => {
    const betDate = new Date(bet.bet_date);
    if (dateFrom && betDate < dateFrom) return false;
    if (dateTo && betDate > dateTo) return false;
    
    // Filter by strategy
    if (selectedStrategy !== 'all') {
      const betStrategies = (bet as any).bet_strategies?.map((bs: any) => bs.strategies.id) || [];
      if (!betStrategies.includes(selectedStrategy)) return false;
    }
    
    return true;
  });

  const settledBets = filteredBets.filter(bet => bet.outcome === 'won' || bet.outcome === 'lost' || bet.outcome === 'push');

  // Calculate cumulative P/L over time
  const plOverTimeData = settledBets.map((bet, index) => {
    let profit = 0;
    if (bet.outcome === 'won') {
      profit = calculateProfit(bet.odds, bet.stake);
    } else if (bet.outcome === 'lost') {
      profit = -bet.stake;
    }
    
    const cumulativePL = settledBets.slice(0, index + 1).reduce((sum, b) => {
      let p = 0;
      if (b.outcome === 'won') p = calculateProfit(b.odds, b.stake);
      else if (b.outcome === 'lost') p = -b.stake;
      return sum + p;
    }, 0);

    return {
      date: format(new Date(bet.bet_date), 'MM/dd'),
      pl: Number(cumulativePL.toFixed(2)),
    };
  });

  // Win rate by sport
  const winRateBySport = leagues.map(league => {
    const leagueBets = settledBets.filter(bet => bet.league_id === league.id);
    const wins = leagueBets.filter(bet => bet.outcome === 'won').length;
    const winRate = leagueBets.length > 0 ? (wins / leagueBets.length) * 100 : 0;
    return {
      sport: league.name,
      winRate: Number(winRate.toFixed(1)),
      bets: leagueBets.length,
    };
  }).filter(d => d.bets > 0);

  // ROI by sportsbook
  const roiBySportsbook = sportsbooks.map(sportsbook => {
    const bookBets = settledBets.filter(bet => bet.sportsbook_id === sportsbook.id);
    const totalStake = bookBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = bookBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') return sum + calculateProfit(bet.odds, bet.stake);
      if (bet.outcome === 'lost') return sum - bet.stake;
      return sum;
    }, 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    return {
      sportsbook: sportsbook.name,
      roi: Number(roi.toFixed(1)),
      bets: bookBets.length,
    };
  }).filter(d => d.bets > 0);

  // ROI by bet type
  const roiByBetType = betTypes.map(betType => {
    const typeBets = settledBets.filter(bet => bet.bet_type_id === betType.id);
    const totalStake = typeBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = typeBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') return sum + calculateProfit(bet.odds, bet.stake);
      if (bet.outcome === 'lost') return sum - bet.stake;
      return sum;
    }, 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    return {
      betType: betType.name,
      roi: Number(roi.toFixed(1)),
      bets: typeBets.length,
    };
  }).filter(d => d.bets > 0);

  // Monthly performance
  const monthlyPerformance = settledBets.reduce((acc, bet) => {
    const month = format(new Date(bet.bet_date), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, profit: 0 };
    }
    if (bet.outcome === 'won') {
      acc[month].profit += calculateProfit(bet.odds, bet.stake);
    } else if (bet.outcome === 'lost') {
      acc[month].profit -= bet.stake;
    }
    return acc;
  }, {} as Record<string, { month: string; profit: number }>);

  const monthlyData = Object.values(monthlyPerformance).map(d => ({
    month: d.month,
    profit: Number(d.profit.toFixed(2)),
  }));

  // EV vs Actual Results
  const evVsActual = settledBets
    .filter(bet => bet.fair_odds !== null)
    .map(bet => {
      const ev = calculateEV(bet.odds, bet.fair_odds!, bet.stake);
      let actualReturn = 0;
      if (bet.outcome === 'won') {
        actualReturn = calculateProfit(bet.odds, bet.stake);
      } else if (bet.outcome === 'lost') {
        actualReturn = -bet.stake;
      }
      const actualReturnPct = (actualReturn / bet.stake) * 100;
      return {
        ev: Number(ev.toFixed(1)),
        actual: Number(actualReturnPct.toFixed(1)),
      };
    });

  // Summary stats
  const totalBets = filteredBets.length;
  const totalSettled = settledBets.length;
  const wins = settledBets.filter(bet => bet.outcome === 'won').length;
  const winRate = totalSettled > 0 ? (wins / totalSettled) * 100 : 0;
  const totalStake = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfit = settledBets.reduce((sum, bet) => {
    if (bet.outcome === 'won') return sum + calculateProfit(bet.odds, bet.stake);
    if (bet.outcome === 'lost') return sum - bet.stake;
    return sum;
  }, 0);
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

  // Performance by Strategy
  const strategyPerformance = strategies.map(strategy => {
    const strategyBets = settledBets.filter(bet => 
      (bet as any).bet_strategies?.some((bs: any) => bs.strategies.id === strategy.id)
    );
    const strategyWins = strategyBets.filter(b => b.outcome === 'won').length;
    const strategyWinRate = strategyBets.length > 0 ? (strategyWins / strategyBets.length) * 100 : 0;
    const strategyProfit = strategyBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') return sum + calculateProfit(bet.odds, bet.stake);
      if (bet.outcome === 'lost') return sum - bet.stake;
      return sum;
    }, 0);
    const strategyStake = strategyBets.reduce((sum, bet) => sum + bet.stake, 0);
    const strategyROI = strategyStake > 0 ? (strategyProfit / strategyStake) * 100 : 0;
    
    return {
      name: strategy.name,
      bets: strategyBets.length,
      winRate: Number(strategyWinRate.toFixed(1)),
      profit: Number(strategyProfit.toFixed(2)),
      roi: Number(strategyROI.toFixed(1)),
    };
  }).filter(s => s.bets > 0).sort((a, b) => b.roi - a.roi);

  const renderChart = () => {
    switch (selectedChart) {
      case 'pl-over-time':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={plOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pl" stroke="hsl(var(--primary))" name="Cumulative P/L ($)" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'win-rate-sport':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={winRateBySport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sport" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="winRate" fill="hsl(var(--primary))" name="Win Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'roi-sportsbook':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={roiBySportsbook}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sportsbook" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="hsl(var(--primary))" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'roi-bet-type':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={roiByBetType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="betType" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="hsl(var(--primary))" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'monthly-performance':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="profit" fill="hsl(var(--primary))" name="Profit ($)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'ev-vs-actual':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ev" name="Expected Value (%)" />
              <YAxis dataKey="actual" name="Actual Return (%)" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="EV vs Actual" data={evVsActual} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>Please sign in to view your analytics.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-muted-foreground">Visualize your betting performance with detailed charts and metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bets</CardDescription>
            <CardTitle className="text-3xl">{totalBets}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-3xl">{winRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P/L</CardDescription>
            <CardTitle className={`text-3xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ROI</CardDescription>
            <CardTitle className={`text-3xl ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'MM/dd/yyyy') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'MM/dd/yyyy') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStrategy !== 'all' && (
                  <Button variant="ghost" onClick={() => setSelectedStrategy('all')}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Chart Selection and Display */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Performance Charts</CardTitle>
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl-over-time">P/L Over Time</SelectItem>
                <SelectItem value="win-rate-sport">Win Rate by Sport</SelectItem>
                <SelectItem value="roi-sportsbook">ROI by Sportsbook</SelectItem>
                <SelectItem value="roi-bet-type">ROI by Bet Type</SelectItem>
                <SelectItem value="monthly-performance">Monthly Performance</SelectItem>
                <SelectItem value="ev-vs-actual">EV vs Actual Results</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {settledBets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No settled bets to display. Add some bets with outcomes to see your analytics.
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
