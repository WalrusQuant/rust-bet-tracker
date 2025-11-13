-- Create strategies table
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on strategies
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies for strategies
CREATE POLICY "Users can view their own strategies" 
ON public.strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own strategies" 
ON public.strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies" 
ON public.strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies" 
ON public.strategies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create bet_strategies junction table for many-to-many relationship
CREATE TABLE public.bet_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bet_id, strategy_id)
);

-- Enable RLS on bet_strategies
ALTER TABLE public.bet_strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies for bet_strategies (users can manage strategies for their own bets)
CREATE POLICY "Users can view their own bet strategies" 
ON public.bet_strategies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = bet_strategies.bet_id 
    AND bets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own bet strategies" 
ON public.bet_strategies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = bet_strategies.bet_id 
    AND bets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own bet strategies" 
ON public.bet_strategies 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = bet_strategies.bet_id 
    AND bets.user_id = auth.uid()
  )
);