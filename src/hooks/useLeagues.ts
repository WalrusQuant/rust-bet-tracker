import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { League } from '@/types';

export function useLeagues() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leagues', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as League[];
    },
    enabled: !!user,
  });
}

export function useCreateLeague() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('leagues')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as League;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
    },
  });
}
