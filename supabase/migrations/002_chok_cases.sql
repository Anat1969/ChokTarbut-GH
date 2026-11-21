-- תיקים: תופעות מהשטח שנצמדו לחוקים, כמו תקדימים.
-- כל תיק שייך למשתמשת אחת. השמירה קודם במכשיר, והענן מסתנכרן אחרי כניסה.
create table if not exists public.chok_cases (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  law_id text not null,
  phenomenon text not null check (char_length(phenomenon) <= 600),
  verdict text not null check (verdict in ('applied', 'distinguished')),
  decision text check (decision is null or char_length(decision) <= 600),
  created_at timestamptz not null default now()
);

alter table public.chok_cases enable row level security;

create policy "chok_cases_select" on public.chok_cases for select to authenticated using ((select auth.uid()) = user_id);
create policy "chok_cases_insert" on public.chok_cases for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chok_cases_update" on public.chok_cases for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chok_cases_delete" on public.chok_cases for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists chok_cases_user_idx on public.chok_cases (user_id, created_at desc);
create index if not exists chok_cases_law_idx on public.chok_cases (user_id, law_id);
