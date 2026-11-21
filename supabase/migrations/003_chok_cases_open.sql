-- תיקים בענן תמיד, בלי התחברות (כלל ענת, 21.11.2026).
-- קריאה פתוחה לכולם. כתיבה רק דרך שתי פונקציות שבודקות כל שדה.
-- שום תיק לא נמחק באמת: מחיקה מסמנת deleted_at, והשורה נשארת לשחזור.
alter table public.chok_cases alter column user_id drop not null;
alter table public.chok_cases add column if not exists deleted_at timestamptz;
alter table public.chok_cases add column if not exists updated_at timestamptz not null default now();

drop policy if exists "chok_cases_select" on public.chok_cases;
drop policy if exists "chok_cases_insert" on public.chok_cases;
drop policy if exists "chok_cases_update" on public.chok_cases;
drop policy if exists "chok_cases_delete" on public.chok_cases;

create policy "chok_cases_read" on public.chok_cases for select to anon, authenticated using (deleted_at is null);
revoke insert, update, delete on public.chok_cases from anon, authenticated;

create index if not exists chok_cases_law_open_idx on public.chok_cases (law_id) where deleted_at is null;

-- שמירה: תיק חדש, או עדכון של תיק קיים לפי המזהה
create or replace function public.chok_case_save(
  p_id uuid, p_law_id text, p_phenomenon text, p_verdict text, p_decision text default null, p_created_at timestamptz default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_id is null then raise exception 'מזהה חסר'; end if;
  if not exists (select 1 from public.chok_laws where id = p_law_id) then raise exception 'חוק לא קיים'; end if;
  if p_phenomenon is null or char_length(btrim(p_phenomenon)) = 0 or char_length(p_phenomenon) > 600 then raise exception 'תופעה לא תקינה'; end if;
  if p_verdict not in ('applied', 'distinguished') then raise exception 'הכרעה לא תקינה'; end if;
  if p_decision is not null and char_length(p_decision) > 600 then raise exception 'החלטה ארוכה מדי'; end if;
  -- מגבלת קצב גסה: עד 200 תיקים חדשים בשעה לכל האתר
  if not exists (select 1 from public.chok_cases where id = p_id)
     and (select count(*) from public.chok_cases where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'יותר מדי תיקים בשעה האחרונה';
  end if;
  insert into public.chok_cases (id, law_id, phenomenon, verdict, decision, created_at, updated_at)
  values (p_id, p_law_id, btrim(p_phenomenon), p_verdict, nullif(btrim(coalesce(p_decision, '')), ''),
          least(coalesce(p_created_at, now()), now()), now())
  on conflict (id) do update set
    verdict = excluded.verdict,
    decision = coalesce(excluded.decision, public.chok_cases.decision),
    deleted_at = null,
    updated_at = now()
  where public.chok_cases.law_id = excluded.law_id;
end $$;

-- מחיקה רכה: התיק יורד מהתצוגה, והשורה נשארת
create or replace function public.chok_case_remove(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.chok_cases set deleted_at = now(), updated_at = now() where id = p_id and deleted_at is null;
$$;

revoke all on function public.chok_case_save(uuid, text, text, text, text, timestamptz) from public;
revoke all on function public.chok_case_remove(uuid) from public;
grant execute on function public.chok_case_save(uuid, text, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.chok_case_remove(uuid) to anon, authenticated;

comment on table public.chok_cases is 'CHOK-TARBUT: cases (field phenomena attached to a law). Public read, writes only via chok_case_save / chok_case_remove. Soft delete.';
