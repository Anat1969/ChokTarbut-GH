-- Migration: 001_initial
-- חוקי התנהגות — סכמת DB ראשונית

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===========================
-- טבלת חוקים שנוצרו על ידי המשתמש
-- ===========================
create table if not exists user_laws (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- פרטי החוק
  name text not null,
  name_en text,
  domain text[] not null default '{}',
  definition text not null,
  mechanism text not null,
  examples jsonb not null default '[]',
  evidence_strength integer check (evidence_strength between 1 and 5) default 3,
  correlations text[] default '{}',
  source text default 'claude-generated',
  tags text[] default '{}',

  -- מטאדטה
  parent_law_ids text[] default '{}', -- IDs של חוקי האב שמהם נוצר
  why_novel text, -- למה החוק הזה חדש
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================
-- טבלת הסברים (תופעות שהוסברו)
-- ===========================
create table if not exists explanations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,

  phenomenon text not null, -- התופעה שהוסברה
  matched_law_ids text[] not null default '{}',
  explanation text not null,
  additional_examples jsonb default '[]',
  insight text,

  created_at timestamptz default now()
);

-- ===========================
-- RLS — Row Level Security
-- ===========================
alter table user_laws enable row level security;
alter table explanations enable row level security;

-- user_laws: כל משתמש רואה רק את שלו
create policy "user_laws_select" on user_laws
  for select using (auth.uid() = user_id);

create policy "user_laws_insert" on user_laws
  for insert with check (auth.uid() = user_id);

create policy "user_laws_delete" on user_laws
  for delete using (auth.uid() = user_id);

-- explanations: כל משתמש רואה רק את שלו
create policy "explanations_select" on explanations
  for select using (auth.uid() = user_id);

create policy "explanations_insert" on explanations
  for insert with check (auth.uid() = user_id);

-- ===========================
-- אינדקסים
-- ===========================
create index if not exists user_laws_user_id_idx on user_laws(user_id);
create index if not exists explanations_user_id_idx on explanations(user_id);
create index if not exists user_laws_created_at_idx on user_laws(created_at desc);
create index if not exists explanations_created_at_idx on explanations(created_at desc);

-- ===========================
-- עדכון אוטומטי של updated_at
-- ===========================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_laws_updated_at
  before update on user_laws
  for each row execute function update_updated_at();
