import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useBets, useCreateBet, useUpdateBet, useDeleteBet } from '@/hooks/useBets';
import { useSportsbooks, useCreateSportsbook } from '@/hooks/useSportsbooks';
import { useLeagues, useCreateLeague } from '@/hooks/useLeagues';
import { useBetTypes, useCreateBetType } from '@/hooks/useBetTypes';
import { useStrategies, useCreateStrategy } from '@/hooks/useStrategies';
import { useBankrollSettings, useTransactions } from '@/hooks/useBankroll';
import {
  BetStats,
  BetTable,
  BetFilters,
  BetFormDialog,
  BetDetailsDialog,
  DeleteConfirmDialog,
} from '@/components/BetTracker';
import { Bet, BetFormData, FilterState, BetStats as BetStatsType } from '@/types';
import { calculateEV, calculateCLV, calculateProfit } from '@/lib/oddsUtils';
import { z } from 'zod';

const betImportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  sportsbook: z.string().trim().min(1, 'Sportsbook is required').max(100, 'Sportsbook name too long'),
  league: z.string().trim().min(1, 'League is required').max(100, 'League name too long'),
  betType: z.string().trim().min(1, 'Bet type is required').max(100, 'Bet type name too long'),
  odds: z.number().int('Odds must be a whole number').min(-10000, 'Odds too low').max(10000, 'Odds too high'),
  fairOdds: z.number().int('Fair odds must be a whole number').min(-10000, 'Fair odds too low').max(10000, 'Fair odds too high').nullable(),
  closingOdds: z.number().int('Closing odds must be a whole number').min(-10000, 'Closing odds too low').max(10000, 'Closing odds too high').nullable(),
  stake: z.number().positive('Stake must be positive').max(1000000, 'Stake too large'),
  outcome: z.enum(['won', 'lost', 'push', 'pending'], { errorMap: () => ({ message: 'Outcome must be won, lost, push, or pending' }) }),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

const BetTracker = () => {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  // Data fetching hooks
  const { data: bets = [], isLoading: betsLoading, refetch: refetchBets } = useBets();
  const { data: sportsbooks = [] } = useSportsbooks();
  const { data: leagues = [] } = useLeagues();
  const { data: betTypes = [] } = useBetTypes();
  const { data: strategies = [] } = useStrategies();
  const { data: bankrollSettings } = useBankrollSettings();
  const { data: transactions = [] } = useTransactions();

  // Mutation hooks
  const createBet = useCreateBet();
  const updateBet = useUpdateBet();
  const deleteBet = useDeleteBet();
  const createSportsbook = useCreateSportsbook();
  const createLeague = useCreateLeague();
  const createBetType = useCreateBetType();
  const createStrategy = useCreateStrategy();

  // UI State
  const [filters, setFilters] = useState<FilterState>({
    sportsbook: 'all',
    league: 'all',
    betType: 'all',
    outcome: 'all',
  });
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [viewingBet, setViewingBet] = useState<Bet | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Calculate current bankroll with memoization
  const currentBankroll = useMemo(() => {
    if (!bankrollSettings) return 0;

    const totalDeposits = transactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalWithdrawals = transactions
      .filter(t => t.transaction_type === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const settledBets = bets.filter(b => b.outcome === 'won' || b.outcome === 'lost');
    const netBettingProfit = settledBets.reduce((sum, bet) => {
      if (bet.outcome === 'won') {
        return sum + calculateProfit(bet.odds, Number(bet.stake));
      } else {
        return sum - Number(bet.stake);
      }
    }, 0);

    return bankrollSettings.starting_bankroll + totalDeposits - totalWithdrawals + netBettingProfit;
  }, [bets, transactions, bankrollSettings]);

  // Filter bets with memoization
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      const sportsbookMatch = filters.sportsbook === 'all' || bet.sportsbook_id === filters.sportsbook;
      const leagueMatch = filters.league === 'all' || bet.league_id === filters.league;
      const betTypeMatch = filters.betType === 'all' || bet.bet_type_id === filters.betType;
      const outcomeMatch = filters.outcome === 'all' || bet.outcome === filters.outcome;
      return sportsbookMatch && leagueMatch && betTypeMatch && outcomeMatch;
    });
  }, [bets, filters]);

  // Calculate stats with memoization
  const stats = useMemo((): BetStatsType => {
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

    const betsWithEV = filteredBets.filter(b => b.fair_odds !== null);
    const avgEV = betsWithEV.length > 0
      ? (betsWithEV.reduce((sum, bet) => {
          return sum + calculateEV(bet.odds, bet.fair_odds!, bet.stake);
        }, 0) / betsWithEV.length).toFixed(2)
      : '0.00';

    const betsWithCLV = filteredBets.filter(b => b.closing_odds !== null);
    const avgCLV = betsWithCLV.length > 0
      ? (betsWithCLV.reduce((sum, bet) => {
          return sum + calculateCLV(bet.odds, bet.closing_odds!);
        }, 0) / betsWithCLV.length).toFixed(2)
      : '0.00';

    return { totalBets, winRate, totalProfit, roi, avgEV, avgCLV };
  }, [filteredBets]);

  // Handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitBet = useCallback(async (formData: BetFormData, selectedDate: Date) => {
    try {
      if (editingBet) {
        await updateBet.mutateAsync({ id: editingBet.id, formData, selectedDate });
        toast({ title: 'Success', description: 'Bet updated successfully' });
      } else {
        await createBet.mutateAsync({ formData, selectedDate });
        toast({ title: 'Success', description: 'Bet added successfully' });
      }
      setEditingBet(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save bet', variant: 'destructive' });
    }
  }, [editingBet, createBet, updateBet, toast]);

  const handleEdit = useCallback((bet: Bet) => {
    setEditingBet(bet);
    setIsFormDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteBet.mutateAsync(deleteConfirmId);
      toast({ title: 'Success', description: 'Bet deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bet', variant: 'destructive' });
    }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, deleteBet, toast]);

  const handleView = useCallback((bet: Bet) => {
    setViewingBet(bet);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleCreateSportsbook = useCallback(async (name: string) => {
    const result = await createSportsbook.mutateAsync(name);
    toast({ title: 'Success', description: 'Sportsbook added' });
    return result;
  }, [createSportsbook, toast]);

  const handleCreateLeague = useCallback(async (name: string) => {
    const result = await createLeague.mutateAsync(name);
    toast({ title: 'Success', description: 'League added' });
    return result;
  }, [createLeague, toast]);

  const handleCreateBetType = useCallback(async (name: string) => {
    const result = await createBetType.mutateAsync(name);
    toast({ title: 'Success', description: 'Bet type added' });
    return result;
  }, [createBetType, toast]);

  const handleCreateStrategy = useCallback(async (name: string) => {
    const result = await createStrategy.mutateAsync(name);
    toast({ title: 'Success', description: 'Strategy added' });
    return result;
  }, [createStrategy, toast]);

  const downloadTemplate = useCallback(() => {
    const headers = ['Date', 'Sportsbook', 'League', 'Bet Type', 'Betting Odds', 'Fair Odds', 'Closing Odds', 'Stake', 'Status', 'Note'];
    const exampleRow = ['2025-11-02', 'DraftKings', 'NBA', 'Spread', '-110', '-110', '-106', '20', 'won', 'Lakers -5.5'];

    const csvContent = [
      headers.join(','),
      exampleRow.join(','),
      ',,,,,,,,,',
      ',,,,,,,,,',
      ',,,,,,,,,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bet_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const dataLines = lines.slice(1);

      const betsToImport: Array<{
        date: string;
        sportsbook: string;
        league: string;
        betType: string;
        odds: number;
        fairOdds: number | null;
        closingOdds: number | null;
        stake: number;
        outcome: string;
        notes: string;
      }> = [];

      const validationErrors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const columns = line.split(',').map(col => col.trim());
        if (columns.length < 9 || !columns[0]) continue;

        const rowData = {
          date: columns[0],
          sportsbook: columns[1],
          league: columns[2],
          betType: columns[3],
          odds: parseInt(columns[4]),
          fairOdds: columns[5] ? parseInt(columns[5]) : null,
          closingOdds: columns[6] ? parseInt(columns[6]) : null,
          stake: parseFloat(columns[7]),
          outcome: columns[8].toLowerCase(),
          notes: columns[9] || '',
        };

        const result = betImportSchema.safeParse(rowData);
        if (!result.success) {
          validationErrors.push(`Row ${i + 2}: ${result.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        betsToImport.push(rowData);
      }

      if (validationErrors.length > 0) {
        toast({
          title: 'Validation Errors',
          description: `Found ${validationErrors.length} invalid rows. First error: ${validationErrors[0]}`,
          variant: 'destructive',
        });
        setIsImporting(false);
        return;
      }

      if (betsToImport.length === 0) {
        throw new Error('No valid bets found in file');
      }

      const sportsbookMap = new Map<string, string>();
      const leagueMap = new Map<string, string>();
      const betTypeMap = new Map<string, string>();

      const uniqueSportsbooks = [...new Set(betsToImport.map(b => b.sportsbook))];
      for (const name of uniqueSportsbooks) {
        const existing = sportsbooks.find(s => s.name === name);
        if (existing) {
          sportsbookMap.set(name, existing.id);
        } else {
          const { data, error } = await supabase
            .from('sportsbooks')
            .insert({ name, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          sportsbookMap.set(name, data.id);
        }
      }

      const uniqueLeagues = [...new Set(betsToImport.map(b => b.league))];
      for (const name of uniqueLeagues) {
        const existing = leagues.find(l => l.name === name);
        if (existing) {
          leagueMap.set(name, existing.id);
        } else {
          const { data, error } = await supabase
            .from('leagues')
            .insert({ name, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          leagueMap.set(name, data.id);
        }
      }

      const uniqueBetTypes = [...new Set(betsToImport.map(b => b.betType))];
      for (const name of uniqueBetTypes) {
        const existing = betTypes.find(bt => bt.name === name);
        if (existing) {
          betTypeMap.set(name, existing.id);
        } else {
          const { data, error } = await supabase
            .from('bet_types')
            .insert({ name, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          betTypeMap.set(name, data.id);
        }
      }

      const betsToInsert = betsToImport.map(bet => ({
        user_id: user.id,
        bet_date: bet.date,
        sportsbook_id: sportsbookMap.get(bet.sportsbook),
        league_id: leagueMap.get(bet.league),
        bet_type_id: betTypeMap.get(bet.betType),
        odds: bet.odds,
        fair_odds: bet.fairOdds,
        closing_odds: bet.closingOdds,
        stake: bet.stake,
        outcome: bet.outcome,
        notes: bet.notes,
      }));

      const { error } = await supabase.from('bets').insert(betsToInsert);
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Imported ${betsToImport.length} bets successfully`,
      });

      refetchBets();

      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: 'Failed to import bets. Please check your CSV format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [user, sportsbooks, leagues, betTypes, toast, refetchBets]);

  const exportToCSV = useCallback(() => {
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
  }, [bets]);

  const handleImportClick = useCallback(() => {
    document.getElementById('csv-upload')?.click();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Professional Bet Tracker</h1>
          <BetFormDialog
            isOpen={isFormDialogOpen}
            onOpenChange={(open) => {
              setIsFormDialogOpen(open);
              if (!open) setEditingBet(null);
            }}
            editingBet={editingBet}
            onSubmit={handleSubmitBet}
            sportsbooks={sportsbooks}
            leagues={leagues}
            betTypes={betTypes}
            strategies={strategies}
            onCreateSportsbook={handleCreateSportsbook}
            onCreateLeague={handleCreateLeague}
            onCreateBetType={handleCreateBetType}
            onCreateStrategy={handleCreateStrategy}
            bankrollSettings={bankrollSettings || null}
            currentBankroll={currentBankroll}
          />
        </div>

        <BetStats stats={stats} />

        <BetFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          sportsbooks={sportsbooks}
          leagues={leagues}
          betTypes={betTypes}
          onExport={exportToCSV}
          onImport={handleImportClick}
          onDownloadTemplate={downloadTemplate}
          isImporting={isImporting}
        />

        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <BetTable
          bets={filteredBets}
          isLoading={betsLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <BetDetailsDialog
          bet={viewingBet}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onEdit={handleEdit}
        />

        <DeleteConfirmDialog
          isOpen={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
};

export default BetTracker;
