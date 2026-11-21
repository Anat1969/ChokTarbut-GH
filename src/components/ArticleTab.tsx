import { useState, useSyncExternalStore } from 'react';
import { subscribeArticles, getArticle, saveArticle } from '../lib/articles';
import ArticleBody, { parseArticle } from './ArticleBody';

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

  const startEdit = () => {
    setDraft(text);
    setEditing(true);
    setNote('');
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
          <button className="btn-soft btn-sm mt-3" onClick={startEdit}>
            כתבי כתבה
          </button>
        )}
      </div>
    );
  }

  const article = parseArticle(text);
  return (
    <div className="article-tab">
      <h2 className="h2">{article.title}</h2>
      <ArticleBody article={article} />
      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-soft btn-sm" onClick={startEdit}>
            עריכת הכתבה
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
