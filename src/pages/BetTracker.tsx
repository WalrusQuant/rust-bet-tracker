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
import { Edit, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Bet {
  id: string;
  bet_date: string;
  sport: string;
  bet_type: string;
  odds: number;
  stake: number;
  outcome: 'pending' | 'won' | 'lost';
}

const BetTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    bet_date: new Date().toISOString().split('T')[0],
    sport: '',
    bet_type: '',
    odds: '',
    stake: '',
    outcome: 'pending' as 'pending' | 'won' | 'lost',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBets();
  }, [user, navigate]);

  const fetchBets = async () => {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .order('bet_date', { ascending: false });

      if (error) throw error;
      setBets((data || []) as Bet[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingBet) {
        const { error } = await supabase
          .from('bets')
          .update({
            bet_date: formData.bet_date,
            sport: formData.sport,
            bet_type: formData.bet_type,
            odds: parseInt(formData.odds),
            stake: parseFloat(formData.stake),
            outcome: formData.outcome,
          })
          .eq('id', editingBet.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Bet updated successfully' });
      } else {
        const { error } = await supabase.from('bets').insert({
          user_id: user.id,
          bet_date: formData.bet_date,
          sport: formData.sport,
          bet_type: formData.bet_type,
          odds: parseInt(formData.odds),
          stake: parseFloat(formData.stake),
          outcome: formData.outcome,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Bet added successfully' });
      }

      setFormData({
        bet_date: new Date().toISOString().split('T')[0],
        sport: '',
        bet_type: '',
        odds: '',
        stake: '',
        outcome: 'pending',
      });
      setEditingBet(null);
      setIsDialogOpen(false);
      fetchBets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bet',
        variant: 'destructive',
      });
    }
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
    setFormData({
      bet_date: bet.bet_date,
      sport: bet.sport,
      bet_type: bet.bet_type,
      odds: bet.odds.toString(),
      stake: bet.stake.toString(),
      outcome: bet.outcome,
    });
    setIsDialogOpen(true);
  };

  const calculateStats = () => {
    const filteredBets = bets.filter((bet) => {
      const sportMatch = filterSport === 'all' || bet.sport === filterSport;
      const outcomeMatch = filterOutcome === 'all' || bet.outcome === filterOutcome;
      return sportMatch && outcomeMatch;
    });

    const totalBets = filteredBets.length;
    const wonBets = filteredBets.filter((b) => b.outcome === 'won').length;
    const lostBets = filteredBets.filter((b) => b.outcome === 'lost').length;
    const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100).toFixed(1) : '0.0';

    const totalStaked = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = filteredBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') {
        const americanOdds = bet.odds;
        const profit = americanOdds > 0 
          ? bet.stake * (americanOdds / 100)
          : bet.stake * (100 / Math.abs(americanOdds));
        return sum + profit;
      } else if (bet.outcome === 'lost') {
        return sum - bet.stake;
      }
      return sum;
    }, 0);

    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0.0';
    const unitsWonLost = (totalProfit / 100).toFixed(2);

    return { totalBets, winRate, totalProfit, roi, unitsWonLost };
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Sport', 'Bet Type', 'Odds', 'Stake', 'Outcome'];
    const rows = bets.map((bet) => [
      bet.bet_date,
      bet.sport,
      bet.bet_type,
      bet.odds,
      bet.stake,
      bet.outcome,
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
  const sports = Array.from(new Set(bets.map((b) => b.sport)));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Bet Tracker</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBet(null);
                setFormData({
                  bet_date: new Date().toISOString().split('T')[0],
                  sport: '',
                  bet_type: '',
                  odds: '',
                  stake: '',
                  outcome: 'pending',
                });
              }}>
                Add Bet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBet ? 'Edit Bet' : 'Add New Bet'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bet_date">Date</Label>
                  <Input
                    id="bet_date"
                    type="date"
                    value={formData.bet_date}
                    onChange={(e) => setFormData({ ...formData, bet_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Input
                    id="sport"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bet_type">Bet Type</Label>
                  <Input
                    id="bet_type"
                    value={formData.bet_type}
                    onChange={(e) => setFormData({ ...formData, bet_type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="odds">Odds (American)</Label>
                  <Input
                    id="odds"
                    type="number"
                    value={formData.odds}
                    onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                    required
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
                <div>
                  <Label htmlFor="outcome">Outcome</Label>
                  <Select value={formData.outcome} onValueChange={(value: any) => setFormData({ ...formData, outcome: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingBet ? 'Update Bet' : 'Add Bet'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
              <CardDescription>Units</CardDescription>
              <CardTitle className={`text-3xl ${parseFloat(stats.unitsWonLost) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.unitsWonLost}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Select value={filterSport} onValueChange={setFilterSport}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Bet Type</TableHead>
                  <TableHead>Odds</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : bets.filter((bet) => {
                  const sportMatch = filterSport === 'all' || bet.sport === filterSport;
                  const outcomeMatch = filterOutcome === 'all' || bet.outcome === filterOutcome;
                  return sportMatch && outcomeMatch;
                }).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No bets found
                    </TableCell>
                  </TableRow>
                ) : (
                  bets
                    .filter((bet) => {
                      const sportMatch = filterSport === 'all' || bet.sport === filterSport;
                      const outcomeMatch = filterOutcome === 'all' || bet.outcome === filterOutcome;
                      return sportMatch && outcomeMatch;
                    })
                    .map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>{bet.bet_date}</TableCell>
                        <TableCell>{bet.sport}</TableCell>
                        <TableCell>{bet.bet_type}</TableCell>
                        <TableCell>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</TableCell>
                        <TableCell>${bet.stake}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              bet.outcome === 'won'
                                ? 'bg-green-500/20 text-green-500'
                                : bet.outcome === 'lost'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}
                          >
                            {bet.outcome}
                          </span>
                        </TableCell>
                        <TableCell>
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
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BetTracker;
