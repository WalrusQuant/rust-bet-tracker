-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create bets table
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bet_date date not null,
  sport text not null,
  bet_type text not null,
  odds integer not null,
  stake numeric(10,2) not null,
  outcome text not null check (outcome in ('pending', 'won', 'lost')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.bets enable row level security;

-- Bets policies
create policy "Users can view their own bets"
  on public.bets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bets"
  on public.bets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bets"
  on public.bets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bets"
  on public.bets for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_bets_updated_at
  before update on public.bets
  for each row
  execute function public.update_updated_at_column();