import { Link } from 'react-router-dom';
import { INITIAL_LAWS } from '../data/laws';
import type { Law } from '../types';

const norm = (name: string) =>
  name
    .replace(/[()"'׳״.,\-־]/g, ' ')
    .replace(/(^|\s)(חוק|עקרון|אפקט|פרדוקס|תאוריית)\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// האם שם שה-AI הציע הוא חוק שקיים במאגר
export function knownLaw(name: string): Law | undefined {
  const n = norm(name);
  if (n.length < 2) return undefined;
  return INITIAL_LAWS.find((l) => norm(l.name) === n || l.name_en?.toLowerCase() === name.trim().toLowerCase());
}

const day = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `, ב-${d.toLocaleDateString('he-IL')}`;
};

// שם של חוק שה-AI הציע כקשר. חוק מהמאגר מקושר. חוק שלא קיים במאגר מסומן, עם המקור שלו: איך הוא נולד
export default function FoundLaw({
  name,
  bornFrom,
  fromId,
  savedAt,
}: {
  name: string;
  bornFrom: string;
  fromId: string;
  savedAt?: string;
}) {
  const law = knownLaw(name);
  if (law) {
    return (
      <Link to={`/law/${law.id}`} className="font-bold underline decoration-2 underline-offset-2">
        {law.name}
      </Link>
    );
  }
  return (
    <>
      <b>{name}</b> <span className="found-new">לא קיים במאגר</span>
      <span className="meta block">
        איך נולד: ה-AI הציע אותו בחיפוש קשרים מפתיעים ל"{bornFrom}"{day(savedAt)}. השם והתוכן לא אומתו מול מקור.{' '}
        <Link to={`/create?with=${fromId}&name=${encodeURIComponent(name)}`} className="font-bold text-black underline underline-offset-2">
          הפכי לחוק
        </Link>
      </span>
    </>
  );
}
