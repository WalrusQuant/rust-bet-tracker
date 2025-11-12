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
import { calculateProfit, calculateEV, americanToImpliedProbability } from '@/lib/oddsUtils';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface BankrollSettings {
  starting_bankroll: number;
  unit_sizing_method: 'fixed_percent' | 'kelly' | 'fixed_amount';
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
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState<BankrollSettings>(settings);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBankrollSettings();
    fetchBets();
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
          unit_sizing_method: data.unit_sizing_method as 'fixed_percent' | 'kelly' | 'fixed_amount',
          unit_size_value: Number(data.unit_size_value),
          kelly_fraction: data.kelly_fraction as 'full' | 'half' | 'quarter',
        };
        setSettings(loadedSettings);
        setTempSettings(loadedSettings);
      } else {
        // Create default settings
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
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(tempSettings);
      setIsEditing(false);
      toast({ title: 'Success', description: 'Bankroll settings updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  };

  // Calculate current bankroll
  const settledBets = bets.filter(bet => bet.outcome === 'won' || bet.outcome === 'lost');
  const totalProfitLoss = settledBets.reduce((sum, bet) => {
    if (bet.outcome === 'won') {
      return sum + calculateProfit(bet.odds, bet.stake);
    } else if (bet.outcome === 'lost') {
      return sum - bet.stake;
    }
    return sum;
  }, 0);

  const currentBankroll = settings.starting_bankroll + totalProfitLoss;

  // Calculate bankroll history for chart
  const bankrollHistory = settledBets.reduce((acc, bet, index) => {
    let profit = 0;
    if (bet.outcome === 'won') {
      profit = calculateProfit(bet.odds, bet.stake);
    } else if (bet.outcome === 'lost') {
      profit = -bet.stake;
    }

    const previousBankroll = index === 0 ? settings.starting_bankroll : acc[index - 1].bankroll;
    const newBankroll = previousBankroll + profit;

    acc.push({
      date: format(new Date(bet.bet_date), 'MM/dd'),
      bankroll: Number(newBankroll.toFixed(2)),
    });

    return acc;
  }, [] as Array<{ date: string; bankroll: number }>);

  // Calculate all-time high and drawdown
  const allTimeHigh = Math.max(settings.starting_bankroll, ...bankrollHistory.map(h => h.bankroll));
  const currentDrawdown = allTimeHigh > currentBankroll 
    ? ((allTimeHigh - currentBankroll) / allTimeHigh) * 100 
    : 0;

  // Calculate ROI
  const roi = ((currentBankroll - settings.starting_bankroll) / settings.starting_bankroll) * 100;

  // Calculate recommended unit size
  const getRecommendedBetSize = (betOdds?: number, fairOdds?: number): number => {
    if (settings.unit_sizing_method === 'fixed_amount') {
      return settings.unit_size_value;
    }

    if (settings.unit_sizing_method === 'fixed_percent') {
      return (currentBankroll * settings.unit_size_value) / 100;
    }

    // Kelly Criterion
    if (betOdds && fairOdds) {
      const fairProb = americanToImpliedProbability(fairOdds);
      const decimalOdds = betOdds > 0 ? (betOdds / 100) + 1 : (100 / Math.abs(betOdds)) + 1;
      const kellyFraction = fairProb - ((1 - fairProb) / (decimalOdds - 1));
      
      let adjustedKelly = kellyFraction;
      if (settings.kelly_fraction === 'half') adjustedKelly = kellyFraction / 2;
      if (settings.kelly_fraction === 'quarter') adjustedKelly = kellyFraction / 4;

      // Cap at 10% of bankroll for safety
      const recommendedPercent = Math.max(0, Math.min(adjustedKelly * 100, 10));
      return (currentBankroll * recommendedPercent) / 100;
    }

    return (currentBankroll * 2) / 100; // Default to 2% if no odds provided
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>Please sign in to manage your bankroll.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bankroll Management</h1>
          <p className="text-muted-foreground">Track and optimize your betting bankroll</p>
        </div>

        {/* Bankroll Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Starting Bankroll
              </CardDescription>
              <CardTitle className="text-3xl">${settings.starting_bankroll.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Current Bankroll
              </CardDescription>
              <CardTitle className={`text-3xl ${currentBankroll >= settings.starting_bankroll ? 'text-green-500' : 'text-red-500'}`}>
                ${currentBankroll.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                {roi >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                ROI
              </CardDescription>
              <CardTitle className={`text-3xl ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {roi.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                All-Time High
              </CardDescription>
              <CardTitle className="text-3xl">${allTimeHigh.toFixed(2)}</CardTitle>
              {currentDrawdown > 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Drawdown: -{currentDrawdown.toFixed(1)}%
                </p>
              )}
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Bankroll History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Bankroll History</CardTitle>
              <CardDescription>Track your bankroll growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              {bankrollHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No bet history yet. Start tracking bets to see your bankroll growth.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bankrollHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bankroll" stroke="hsl(var(--primary))" name="Bankroll ($)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Unit Size Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Unit Size</CardTitle>
              <CardDescription>Based on your current settings and bankroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Method</Label>
                <p className="text-2xl font-bold">
                  {settings.unit_sizing_method === 'fixed_percent' && `${settings.unit_size_value}% of Bankroll`}
                  {settings.unit_sizing_method === 'fixed_amount' && `$${settings.unit_size_value} Fixed`}
                  {settings.unit_sizing_method === 'kelly' && `Kelly Criterion (${settings.kelly_fraction})`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Recommended Bet Size</Label>
                <p className="text-3xl font-bold text-primary">
                  ${getRecommendedBetSize().toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {((getRecommendedBetSize() / currentBankroll) * 100).toFixed(2)}% of current bankroll
                </p>
              </div>

              {settings.unit_sizing_method === 'kelly' && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Kelly sizing requires Fair Odds. The recommended size will adjust based on the EV of each bet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bankroll Settings</CardTitle>
                <CardDescription>Configure your bankroll management preferences</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="starting_bankroll">Starting Bankroll ($)</Label>
              <Input
                id="starting_bankroll"
                type="number"
                step="0.01"
                value={tempSettings.starting_bankroll}
                onChange={(e) => setTempSettings({ ...tempSettings, starting_bankroll: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_sizing_method">Unit Sizing Method</Label>
              <Select
                value={tempSettings.unit_sizing_method}
                onValueChange={(value: 'fixed_percent' | 'kelly' | 'fixed_amount') =>
                  setTempSettings({ ...tempSettings, unit_sizing_method: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_percent">Fixed Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Dollar Amount</SelectItem>
                  <SelectItem value="kelly">Kelly Criterion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tempSettings.unit_sizing_method === 'fixed_percent' && (
              <div className="space-y-2">
                <Label htmlFor="unit_size_value">Percentage of Bankroll (%)</Label>
                <Input
                  id="unit_size_value"
                  type="number"
                  step="0.1"
                  value={tempSettings.unit_size_value}
                  onChange={(e) => setTempSettings({ ...tempSettings, unit_size_value: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                />
              </div>
            )}

            {tempSettings.unit_sizing_method === 'fixed_amount' && (
              <div className="space-y-2">
                <Label htmlFor="unit_size_value">Fixed Bet Amount ($)</Label>
                <Input
                  id="unit_size_value"
                  type="number"
                  step="0.01"
                  value={tempSettings.unit_size_value}
                  onChange={(e) => setTempSettings({ ...tempSettings, unit_size_value: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                />
              </div>
            )}

            {tempSettings.unit_sizing_method === 'kelly' && (
              <div className="space-y-2">
                <Label htmlFor="kelly_fraction">Kelly Fraction (Risk Tolerance)</Label>
                <Select
                  value={tempSettings.kelly_fraction}
                  onValueChange={(value: 'full' | 'half' | 'quarter') =>
                    setTempSettings({ ...tempSettings, kelly_fraction: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Kelly (Aggressive)</SelectItem>
                    <SelectItem value="half">Half Kelly (Moderate)</SelectItem>
                    <SelectItem value="quarter">Quarter Kelly (Conservative)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSettings(settings);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bankroll;
