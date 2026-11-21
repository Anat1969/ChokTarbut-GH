-- כתבות: קריאה פתוחה, כתיבה רק דרך פונקציה בודקת, ושום גרסה לא נמחקת.
-- לפני כן הטבלה הייתה פתוחה לגמרי: כל מי שהגיע לאתר יכול היה למחוק או לשכתב כתבה.

create table if not exists public.chok_article_history (
  id bigint generated always as identity primary key,
  law_id text not null,
  text text not null,
  saved_at timestamptz not null default now()
);
alter table public.chok_article_history enable row level security;
revoke all on public.chok_article_history from anon, authenticated;

-- הגרסאות שקיימות היום נכנסות ליומן, כדי שגם הן לא יאבדו
insert into public.chok_article_history (law_id, text, saved_at)
select a.law_id, a.text, a.updated_at from public.chok_articles a
where not exists (select 1 from public.chok_article_history h where h.law_id = a.law_id);

alter table public.chok_articles enable row level security;
drop policy if exists "allow all" on public.chok_articles;
drop policy if exists chok_articles_read on public.chok_articles;
create policy chok_articles_read on public.chok_articles for select using (true);
revoke all on public.chok_articles from anon, authenticated;
grant select on public.chok_articles to anon, authenticated;

create or replace function public.chok_article_save(p_law_id text, p_text text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_law_id is null
     or (not exists (select 1 from public.chok_laws where id = p_law_id)
         and not exists (select 1 from public.chok_my_laws where id::text = p_law_id and deleted_at is null)) then
    raise exception 'חוק לא קיים';
  end if;
  if p_text is null or char_length(p_text) > 20000 then raise exception 'כתבה לא תקינה'; end if;
  if (select count(*) from public.chok_article_history where saved_at > now() - interval '1 hour') >= 120 then
    raise exception 'יותר מדי שמירות בשעה האחרונה';
  end if;
  -- אותו נוסח בדיוק לא נשמר פעמיים
  if exists (select 1 from public.chok_articles where law_id = p_law_id and text = btrim(p_text)) then return; end if;
  insert into public.chok_article_history (law_id, text) values (p_law_id, btrim(p_text));
  insert into public.chok_articles (law_id, text, updated_at) values (p_law_id, btrim(p_text), now())
  on conflict (law_id) do update set text = excluded.text, updated_at = now();
end $$;
revoke all on function public.chok_article_save(text, text) from public;
grant execute on function public.chok_article_save(text, text) to anon, authenticated;
