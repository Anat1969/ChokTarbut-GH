import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLawById } from '../data/laws';
import { useSavedLaws, removeLaw, saveLaw } from '../lib/store';
import DomainBadge from '../components/DomainBadge';
import RichText from '../components/RichText';
import type { SavedLaw, User } from '../types';

export default function MyLaws(_props: { user: User | null }) {
  const laws = useSavedLaws();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [undo, setUndo] = useState<SavedLaw | null>(null);
  // ?law= מגיע מהרשת, מהספרייה או מהטבלה: החוק מסומן וגולל אל המסך
  const [params] = useSearchParams();
  const focus = params.get('law');
  useEffect(() => {
    if (focus) document.getElementById(`mine-${focus}`)?.scrollIntoView({ block: 'center' });
  }, [focus, laws.length]);

  const created = laws.filter((l) => l.kind === 'created');
  const marked = laws.filter((l) => l.kind === 'marked');

  const remove = (law: SavedLaw) => {
    removeLaw(law.id);
    setConfirmId(null);
    setUndo(law);
  };

  const card = (law: SavedLaw) => (
    <li
      key={law.id}
      id={`mine-${law.id}`}
      className="bg-zinc-50 p-4"
      style={law.id === focus ? { boxShadow: 'inset 0 0 0 3px var(--insight)' } : undefined}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        {law.domain.map((d) => (
          <DomainBadge key={d} domain={d} />
        ))}
        <span className="meta mr-auto">
          {new Date(law.created_at).toLocaleDateString('he-IL')} · {law.synced ? 'בענן' : 'במכשיר'}
        </span>
      </div>
      <h3 className="text-lg font-black leading-tight">
        {law.kind === 'marked' ? <Link to={`/law/${law.parent_law_ids[0]}`}>{law.name}</Link> : law.name}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-700">
        <RichText text={law.definition} />
      </p>
      {law.why_novel && (
        <p className="mt-2 text-sm leading-relaxed">
          <RichText text={law.why_novel} />
        </p>
      )}
      {law.kind === 'created' && (
        <p className="meta mt-2">
          נוצר מ:{' '}
          {law.parent_law_ids.map((id, i) => (
            <span key={id}>
              {i > 0 && ' + '}
              <Link className="underline" to={`/law/${id}`}>
                {getLawById(id)?.name ?? id}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {law.kind === 'created' && (
          <Link className="btn-soft btn-sm" to={`/library?law=${law.id}`}>
            בספרייה
          </Link>
        )}
        {confirmId === law.id ? (
          <>
            <button className="btn btn-sm bg-red-600 text-white" onClick={() => remove(law)}>
              כן, למחוק
            </button>
            <button className="btn-soft btn-sm" onClick={() => setConfirmId(null)}>
              ביטול
            </button>
          </>
        ) : (
          <button className="btn-soft btn-sm" onClick={() => setConfirmId(law.id)}>
            מחיקה
          </button>
        )}
      </div>
    </li>
  );

  return (
    <main className="page px-4 py-5 md:px-6">
      <h1 className="h2">
        <span className="marker">{created.length}</span> חוקים שיצרת, ו-<span className="marker">{marked.length}</span> שסימנת.
      </h1>
      <p className="meta mt-1">
        {'החוקים נשמרים בענן מיד, בלי כניסה, וזמינים בכל מכשיר.'}
      </p>

      {undo && (
        <p className="mt-3 flex items-center gap-3 bg-yellow-100 px-3 py-2 text-sm" role="status">
          "{undo.name}" נמחק.
          <button
            className="btn-soft btn-sm"
            onClick={() => {
              saveLaw(undo);
              setUndo(null);
            }}
          >
            ביטול המחיקה
          </button>
        </p>
      )}

      {laws.length === 0 ? (
        <div className="mt-6 max-w-xl bg-zinc-50 p-6">
          <p className="mb-1 text-lg font-black">הארכיון עדיין ריק.</p>
          <p className="mb-4 text-sm leading-relaxed text-zinc-600">
            כאן נאספים חוקים חדשים שיצרת מצומת של חוקים קיימים, וחוקים מהמאגר שסימנת לעצמך.
          </p>
          <div className="flex gap-2">
            <Link to="/create" className="btn-primary">
              צרי חוק חדש
            </Link>
            <Link to="/library" className="btn-soft">
              סמני חוק מהספרייה
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="label mb-2">חוקים שיצרת</h2>
            {created.length === 0 ? (
              <p className="text-sm text-zinc-500">
                עוד לא יצרת חוק.{' '}
                <Link to="/create" className="font-bold underline">
                  למחולל
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">{created.map(card)}</ul>
            )}
          </section>
          <section>
            <h2 className="label mb-2">חוקים שסימנת</h2>
            {marked.length === 0 ? (
              <p className="text-sm text-zinc-500">
                עוד לא סימנת חוק.{' '}
                <Link to="/library" className="font-bold underline">
                  לספרייה
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">{marked.map(card)}</ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
