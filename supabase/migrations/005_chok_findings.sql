-- ממצאים: מידע שה-AI ייצר על חוק (קשרים מפתיעים, אפליקציות שמאמתות), נשמר כדי שיופיע בכניסה הבאה.
-- יומן שרק גדל: השורה האחרונה לכל חוק וסוג קובעת מה מוצג, ושום ממצא לא נמחק.
create table if not exists public.chok_findings (
  id bigint generated always as identity primary key,
  law_id text not null,
  kind text not null check (kind in ('correlations', 'apps')),
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists chok_findings_law on public.chok_findings (law_id, kind, created_at);
alter table public.chok_findings enable row level security;
drop policy if exists chok_findings_read on public.chok_findings;
create policy chok_findings_read on public.chok_findings for select using (true);
revoke all on public.chok_findings from anon, authenticated;
grant select on public.chok_findings to anon, authenticated;

create or replace function public.chok_finding_save(p_law_id text, p_kind text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_law_id is null or not exists (select 1 from public.chok_laws where id = p_law_id) then raise exception 'חוק לא קיים'; end if;
  if p_kind not in ('correlations', 'apps') then raise exception 'סוג לא תקין'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or char_length(p_data::text) > 8000 then raise exception 'ממצא לא תקין'; end if;
  if (select count(*) from public.chok_findings where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'יותר מדי ממצאים בשעה האחרונה';
  end if;
  insert into public.chok_findings (law_id, kind, data) values (p_law_id, p_kind, p_data);
end $$;
revoke all on function public.chok_finding_save(text, text, jsonb) from public;
grant execute on function public.chok_finding_save(text, text, jsonb) to anon, authenticated;
