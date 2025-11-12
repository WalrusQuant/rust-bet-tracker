-- Create bankroll_settings table
CREATE TABLE public.bankroll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starting_bankroll NUMERIC NOT NULL DEFAULT 1000,
  unit_sizing_method TEXT NOT NULL DEFAULT 'fixed_percent' CHECK (unit_sizing_method IN ('fixed_percent', 'kelly', 'fixed_amount')),
  unit_size_value NUMERIC NOT NULL DEFAULT 2,
  kelly_fraction TEXT NOT NULL DEFAULT 'half' CHECK (kelly_fraction IN ('full', 'half', 'quarter')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.bankroll_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bankroll settings"
ON public.bankroll_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bankroll settings"
ON public.bankroll_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bankroll settings"
ON public.bankroll_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_bankroll_settings_updated_at
BEFORE UPDATE ON public.bankroll_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();