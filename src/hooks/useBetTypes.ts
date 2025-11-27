import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BetType } from '@/types';

export function useBetTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['betTypes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bet_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as BetType[];
    },
    enabled: !!user,
  });
}

export function useCreateBetType() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('bet_types')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as BetType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betTypes'] });
    },
  });
}
