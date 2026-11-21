import { useCallback, useState, useSyncExternalStore } from 'react';
import { getLawById } from '../data/laws';
import ArticleSheet from './ArticleSheet';
import { subscribeArticles, getArticle, saveArticle } from '../lib/articles';
import { draftArticle } from '../lib/ai';
import ArticleBody, { parseArticle } from './ArticleBody';
import ArticleFindings from './ArticleFindings';

interface Props {
  lawId: string;
  lawName: string;
  editable?: boolean;
}

// הכתבה של חוק אחד: קריאה, ועריכה במקום
export default function ArticleTab({ lawId, lawName, editable = true }: Props) {
  const text = useSyncExternalStore(subscribeArticles, () => getArticle(lawId));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const [printing, setPrinting] = useState(false);
  const donePrinting = useCallback(() => setPrinting(false), []);
  const law = getLawById(lawId);
  const [drafting, setDrafting] = useState(false);
  const [byAi, setByAi] = useState(false);

  const startEdit = () => {
    setDraft(text);
    setByAi(false);
    setEditing(true);
    setNote('');
  };

  // ה-AI מנסח טיוטה מנתוני החוק. היא נפתחת לעריכה, ונשמרת רק כשענת לוחצת "שמירה"
  const askDraft = async () => {
    setDrafting(true);
    setNote('');
    try {
      setDraft(await draftArticle(lawId));
      setByAi(true);
      setEditing(true);
    } catch {
      setNote('ה-AI לא זמין כרגע. אפשר לכתוב ידנית, או לנסות שוב בעוד דקה.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const where = await saveArticle(lawId, draft.trim());
    setSaving(false);
    setEditing(false);
    setNote(where === 'cloud' ? 'נשמר בענן.' : 'נשמר במכשיר, ויישלח לענן בפתיחה הבאה.');
  };

  if (editing) {
    return (
      <div className="article-tab">
        {byAi && (
          <p className="mb-2 text-sm">
            <span className="marker">טיוטה, נוסח בידי AI.</span> נכתבה רק מנתוני החוק במאגר. קראי ותקני לפני שמירה.
          </p>
        )}
        <p className="meta mb-2">
          שורה ראשונה: כותרת. <b className="text-zinc-600">## </b>פותח פרק. שורה שכולה בין{' '}
          <b className="text-zinc-600">**כוכביות**</b> היא תובנת הפרק.
        </p>
        <textarea
          className="input article-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`כתבה על "${lawName}"`}
          aria-label={`כתבה על ${lawName}`}
          maxLength={20000}
          autoFocus
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'שומר' : 'שמירה'}
          </button>
          <button className="btn-soft" onClick={() => setEditing(false)} disabled={saving}>
            ביטול
          </button>
        </div>
      </div>
    );
  }

  if (!text.trim()) {
    return (
      <div className="article-tab">
        <p className="text-sm text-zinc-500">לחוק הזה עוד אין כתבה.</p>
        {editable && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-primary btn-sm" onClick={askDraft} disabled={drafting}>
              {drafting ? 'מנסח טיוטה' : 'נסחי טיוטה'}
            </button>
            <button className="btn-soft btn-sm" onClick={startEdit} disabled={drafting}>
              כתבי כתבה
            </button>
            {note && (
              <span className="meta" role="status">
                {note}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const article = parseArticle(text);
  return (
    <div className="article-tab">
      <h2 className="h2">{article.title}</h2>
      <ArticleBody article={article} />
      <ArticleFindings lawId={lawId} />
      {printing && law && <ArticleSheet law={law} article={article} onDone={donePrinting} />}
      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-soft btn-sm" onClick={startEdit}>
            עריכת הכתבה
          </button>
          {law && (
            <button className="btn-soft btn-sm" onClick={() => setPrinting(true)} disabled={printing}>
              הדפסה על דף אחד
            </button>
          )}
          {note && (
            <span className="meta" role="status">
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
