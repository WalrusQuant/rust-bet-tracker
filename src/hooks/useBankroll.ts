import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BankrollSettings, Transaction } from '@/types';

const DEFAULT_BANKROLL_SETTINGS: BankrollSettings = {
  starting_bankroll: 1000,
  unit_sizing_method: 'fixed_percent',
  unit_size_value: 2,
  kelly_fraction: 'half',
};

export function useBankrollSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bankrollSettings', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_BANKROLL_SETTINGS;

      const { data, error } = await supabase
        .from('bankroll_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          starting_bankroll: Number(data.starting_bankroll),
          unit_sizing_method: data.unit_sizing_method,
          unit_size_value: Number(data.unit_size_value),
          kelly_fraction: data.kelly_fraction,
        } as BankrollSettings;
      }

      return DEFAULT_BANKROLL_SETTINGS;
    },
    enabled: !!user,
  });
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useUpdateBankrollSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<BankrollSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bankroll_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankrollSettings'] });
    },
  });
}
