import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateProfit } from '@/lib/oddsUtils';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Target, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BankrollSettings {
  starting_bankroll: number;
  unit_sizing_method: 'fixed_percent' | 'kelly' | 'fixed_amount' | 'fractional_kelly';
  unit_size_value: number;
  kelly_fraction: 'full' | 'half' | 'quarter';
}

interface Bet {
  id: string;
  bet_date: string;
  odds: number;
  fair_odds: number | null;
  stake: number;
  outcome: string;
}

interface Transaction {
  id: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  transaction_date: string;
  sportsbook_id: string | null;
  notes: string | null;
  sportsbooks?: { name: string } | null;
}

interface Sportsbook {
  id: string;
  name: string;
}

const Bankroll = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<BankrollSettings>({
    starting_bankroll: 1000,
    unit_sizing_method: 'fixed_percent',
    unit_size_value: 2,
    kelly_fraction: 'half',
  });
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState<BankrollSettings>(settings);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'deposit' as 'deposit' | 'withdrawal',
    amount: '',
    sportsbook_id: 'none',
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBankrollSettings();
    fetchBets();
    fetchTransactions();
    fetchSportsbooks();
  }, [user, navigate]);

  const fetchBankrollSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('bankroll_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const loadedSettings = {
          starting_bankroll: Number(data.starting_bankroll),
          unit_sizing_method: data.unit_sizing_method as 'fixed_percent' | 'kelly' | 'fixed_amount' | 'fractional_kelly',
          unit_size_value: Number(data.unit_size_value),
          kelly_fraction: data.kelly_fraction as 'full' | 'half' | 'quarter',
        };
        setSettings(loadedSettings);
        setTempSettings(loadedSettings);
      } else {
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error fetching bankroll settings:', error);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const { error } = await supabase
        .from('bankroll_settings')
        .insert({
          user_id: user?.id,
          starting_bankroll: 1000,
          unit_sizing_method: 'fixed_percent',
          unit_size_value: 2,
          kelly_fraction: 'half',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const fetchBets = async () => {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('id, bet_date, odds, fair_odds, stake, outcome')
        .order('bet_date', { ascending: true });

      if (error) throw error;
      setBets((data || []) as Bet[]);
    } catch (error) {
      console.error('Error fetching bets:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*, sportsbooks(name)')
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      console.error('Error fetching sportsbooks:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('bankroll_settings')
        .upsert({
          user_id: user?.id,
          starting_bankroll: tempSettings.starting_bankroll,
          unit_sizing_method: tempSettings.unit_sizing_method,
          unit_size_value: tempSettings.unit_size_value,
          kelly_fraction: tempSettings.kelly_fraction,
        });

      if (error) throw error;

      setSettings(tempSettings);
      setIsEditing(false);
      toast({
        title: "Settings saved",
        description: "Your bankroll settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = async () => {
    try {
      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await (supabase as any)
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: transactionForm.transaction_type,
          amount,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          sportsbook_id: transactionForm.sportsbook_id && transactionForm.sportsbook_id !== 'none' ? transactionForm.sportsbook_id : null,
          notes: transactionForm.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Transaction added",
        description: `${transactionForm.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${amount} recorded.`,
      });

      setIsTransactionDialogOpen(false);
      setTransactionForm({
        transaction_type: 'deposit',
        amount: '',
        sportsbook_id: 'none',
        notes: '',
      });
      setTransactionDate(new Date());
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction.",
        variant: "destructive",
      });
    }
  };

  // Calculate metrics
  const totalDeposits = transactions.filter(t => t.transaction_type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawals = transactions.filter(t => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalProfitLoss = bets.reduce((sum, bet) => {
    if (bet.outcome === 'won') return sum + calculateProfit(bet.odds, bet.stake);
    if (bet.outcome === 'lost') return sum - bet.stake;
    return sum;
  }, 0);

  const currentBankroll = settings.starting_bankroll + totalDeposits - totalWithdrawals + totalProfitLoss;
  
  // Calculate history
  const bankrollHistory: { date: string; bankroll: number }[] = [];
  let runningBankroll = settings.starting_bankroll;
  bankrollHistory.push({ date: 'Start', bankroll: runningBankroll });

  const timeline = [
    ...bets.map(bet => ({ date: bet.bet_date, type: 'bet' as const, data: bet })),
    ...transactions.map(t => ({ date: t.transaction_date, type: 'transaction' as const, data: t }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  timeline.forEach(item => {
    if (item.type === 'bet') {
      const bet = item.data as Bet;
      if (bet.outcome === 'won') runningBankroll += calculateProfit(bet.odds, bet.stake);
      else if (bet.outcome === 'lost') runningBankroll -= bet.stake;
    } else {
      const transaction = item.data as Transaction;
      if (transaction.transaction_type === 'deposit') runningBankroll += Number(transaction.amount);
      else runningBankroll -= Number(transaction.amount);
    }
    bankrollHistory.push({ date: format(new Date(item.date), 'MMM dd'), bankroll: Number(runningBankroll.toFixed(2)) });
  });

  const allTimeHigh = Math.max(...bankrollHistory.map(h => h.bankroll));
  const currentDrawdown = ((currentBankroll - allTimeHigh) / allTimeHigh) * 100;
  const roi = settings.starting_bankroll > 0 ? ((totalProfitLoss / settings.starting_bankroll) * 100) : 0;

  const transactionHistory = transactions.map((transaction, index) => {
    let balance = settings.starting_bankroll;
    for (let i = 0; i <= index; i++) {
      if (transactions[i].transaction_type === 'deposit') balance += Number(transactions[i].amount);
      else balance -= Number(transactions[i].amount);
    }
    bets.filter(bet => bet.bet_date <= transaction.transaction_date).forEach(bet => {
      if (bet.outcome === 'won') balance += calculateProfit(bet.odds, bet.stake);
      else if (bet.outcome === 'lost') balance -= bet.stake;
    });
    return { ...transaction, runningBalance: balance };
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>Please sign in to view your bankroll management.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Bankroll Management</h1>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Starting Bankroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${settings.starting_bankroll.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Bankroll</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentBankroll.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {currentBankroll >= settings.starting_bankroll ? '+' : ''}
                ${(currentBankroll - settings.starting_bankroll).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-Time High</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${allTimeHigh.toFixed(2)}</div>
              {currentDrawdown < 0 && <p className="text-xs text-destructive">{currentDrawdown.toFixed(2)}% drawdown</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              {roi >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">+${totalDeposits.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">-${totalWithdrawals.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Betting P/L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bankroll History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bankrollHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bankroll" stroke="hsl(var(--primary))" strokeWidth={2} name="Bankroll" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Deposits and withdrawals</CardDescription>
              </div>
              <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <Select value={transactionForm.transaction_type} onValueChange={(value: 'deposit' | 'withdrawal') => setTransactionForm({ ...transactionForm, transaction_type: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input type="number" step="0.01" value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} placeholder="100.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={transactionDate} onSelect={(date) => date && setTransactionDate(date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Sportsbook/Site (Optional)</Label>
                      <Select value={transactionForm.sportsbook_id} onValueChange={(value) => setTransactionForm({ ...transactionForm, sportsbook_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Select sportsbook" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {sportsbooks.map((sb) => <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea value={transactionForm.notes} onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })} placeholder="Tax refund, etc." rows={3} />
                    </div>
                    <Button onClick={handleAddTransaction} className="w-full">Add Transaction</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {transactionHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sportsbook</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell><span className={transaction.transaction_type === 'deposit' ? 'text-success' : 'text-destructive'}>{transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}</span></TableCell>
                      <TableCell className={transaction.transaction_type === 'deposit' ? 'text-success' : 'text-destructive'}>{transaction.transaction_type === 'deposit' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}</TableCell>
                      <TableCell>{transaction.sportsbooks?.name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.notes || '-'}</TableCell>
                      <TableCell className="text-right font-medium">${transaction.runningBalance.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Bankroll Settings</CardTitle>
            <CardDescription>Configure your unit sizing method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Starting Bankroll ($)</Label>
              <Input type="number" step="0.01" value={isEditing ? tempSettings.starting_bankroll : settings.starting_bankroll} onChange={(e) => setTempSettings({ ...tempSettings, starting_bankroll: parseFloat(e.target.value) || 0 })} disabled={!isEditing} />
              <p className="text-xs text-muted-foreground">One-time initial amount</p>
            </div>
            <div className="space-y-2">
              <Label>Unit Sizing Method</Label>
              <Select value={isEditing ? tempSettings.unit_sizing_method : settings.unit_sizing_method} onValueChange={(value: any) => setTempSettings({ ...tempSettings, unit_sizing_method: value })} disabled={!isEditing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                  <SelectItem value="fixed_percent">Fixed Percentage (%)</SelectItem>
                  <SelectItem value="kelly">Kelly Criterion</SelectItem>
                  <SelectItem value="fractional_kelly">Fractional Kelly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(isEditing ? tempSettings.unit_sizing_method : settings.unit_sizing_method) === 'fixed_amount' && (
              <div className="space-y-2">
                <Label>Fixed Amount ($)</Label>
                <Input type="number" step="0.01" value={isEditing ? tempSettings.unit_size_value : settings.unit_size_value} onChange={(e) => setTempSettings({ ...tempSettings, unit_size_value: parseFloat(e.target.value) || 0 })} disabled={!isEditing} />
              </div>
            )}
            {(isEditing ? tempSettings.unit_sizing_method : settings.unit_sizing_method) === 'fixed_percent' && (
              <div className="space-y-2">
                <Label>Fixed Percentage (%)</Label>
                <Input type="number" step="0.1" value={isEditing ? tempSettings.unit_size_value : settings.unit_size_value} onChange={(e) => setTempSettings({ ...tempSettings, unit_size_value: parseFloat(e.target.value) || 0 })} disabled={!isEditing} />
              </div>
            )}
            {((isEditing ? tempSettings.unit_sizing_method : settings.unit_sizing_method) === 'kelly' || (isEditing ? tempSettings.unit_sizing_method : settings.unit_sizing_method) === 'fractional_kelly') && (
              <div className="space-y-2">
                <Label>Kelly Fraction</Label>
                <Select value={isEditing ? tempSettings.kelly_fraction : settings.kelly_fraction} onValueChange={(value: any) => setTempSettings({ ...tempSettings, kelly_fraction: value })} disabled={!isEditing}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter">Quarter Kelly</SelectItem>
                    <SelectItem value="half">Half Kelly</SelectItem>
                    <SelectItem value="full">Full Kelly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
              ) : (
                <>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                  <Button variant="outline" onClick={() => { setTempSettings(settings); setIsEditing(false); }}>Cancel</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bankroll;
