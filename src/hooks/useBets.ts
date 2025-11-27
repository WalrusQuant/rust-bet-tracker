import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bet, BetFormData, BetStrategy } from '@/types';
import { format } from 'date-fns';

interface CreateBetParams {
  formData: BetFormData;
  selectedDate: Date;
}

interface UpdateBetParams {
  id: string;
  formData: BetFormData;
  selectedDate: Date;
}

export function useBets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bets', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch bets with joined relations
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          sportsbooks(name),
          leagues(name),
          bet_types(name)
        `)
        .order('bet_date', { ascending: false });

      if (betsError) throw betsError;
      if (!betsData || betsData.length === 0) return [];

      // Batch fetch all strategies for all bets in a single query (fixes N+1)
      const betIds = betsData.map(bet => bet.id);
      const { data: strategiesData, error: strategiesError } = await (supabase as any)
        .from('bet_strategies')
        .select('bet_id, strategy_id, strategies(id, name)')
        .in('bet_id', betIds);

      if (strategiesError) throw strategiesError;

      // Group strategies by bet_id
      const strategiesByBetId = (strategiesData || []).reduce((acc: Record<string, BetStrategy[]>, item: any) => {
        if (!acc[item.bet_id]) {
          acc[item.bet_id] = [];
        }
        acc[item.bet_id].push({
          bet_id: item.bet_id,
          strategy_id: item.strategy_id,
          strategies: item.strategies,
        });
        return acc;
      }, {});

      // Merge strategies into bets
      const betsWithStrategies = betsData.map(bet => ({
        ...bet,
        bet_strategies: strategiesByBetId[bet.id] || [],
      }));

      return betsWithStrategies as Bet[];
    },
    enabled: !!user,
  });
}

export function useCreateBet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, selectedDate }: CreateBetParams) => {
      if (!user) throw new Error('User not authenticated');

      const betData = {
        user_id: user.id,
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

      const { data: newBet, error } = await supabase
        .from('bets')
        .insert(betData)
        .select()
        .single();

      if (error) throw error;

      // Insert strategy if selected
      if (formData.strategy_id && formData.strategy_id !== 'none' && newBet) {
        await (supabase as any).from('bet_strategies').insert({
          bet_id: newBet.id,
          strategy_id: formData.strategy_id,
        });
      }

      return newBet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
    },
  });
}

export function useUpdateBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData, selectedDate }: UpdateBetParams) => {
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

      const { error } = await supabase
        .from('bets')
        .update(betData)
        .eq('id', id);

      if (error) throw error;

      // Delete existing strategies and insert new one
      await (supabase as any).from('bet_strategies').delete().eq('bet_id', id);
      if (formData.strategy_id && formData.strategy_id !== 'none') {
        await (supabase as any).from('bet_strategies').insert({
          bet_id: id,
          strategy_id: formData.strategy_id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
    },
  });
}

export function useDeleteBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
    },
  });
}
