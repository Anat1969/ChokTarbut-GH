-- הכנסה למאגר (26.11.2026, ענת אישרה): חוק שענת ניסחה ב"החוקים שלי" נכנס ל-chok_laws.
-- אחרי זה הוא חוק לכל דבר: תיקים, כתבה, ממצאים ותמונה, כי כל הפונקציות בודקות קיום ב-chok_laws.
-- בלי התחברות (כלל ענת). הכתיבה רק דרך הפונקציה, שבודקת כל שדה ומגבילה קצב. שום חוק לא נמחק מהמאגר.

alter table public.chok_laws add column if not exists family text;
comment on column public.chok_laws.family is 'Mechanism family, only for laws Anat promoted (created_by=anat). System laws use FAMILY_OF in the client.';

create or replace function public.chok_law_promote(p_id uuid, p_family text) returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.chok_my_laws%rowtype;
  v_domains text[] := array['ביולוגיה','חברה','ספורט','עיר','תרבות','כלכלה','מדע'];
  v_families text[] := array['contagion','swarm','scale','limit','skew','dilemma'];
begin
  if p_id is null then raise exception 'מזהה חסר'; end if;
  if exists (select 1 from public.chok_laws where id = p_id::text) then return; end if;
  select * into r from public.chok_my_laws where id = p_id and kind = 'created' and deleted_at is null;
  if not found then raise exception 'החוק לא נמצא בחוקים שלך'; end if;
  if char_length(btrim(r.name)) not between 1 and 120 then raise exception 'שם לא תקין'; end if;
  if char_length(btrim(r.definition)) not between 1 and 2000 then raise exception 'הגדרה חסרה או ארוכה מדי'; end if;
  if char_length(r.mechanism) > 3000 then raise exception 'מנגנון ארוך מדי'; end if;
  if cardinality(r.domain) = 0 or not (r.domain <@ v_domains) then raise exception 'תחום לא תקין'; end if;
  if p_family is null or not (p_family = any (v_families)) then raise exception 'משפחה לא תקינה'; end if;
  if (select count(*) from public.chok_laws where created_by = 'anat' and updated_at > now() - interval '1 hour') >= 20 then
    raise exception 'יותר מדי חוקים נכנסו למאגר בשעה האחרונה';
  end if;
  insert into public.chok_laws (id, name, name_en, domain, definition, mechanism, examples, evidence_strength,
                                correlations, source, created_by, tags, family, updated_at)
  values (
    p_id::text, btrim(r.name), nullif(btrim(coalesce(r.name_en, '')), ''), r.domain, btrim(r.definition), r.mechanism,
    coalesce(r.examples, '[]'::jsonb), 1,
    array(select x from unnest(r.parent_law_ids) x where exists (select 1 from public.chok_laws l where l.id = x)),
    'ניסחה ענת, ' || to_char(r.created_at at time zone 'Asia/Jerusalem', 'DD.MM.YYYY')
      || '. נכנס למאגר ' || to_char(now() at time zone 'Asia/Jerusalem', 'DD.MM.YYYY') || '. לא אומת.',
    'anat', r.tags, p_family, now()
  );
  update public.chok_my_laws set family = coalesce(family, p_family), updated_at = now() where id = p_id;
end $$;

revoke all on function public.chok_law_promote(uuid, text) from public;
grant execute on function public.chok_law_promote(uuid, text) to anon, authenticated;
