import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sportsbook } from '@/types';

export function useSportsbooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sportsbooks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('sportsbooks')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Sportsbook[];
    },
    enabled: !!user,
  });
}

export function useCreateSportsbook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('sportsbooks')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Sportsbook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sportsbooks'] });
    },
  });
}
