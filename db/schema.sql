create table if not exists conversations (
  id uuid primary key,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on messages(conversation_id, created_at);

create table if not exists runs (
  id uuid primary key,
  question text not null,
  document_scope text,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  answer jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table runs
  add column if not exists document_scope text;

create table if not exists run_events (
  id uuid primary key,
  run_id uuid not null references runs(id) on delete cascade,
  type text not null,
  message text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists run_events_run_created_idx
  on run_events(run_id, created_at);

create table if not exists run_artifacts (
  id uuid primary key,
  run_id uuid not null references runs(id) on delete cascade,
  kind text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists run_artifacts_run_created_idx
  on run_artifacts(run_id, created_at);

create table if not exists run_document_accesses (
  id uuid primary key,
  run_id uuid not null references runs(id) on delete cascade,
  document_id text not null,
  title text not null,
  source_uri text not null,
  snippet text not null,
  score double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists run_document_accesses_run_created_idx
  on run_document_accesses(run_id, created_at);
