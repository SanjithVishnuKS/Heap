create extension if not exists vector with schema extensions;

create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  embedding extensions.vector(1536)
);

create table if not exists public.beta_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in ('capture_made', 'ask_made', 'digest_viewed', 'thought_deleted')),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists thoughts_user_created_idx on public.thoughts(user_id, created_at desc);
create index if not exists beta_events_user_created_idx on public.beta_events(user_id, created_at desc);
create index if not exists thoughts_embedding_idx on public.thoughts using hnsw (embedding vector_cosine_ops);

alter table public.thoughts enable row level security;
alter table public.beta_events enable row level security;

create policy "Users can read their thoughts" on public.thoughts for select using (auth.uid() = user_id);
create policy "Users can create their thoughts" on public.thoughts for insert with check (auth.uid() = user_id);
create policy "Users can update their thoughts" on public.thoughts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their thoughts" on public.thoughts for delete using (auth.uid() = user_id);
create policy "Users can read their events" on public.beta_events for select using (auth.uid() = user_id);
create policy "Users can create their events" on public.beta_events for insert with check (auth.uid() = user_id);

create or replace function public.match_thoughts(
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int
)
returns table (id uuid, body text, created_at timestamptz, similarity float)
language sql stable security invoker set search_path = public
as $$
  select thoughts.id, thoughts.body, thoughts.created_at,
    1 - (thoughts.embedding <=> query_embedding) as similarity
  from public.thoughts
  where thoughts.user_id = auth.uid()
    and thoughts.embedding is not null
    and 1 - (thoughts.embedding <=> query_embedding) > match_threshold
  order by thoughts.embedding <=> query_embedding
  limit least(match_count, 20);
$$;
