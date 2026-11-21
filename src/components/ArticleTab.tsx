import { useState, useSyncExternalStore } from 'react';
import { subscribeArticles, getArticle, saveArticle } from '../lib/articles';

interface Props {
  lawId: string;
  lawName: string;
  editable?: boolean;
}

export default function ArticleTab({ lawId, lawName, editable = true }: Props) {
  const text = useSyncExternalStore(subscribeArticles, () => getArticle(lawId));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  function startEdit() {
    setDraft(text);
    setEditing(true);
    setNote('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveArticle(lawId, draft.trim());
      setEditing(false);
      setNote('נשמר');
      setTimeout(() => setNote(''), 2000);
    } catch {
      setNote('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setDraft('');
    setNote('');
  }

  if (editing) {
    return (
      <div className="article-tab" dir="rtl">
        <textarea
          className="article-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`כתבי כתבה על "${lawName}"…`}
          autoFocus
        />
        <div className="article-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'שומר…' : 'שמירה'}
          </button>
          <button className="btn-ghost" onClick={handleCancel} disabled={saving}>
            ביטול
          </button>
          {note && <span className="article-note">{note}</span>}
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="article-tab" dir="rtl">
        <p className="article-empty">אין כתבה עדיין.</p>
        {editable && (
          <div className="article-actions">
            <button className="btn-ghost" onClick={startEdit}>
              כתבי כתבה
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="article-tab" dir="rtl">
      <div className="article-body">
        {text.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {editable && (
        <div className="article-actions">
          <button className="btn-ghost" onClick={startEdit}>
            ערכי כתבה
          </button>
          {note && <span className="article-note">{note}</span>}
        </div>
      )}
    </div>
  );
}
