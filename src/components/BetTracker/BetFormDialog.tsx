import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { calculateRecommendedStake } from '@/lib/bankrollUtils';
import { Bet, BetFormData, BetOutcome, Sportsbook, League, BetType, Strategy, BankrollSettings } from '@/types';

interface BetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingBet: Bet | null;
  onSubmit: (formData: BetFormData, selectedDate: Date) => Promise<void>;
  sportsbooks: Sportsbook[];
  leagues: League[];
  betTypes: BetType[];
  strategies: Strategy[];
  onCreateSportsbook: (name: string) => Promise<Sportsbook>;
  onCreateLeague: (name: string) => Promise<League>;
  onCreateBetType: (name: string) => Promise<BetType>;
  onCreateStrategy: (name: string) => Promise<Strategy>;
  bankrollSettings: BankrollSettings | null;
  currentBankroll: number;
}

const INITIAL_FORM_DATA: BetFormData = {
  sportsbook_id: '',
  league_id: '',
  bet_type_id: '',
  odds: '',
  fair_odds: '',
  closing_odds: '',
  stake: '',
  outcome: 'pending',
  notes: '',
  strategy_id: 'none',
};

export function BetFormDialog({
  isOpen,
  onOpenChange,
  editingBet,
  onSubmit,
  sportsbooks,
  leagues,
  betTypes,
  strategies,
  onCreateSportsbook,
  onCreateLeague,
  onCreateBetType,
  onCreateStrategy,
  bankrollSettings,
  currentBankroll,
}: BetFormDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState<BetFormData>(INITIAL_FORM_DATA);

  // New tag creation state
  const [newSportsbook, setNewSportsbook] = useState('');
  const [newLeague, setNewLeague] = useState('');
  const [newBetType, setNewBetType] = useState('');
  const [newStrategy, setNewStrategy] = useState('');
  const [showNewSportsbook, setShowNewSportsbook] = useState(false);
  const [showNewLeague, setShowNewLeague] = useState(false);
  const [showNewBetType, setShowNewBetType] = useState(false);
  const [showNewStrategy, setShowNewStrategy] = useState(false);

  // Sync form state when editingBet changes
  useEffect(() => {
    if (editingBet) {
      const strategyId = editingBet.bet_strategies?.[0]?.strategies.id || 'none';
      setSelectedDate(new Date(editingBet.bet_date));
      setFormData({
        sportsbook_id: editingBet.sportsbook_id || '',
        league_id: editingBet.league_id || '',
        bet_type_id: editingBet.bet_type_id || '',
        odds: editingBet.odds.toString(),
        fair_odds: editingBet.fair_odds?.toString() || '',
        closing_odds: editingBet.closing_odds?.toString() || '',
        stake: editingBet.stake.toString(),
        outcome: editingBet.outcome,
        notes: editingBet.notes || '',
        strategy_id: strategyId,
      });
    } else {
      resetForm();
    }
  }, [editingBet]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedDate(new Date());
    setShowNewSportsbook(false);
    setShowNewLeague(false);
    setShowNewBetType(false);
    setShowNewStrategy(false);
    setNewSportsbook('');
    setNewLeague('');
    setNewBetType('');
    setNewStrategy('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, selectedDate);
    resetForm();
    onOpenChange(false);
  };

  const handleCreateSportsbook = async () => {
    if (!newSportsbook.trim()) return;
    const created = await onCreateSportsbook(newSportsbook.trim());
    setFormData({ ...formData, sportsbook_id: created.id });
    setNewSportsbook('');
    setShowNewSportsbook(false);
  };

  const handleCreateLeague = async () => {
    if (!newLeague.trim()) return;
    const created = await onCreateLeague(newLeague.trim());
    setFormData({ ...formData, league_id: created.id });
    setNewLeague('');
    setShowNewLeague(false);
  };

  const handleCreateBetType = async () => {
    if (!newBetType.trim()) return;
    const created = await onCreateBetType(newBetType.trim());
    setFormData({ ...formData, bet_type_id: created.id });
    setNewBetType('');
    setShowNewBetType(false);
  };

  const handleCreateStrategy = async () => {
    if (!newStrategy.trim()) return;
    const created = await onCreateStrategy(newStrategy.trim());
    setFormData({ ...formData, strategy_id: created.id });
    setNewStrategy('');
    setShowNewStrategy(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
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
                <Button type="button" onClick={handleCreateSportsbook}>Add</Button>
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
                <Button type="button" onClick={handleCreateLeague}>Add</Button>
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
                <Button type="button" onClick={handleCreateBetType}>Add</Button>
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
              {bankrollSettings && currentBankroll > 0 && (
                <div className="mb-2 p-2 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">
                        Recommended: ${calculateRecommendedStake(
                          currentBankroll,
                          bankrollSettings,
                          formData.odds ? parseInt(formData.odds) : undefined,
                          formData.fair_odds ? parseInt(formData.fair_odds) : undefined
                        ).amount.toFixed(2)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {calculateRecommendedStake(
                          currentBankroll,
                          bankrollSettings,
                          formData.odds ? parseInt(formData.odds) : undefined,
                          formData.fair_odds ? parseInt(formData.fair_odds) : undefined
                        ).explanation}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const recommended = calculateRecommendedStake(
                          currentBankroll,
                          bankrollSettings,
                          formData.odds ? parseInt(formData.odds) : undefined,
                          formData.fair_odds ? parseInt(formData.fair_odds) : undefined
                        );
                        setFormData({ ...formData, stake: recommended.amount.toFixed(2) });
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              )}
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
            <Select value={formData.outcome} onValueChange={(value: BetOutcome) => setFormData({ ...formData, outcome: value })}>
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
            <Label>Strategy Tag (Optional)</Label>
            {showNewStrategy ? (
              <div className="flex gap-2">
                <Input
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  placeholder="Enter strategy name"
                />
                <Button type="button" onClick={handleCreateStrategy}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewStrategy(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={formData.strategy_id} onValueChange={(value) => setFormData({ ...formData, strategy_id: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select strategy (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>{strategy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setShowNewStrategy(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
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
  );
}
