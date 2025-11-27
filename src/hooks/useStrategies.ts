import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Strategy } from '@/types';

export function useStrategies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategies', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('strategies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Strategy[];
    },
    enabled: !!user,
  });
}

export function useCreateStrategy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await (supabase as any)
        .from('strategies')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    },
  });
}
