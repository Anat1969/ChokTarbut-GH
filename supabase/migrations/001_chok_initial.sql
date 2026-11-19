-- חוקי התנהגות: סכמה ראשונית
-- הפרויקט ב-Supabase משותף לכמה אפליקציות, ולכן לכל הטבלאות קידומת chok_.

-- מאגר החוקים: קריאה ציבורית, כתיבה רק דרך מיגרציה
create table if not exists public.chok_laws (
  id text primary key,
  name text not null,
  name_en text,
  domain text[] not null default '{}',
  definition text not null,
  mechanism text not null,
  examples jsonb not null default '[]',
  evidence_strength integer not null default 3 check (evidence_strength between 1 and 5),
  correlations text[] not null default '{}',
  source text,
  created_by text not null default 'system',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- חוקים שהמשתמשת יצרה או סימנה
create table if not exists public.chok_user_laws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'created' check (kind in ('created', 'marked')),
  name text not null,
  name_en text,
  domain text[] not null default '{}',
  definition text not null,
  mechanism text not null default '',
  examples jsonb not null default '[]',
  tags text[] not null default '{}',
  parent_law_ids text[] not null default '{}',
  why_novel text,
  created_at timestamptz not null default now()
);

-- תופעות שהוסברו
create table if not exists public.chok_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phenomenon text not null,
  matched_law_ids text[] not null default '{}',
  explanation text not null,
  insight text,
  created_at timestamptz not null default now()
);

alter table public.chok_laws enable row level security;
alter table public.chok_user_laws enable row level security;
alter table public.chok_explanations enable row level security;

create policy "chok_laws_read" on public.chok_laws for select using (true);

create policy "chok_user_laws_select" on public.chok_user_laws for select to authenticated using ((select auth.uid()) = user_id);
create policy "chok_user_laws_insert" on public.chok_user_laws for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chok_user_laws_update" on public.chok_user_laws for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chok_user_laws_delete" on public.chok_user_laws for delete to authenticated using ((select auth.uid()) = user_id);

create policy "chok_explanations_select" on public.chok_explanations for select to authenticated using ((select auth.uid()) = user_id);
create policy "chok_explanations_insert" on public.chok_explanations for insert to authenticated with check ((select auth.uid()) = user_id);

create index if not exists chok_user_laws_user_idx on public.chok_user_laws (user_id, created_at desc);
create index if not exists chok_explanations_user_idx on public.chok_explanations (user_id, created_at desc);
