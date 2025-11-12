import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Download, Plus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateEV, calculateCLV, calculateProfit, formatAmericanOdds } from '@/lib/oddsUtils';

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

interface Bet {
  id: string;
  bet_date: string;
  sportsbook_id: string | null;
  league_id: string | null;
  bet_type_id: string | null;
  odds: number;
  fair_odds: number | null;
  closing_odds: number | null;
  stake: number;
  outcome: 'pending' | 'won' | 'lost' | 'push';
  notes: string | null;
  sportsbooks?: { name: string } | null;
  leagues?: { name: string } | null;
  bet_types?: { name: string } | null;
}

const BetTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [betTypes, setBetTypes] = useState<BetType[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [filterSportsbook, setFilterSportsbook] = useState<string>('all');
  const [filterLeague, setFilterLeague] = useState<string>('all');
  const [filterBetType, setFilterBetType] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingBet, setViewingBet] = useState<Bet | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    sportsbook_id: '',
    league_id: '',
    bet_type_id: '',
    odds: '',
    fair_odds: '',
    closing_odds: '',
    stake: '',
    outcome: 'pending' as 'pending' | 'won' | 'lost' | 'push',
    notes: '',
  });

  // New tag creation state
  const [newSportsbook, setNewSportsbook] = useState('');
  const [newLeague, setNewLeague] = useState('');
  const [newBetType, setNewBetType] = useState('');
  const [showNewSportsbook, setShowNewSportsbook] = useState(false);
  const [showNewLeague, setShowNewLeague] = useState(false);
  const [showNewBetType, setShowNewBetType] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    await Promise.all([fetchBets(), fetchSportsbooks(), fetchLeagues(), fetchBetTypes()]);
    setLoading(false);
  };

  const fetchBets = async () => {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          sportsbooks(name),
          leagues(name),
          bet_types(name)
        `)
        .order('bet_date', { ascending: false });

      if (error) throw error;
      setBets((data || []) as Bet[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bets',
        variant: 'destructive',
      });
    }
  };

  const fetchSportsbooks = async () => {
    try {
      const { data, error } = await supabase
        .from('sportsbooks')
        .select('*')
        .order('name');
      if (error) throw error;
      setSportsbooks(data || []);
    } catch (error) {
      console.error('Failed to fetch sportsbooks:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name');
      if (error) throw error;
      setLeagues(data || []);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    }
  };

  const fetchBetTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('bet_types')
        .select('*')
        .order('name');
      if (error) throw error;
      setBetTypes(data || []);
    } catch (error) {
      console.error('Failed to fetch bet types:', error);
    }
  };

  const createSportsbook = async () => {
    if (!user || !newSportsbook.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('sportsbooks')
        .insert({ user_id: user.id, name: newSportsbook.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      setSportsbooks([...sportsbooks, data]);
      setFormData({ ...formData, sportsbook_id: data.id });
      setNewSportsbook('');
      setShowNewSportsbook(false);
      toast({ title: 'Success', description: 'Sportsbook added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add sportsbook', variant: 'destructive' });
    }
  };

  const createLeague = async () => {
    if (!user || !newLeague.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('leagues')
        .insert({ user_id: user.id, name: newLeague.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      setLeagues([...leagues, data]);
      setFormData({ ...formData, league_id: data.id });
      setNewLeague('');
      setShowNewLeague(false);
      toast({ title: 'Success', description: 'League added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add league', variant: 'destructive' });
    }
  };

  const createBetType = async () => {
    if (!user || !newBetType.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('bet_types')
        .insert({ user_id: user.id, name: newBetType.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      setBetTypes([...betTypes, data]);
      setFormData({ ...formData, bet_type_id: data.id });
      setNewBetType('');
      setShowNewBetType(false);
      toast({ title: 'Success', description: 'Bet type added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add bet type', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const betData = {
        bet_date: format(selectedDate, 'yyyy-MM-dd'),
        sportsbook_id: formData.sportsbook_id || null,
        league_id: formData.league_id || null,
        bet_type_id: formData.bet_type_id || null,
        odds: parseInt(formData.odds),
        fair_odds: formData.fair_odds ? parseInt(formData.fair_odds) : null,
        closing_odds: formData.closing_odds ? parseInt(formData.closing_odds) : null,
        stake: parseFloat(formData.stake),
        outcome: formData.outcome,
        notes: formData.notes || null,
      };

      if (editingBet) {
        const { error } = await supabase
          .from('bets')
          .update(betData)
          .eq('id', editingBet.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Bet updated successfully' });
      } else {
        const { error } = await supabase
          .from('bets')
          .insert({ ...betData, user_id: user.id });

        if (error) throw error;
        toast({ title: 'Success', description: 'Bet added successfully' });
      }

      resetForm();
      fetchBets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bet',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      sportsbook_id: '',
      league_id: '',
      bet_type_id: '',
      odds: '',
      fair_odds: '',
      closing_odds: '',
      stake: '',
      outcome: 'pending',
      notes: '',
    });
    setSelectedDate(new Date());
    setEditingBet(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('bets').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Bet deleted successfully' });
      fetchBets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete bet',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (bet: Bet) => {
    setEditingBet(bet);
    setSelectedDate(new Date(bet.bet_date));
    setFormData({
      sportsbook_id: bet.sportsbook_id || '',
      league_id: bet.league_id || '',
      bet_type_id: bet.bet_type_id || '',
      odds: bet.odds.toString(),
      fair_odds: bet.fair_odds?.toString() || '',
      closing_odds: bet.closing_odds?.toString() || '',
      stake: bet.stake.toString(),
      outcome: bet.outcome,
      notes: bet.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (bet: Bet) => {
    setViewingBet(bet);
    setIsDetailsDialogOpen(true);
  };

  const calculateStats = () => {
    const filteredBets = bets.filter((bet) => {
      const sportsbookMatch = filterSportsbook === 'all' || bet.sportsbook_id === filterSportsbook;
      const leagueMatch = filterLeague === 'all' || bet.league_id === filterLeague;
      const betTypeMatch = filterBetType === 'all' || bet.bet_type_id === filterBetType;
      const outcomeMatch = filterOutcome === 'all' || bet.outcome === filterOutcome;
      return sportsbookMatch && leagueMatch && betTypeMatch && outcomeMatch;
    });

    const totalBets = filteredBets.length;
    const wonBets = filteredBets.filter((b) => b.outcome === 'won').length;
    const lostBets = filteredBets.filter((b) => b.outcome === 'lost').length;
    const winRate = wonBets + lostBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100).toFixed(1) : '0.0';

    const totalStaked = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = filteredBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') {
        return sum + calculateProfit(bet.odds, bet.stake);
      } else if (bet.outcome === 'lost') {
        return sum - bet.stake;
      }
      return sum;
    }, 0);

    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0.0';

    // Calculate average EV for bets with fair odds
    const betsWithEV = filteredBets.filter(b => b.fair_odds !== null);
    const avgEV = betsWithEV.length > 0
      ? (betsWithEV.reduce((sum, bet) => {
          return sum + calculateEV(bet.odds, bet.fair_odds!, bet.stake);
        }, 0) / betsWithEV.length).toFixed(2)
      : '0.00';

    // Calculate average CLV for bets with closing odds
    const betsWithCLV = filteredBets.filter(b => b.closing_odds !== null);
    const avgCLV = betsWithCLV.length > 0
      ? (betsWithCLV.reduce((sum, bet) => {
          return sum + calculateCLV(bet.odds, bet.closing_odds!);
        }, 0) / betsWithCLV.length).toFixed(2)
      : '0.00';

    return { totalBets, winRate, totalProfit, roi, avgEV, avgCLV };
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Sportsbook', 'League', 'Bet Type', 'Odds', 'Fair Odds', 'Closing Odds', 'Stake', 'Outcome', 'EV%', 'CLV%'];
    const rows = bets.map((bet) => [
      bet.bet_date,
      bet.sportsbooks?.name || '',
      bet.leagues?.name || '',
      bet.bet_types?.name || '',
      bet.odds,
      bet.fair_odds || '',
      bet.closing_odds || '',
      bet.stake,
      bet.outcome,
      bet.fair_odds ? calculateEV(bet.odds, bet.fair_odds, bet.stake).toFixed(2) : '',
      bet.closing_odds ? calculateCLV(bet.odds, bet.closing_odds).toFixed(2) : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bets.csv';
    a.click();
  };

  const stats = calculateStats();
  const filteredBets = bets.filter((bet) => {
    const sportsbookMatch = filterSportsbook === 'all' || bet.sportsbook_id === filterSportsbook;
    const leagueMatch = filterLeague === 'all' || bet.league_id === filterLeague;
    const betTypeMatch = filterBetType === 'all' || bet.bet_type_id === filterBetType;
    const outcomeMatch = filterOutcome === 'all' || bet.outcome === filterOutcome;
    return sportsbookMatch && leagueMatch && betTypeMatch && outcomeMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Professional Bet Tracker</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>Add Bet</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBet ? 'Edit Bet' : 'Add New Bet'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Sportsbook</Label>
                  {showNewSportsbook ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSportsbook}
                        onChange={(e) => setNewSportsbook(e.target.value)}
                        placeholder="Enter sportsbook name"
                      />
                      <Button type="button" onClick={createSportsbook}>Add</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewSportsbook(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={formData.sportsbook_id} onValueChange={(value) => setFormData({ ...formData, sportsbook_id: value })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select sportsbook" />
                        </SelectTrigger>
                        <SelectContent>
                          {sportsbooks.map((sb) => (
                            <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="outline" onClick={() => setShowNewSportsbook(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Sport/League</Label>
                  {showNewLeague ? (
                    <div className="flex gap-2">
                      <Input
                        value={newLeague}
                        onChange={(e) => setNewLeague(e.target.value)}
                        placeholder="Enter league name"
                      />
                      <Button type="button" onClick={createLeague}>Add</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewLeague(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={formData.league_id} onValueChange={(value) => setFormData({ ...formData, league_id: value })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select league" />
                        </SelectTrigger>
                        <SelectContent>
                          {leagues.map((league) => (
                            <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="outline" onClick={() => setShowNewLeague(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Bet Type</Label>
                  {showNewBetType ? (
                    <div className="flex gap-2">
                      <Input
                        value={newBetType}
                        onChange={(e) => setNewBetType(e.target.value)}
                        placeholder="Enter bet type"
                      />
                      <Button type="button" onClick={createBetType}>Add</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewBetType(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={formData.bet_type_id} onValueChange={(value) => setFormData({ ...formData, bet_type_id: value })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent>
                          {betTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="outline" onClick={() => setShowNewBetType(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="odds">Bet Odds (American)</Label>
                    <Input
                      id="odds"
                      type="number"
                      value={formData.odds}
                      onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                      placeholder="-110"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fair_odds">Fair Odds (American)</Label>
                    <Input
                      id="fair_odds"
                      type="number"
                      value={formData.fair_odds}
                      onChange={(e) => setFormData({ ...formData, fair_odds: e.target.value })}
                      placeholder="-105"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="closing_odds">Closing Odds (American)</Label>
                    <Input
                      id="closing_odds"
                      type="number"
                      value={formData.closing_odds}
                      onChange={(e) => setFormData({ ...formData, closing_odds: e.target.value })}
                      placeholder="-115"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stake">Stake ($)</Label>
                    <Input
                      id="stake"
                      type="number"
                      step="0.01"
                      value={formData.stake}
                      onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="outcome">Status</Label>
                  <Select value={formData.outcome} onValueChange={(value: any) => setFormData({ ...formData, outcome: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes about this bet (reasoning, context, etc.)"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingBet ? 'Update Bet' : 'Add Bet'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bets</CardDescription>
              <CardTitle className="text-3xl">{stats.totalBets}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-3xl">{stats.winRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total P/L</CardDescription>
              <CardTitle className={`text-3xl ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${stats.totalProfit.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ROI</CardDescription>
              <CardTitle className={`text-3xl ${parseFloat(stats.roi) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.roi}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg EV%</CardDescription>
              <CardTitle className={`text-3xl ${parseFloat(stats.avgEV) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.avgEV}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg CLV%</CardDescription>
              <CardTitle className={`text-3xl ${parseFloat(stats.avgCLV) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.avgCLV}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <Select value={filterSportsbook} onValueChange={setFilterSportsbook}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sportsbook" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sportsbooks</SelectItem>
              {sportsbooks.map((sb) => (
                <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLeague} onValueChange={setFilterLeague}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBetType} onValueChange={setFilterBetType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bet Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bet Types</SelectItem>
              {betTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Bets Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sportsbook</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Odds</TableHead>
                    <TableHead>Fair</TableHead>
                    <TableHead>Close</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>EV%</TableHead>
                    <TableHead>CLV%</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredBets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">No bets found</TableCell>
                    </TableRow>
                  ) : (
                    filteredBets.map((bet) => {
                      const ev = bet.fair_odds ? calculateEV(bet.odds, bet.fair_odds, bet.stake) : null;
                      const clv = bet.closing_odds ? calculateCLV(bet.odds, bet.closing_odds) : null;
                      
                      return (
                        <TableRow key={bet.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(bet)}>
                          <TableCell className="whitespace-nowrap">{bet.bet_date}</TableCell>
                          <TableCell>{bet.sportsbooks?.name || '-'}</TableCell>
                          <TableCell>{bet.leagues?.name || '-'}</TableCell>
                          <TableCell>{bet.bet_types?.name || '-'}</TableCell>
                          <TableCell className="font-mono">{formatAmericanOdds(bet.odds)}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {bet.fair_odds ? formatAmericanOdds(bet.fair_odds) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {bet.closing_odds ? formatAmericanOdds(bet.closing_odds) : '-'}
                          </TableCell>
                          <TableCell>${bet.stake}</TableCell>
                          <TableCell className={ev !== null ? (ev >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                            {ev !== null ? `${ev.toFixed(2)}%` : '-'}
                          </TableCell>
                          <TableCell className={clv !== null ? (clv >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                            {clv !== null ? `${clv.toFixed(2)}%` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              bet.outcome === 'won' ? 'bg-green-500/20 text-green-500' :
                              bet.outcome === 'lost' ? 'bg-red-500/20 text-red-500' :
                              bet.outcome === 'push' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {bet.outcome}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(bet)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(bet.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bet Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bet Details</DialogTitle>
            </DialogHeader>
            {viewingBet && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{format(new Date(viewingBet.bet_date), 'PPP')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingBet.outcome === 'won' ? 'bg-green-500/20 text-green-500' :
                        viewingBet.outcome === 'lost' ? 'bg-red-500/20 text-red-500' :
                        viewingBet.outcome === 'push' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {viewingBet.outcome}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Sportsbook</Label>
                    <p className="font-medium">{viewingBet.sportsbooks?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">League</Label>
                    <p className="font-medium">{viewingBet.leagues?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bet Type</Label>
                    <p className="font-medium">{viewingBet.bet_types?.name || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Bet Odds</Label>
                    <p className="font-mono text-lg">{formatAmericanOdds(viewingBet.odds)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stake</Label>
                    <p className="text-lg">${viewingBet.stake}</p>
                  </div>
                </div>

                {viewingBet.fair_odds && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Fair Odds</Label>
                      <p className="font-mono">{formatAmericanOdds(viewingBet.fair_odds)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Expected Value (EV)</Label>
                      <p className={`font-medium ${calculateEV(viewingBet.odds, viewingBet.fair_odds, viewingBet.stake) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {calculateEV(viewingBet.odds, viewingBet.fair_odds, viewingBet.stake).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}

                {viewingBet.closing_odds && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Closing Odds</Label>
                      <p className="font-mono">{formatAmericanOdds(viewingBet.closing_odds)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Closing Line Value (CLV)</Label>
                      <p className={`font-medium ${calculateCLV(viewingBet.odds, viewingBet.closing_odds) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {calculateCLV(viewingBet.odds, viewingBet.closing_odds).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}

                {(viewingBet.outcome === 'won' || viewingBet.outcome === 'lost') && (
                  <div>
                    <Label className="text-muted-foreground">Profit/Loss</Label>
                    <p className={`text-xl font-bold ${
                      viewingBet.outcome === 'won' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {viewingBet.outcome === 'won' 
                        ? `+$${calculateProfit(viewingBet.odds, viewingBet.stake).toFixed(2)}`
                        : `-$${viewingBet.stake.toFixed(2)}`
                      }
                    </p>
                  </div>
                )}

                {viewingBet.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{viewingBet.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
                  <Button onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleEdit(viewingBet);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Bet
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BetTracker;
