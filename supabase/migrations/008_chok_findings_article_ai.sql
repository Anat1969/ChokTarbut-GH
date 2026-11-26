-- סוג ממצא חדש: article_ai. מה שה-AI כתב כטיוטת כתבה. אם הכתבה נשמרה בלי שינוי, היא מסומנת "נוסח בידי AI".
-- (26.11.2026, ענת: כתבה לחוק שלה ברשימת הכתבות, להדפסה)
alter table public.chok_findings drop constraint if exists chok_findings_kind_check;
alter table public.chok_findings add constraint chok_findings_kind_check check (kind in ('correlations', 'apps', 'prompt', 'article_ai'));

create or replace function public.chok_finding_save(p_law_id text, p_kind text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_law_id is null or not exists (select 1 from public.chok_laws where id = p_law_id) then raise exception 'חוק לא קיים'; end if;
  if p_kind not in ('correlations', 'apps', 'prompt', 'article_ai') then raise exception 'סוג לא תקין'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or char_length(p_data::text) > 8000 then raise exception 'ממצא לא תקין'; end if;
  if (select count(*) from public.chok_findings where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'יותר מדי ממצאים בשעה האחרונה';
  end if;
  insert into public.chok_findings (law_id, kind, data) values (p_law_id, p_kind, p_data);
end $$;
revoke all on function public.chok_finding_save(text, text, jsonb) from public;
grant execute on function public.chok_finding_save(text, text, jsonb) to anon, authenticated;
