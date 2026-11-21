-- בענן תמיד, בלי התחברות (כלל ענת, 21.11.2026).
-- שתי טבלאות חדשות, בלי user_id: התיקים, ו"החוקים שלי".
-- הטבלאות הישנות chok_cases ו-chok_user_laws נשארות ריקות ולא בשימוש. בלי drop, כדי שלא תידרש שאלת אישור.
-- קריאה פתוחה. אין מדיניות כתיבה, ולכן כתיבה רק דרך הפונקציות (security definer), שבודקות כל שדה ומגבילות קצב.
-- שום שורה לא נמחקת באמת: מחיקה מסמנת deleted_at.

create table if not exists public.chok_field_cases (
  id uuid primary key,
  law_id text not null,
  phenomenon text not null check (char_length(phenomenon) between 1 and 600),
  verdict text not null check (verdict in ('applied', 'distinguished')),
  decision text check (decision is null or char_length(decision) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.chok_field_cases enable row level security;
create policy "chok_field_cases_read" on public.chok_field_cases for select to anon, authenticated using (deleted_at is null);
create index if not exists chok_field_cases_law_idx on public.chok_field_cases (law_id) where deleted_at is null;
comment on table public.chok_field_cases is 'CHOK-TARBUT: cases, field phenomena attached to a law. Public read, writes only via chok_case_save / chok_case_remove. Soft delete. No login.';

create table if not exists public.chok_my_laws (
  id uuid primary key,
  kind text not null check (kind in ('created', 'marked')),
  name text not null check (char_length(name) between 1 and 120),
  name_en text,
  domain text[] not null default '{}',
  definition text not null default '',
  mechanism text not null default '',
  examples jsonb not null default '[]',
  tags text[] not null default '{}',
  parent_law_ids text[] not null default '{}',
  why_novel text,
  family text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.chok_my_laws enable row level security;
create policy "chok_my_laws_read" on public.chok_my_laws for select to anon, authenticated using (deleted_at is null);
comment on table public.chok_my_laws is 'CHOK-TARBUT: laws Anat created or marked. Public read, writes only via chok_my_law_save / chok_my_law_remove. Soft delete. No login.';

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
  if not exists (select 1 from public.chok_field_cases where id = p_id)
     and (select count(*) from public.chok_field_cases where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'יותר מדי תיקים בשעה האחרונה';
  end if;
  insert into public.chok_field_cases (id, law_id, phenomenon, verdict, decision, created_at, updated_at)
  values (p_id, p_law_id, btrim(p_phenomenon), p_verdict, nullif(btrim(coalesce(p_decision, '')), ''),
          least(coalesce(p_created_at, now()), now()), now())
  on conflict (id) do update set
    verdict = excluded.verdict,
    decision = coalesce(excluded.decision, public.chok_field_cases.decision),
    deleted_at = null,
    updated_at = now()
  where public.chok_field_cases.law_id = excluded.law_id;
end $$;

create or replace function public.chok_case_remove(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.chok_field_cases set deleted_at = now(), updated_at = now() where id = p_id and deleted_at is null;
$$;

create or replace function public.chok_my_law_save(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_kind text := p->>'kind';
  v_name text := btrim(coalesce(p->>'name', ''));
begin
  if v_id is null then raise exception 'מזהה חסר'; end if;
  if v_kind not in ('created', 'marked') then raise exception 'סוג לא תקין'; end if;
  if char_length(v_name) = 0 or char_length(v_name) > 120 then raise exception 'שם לא תקין'; end if;
  if char_length(coalesce(p->>'definition', '')) > 2000 or char_length(coalesce(p->>'mechanism', '')) > 2000
     or char_length(coalesce(p->>'why_novel', '')) > 2000 or char_length(coalesce(p->>'examples', '')) > 6000 then
    raise exception 'טקסט ארוך מדי';
  end if;
  if not exists (select 1 from public.chok_my_laws where id = v_id)
     and (select count(*) from public.chok_my_laws where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'יותר מדי חוקים בשעה האחרונה';
  end if;
  insert into public.chok_my_laws (id, kind, name, name_en, domain, definition, mechanism, examples, tags, parent_law_ids, why_novel, family, created_at, updated_at)
  values (
    v_id, v_kind, v_name, nullif(p->>'name_en', ''),
    coalesce(array(select jsonb_array_elements_text(p->'domain')), '{}'),
    coalesce(p->>'definition', ''), coalesce(p->>'mechanism', ''),
    coalesce(p->'examples', '[]'::jsonb),
    coalesce(array(select jsonb_array_elements_text(p->'tags')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'parent_law_ids')), '{}'),
    nullif(p->>'why_novel', ''), nullif(p->>'family', ''),
    least(coalesce((p->>'created_at')::timestamptz, now()), now()), now())
  on conflict (id) do update set
    kind = excluded.kind, name = excluded.name, name_en = excluded.name_en, domain = excluded.domain,
    definition = excluded.definition, mechanism = excluded.mechanism, examples = excluded.examples,
    tags = excluded.tags, parent_law_ids = excluded.parent_law_ids, why_novel = excluded.why_novel,
    family = excluded.family, deleted_at = null, updated_at = now();
end $$;

create or replace function public.chok_my_law_remove(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.chok_my_laws set deleted_at = now(), updated_at = now() where id = p_id and deleted_at is null;
$$;

grant execute on function public.chok_case_save(uuid, text, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.chok_case_remove(uuid) to anon, authenticated;
grant execute on function public.chok_my_law_save(jsonb) to anon, authenticated;
grant execute on function public.chok_my_law_remove(uuid) to anon, authenticated;
