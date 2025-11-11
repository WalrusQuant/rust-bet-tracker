-- Create tables for user-defined tags
CREATE TABLE public.sportsbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE public.bet_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on tag tables
ALTER TABLE public.sportsbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for sportsbooks
CREATE POLICY "Users can view their own sportsbooks"
  ON public.sportsbooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sportsbooks"
  ON public.sportsbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sportsbooks"
  ON public.sportsbooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sportsbooks"
  ON public.sportsbooks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for leagues
CREATE POLICY "Users can view their own leagues"
  ON public.leagues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leagues"
  ON public.leagues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leagues"
  ON public.leagues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leagues"
  ON public.leagues FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for bet_types
CREATE POLICY "Users can view their own bet_types"
  ON public.bet_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bet_types"
  ON public.bet_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bet_types"
  ON public.bet_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bet_types"
  ON public.bet_types FOR DELETE
  USING (auth.uid() = user_id);

-- Update bets table with new columns
ALTER TABLE public.bets 
  ADD COLUMN sportsbook_id UUID REFERENCES public.sportsbooks(id) ON DELETE SET NULL,
  ADD COLUMN league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  ADD COLUMN bet_type_id UUID REFERENCES public.bet_types(id) ON DELETE SET NULL,
  ADD COLUMN fair_odds INTEGER,
  ADD COLUMN closing_odds INTEGER;

-- Update outcome column to include 'push'
ALTER TABLE public.bets 
  DROP CONSTRAINT IF EXISTS bets_outcome_check;

ALTER TABLE public.bets 
  ADD CONSTRAINT bets_outcome_check 
  CHECK (outcome IN ('pending', 'won', 'lost', 'push'));

-- Drop old columns that are now replaced by foreign keys
ALTER TABLE public.bets 
  DROP COLUMN IF EXISTS sport,
  DROP COLUMN IF EXISTS bet_type;