import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getLawById, isPromoted } from '../data/laws';
import { FAMILIES, FAMILY_OF } from '../data/families';
import { promoteLaw, usePromoted } from '../lib/promoted';

interface Props {
  id: string;
  family?: string;
  parents: string[];
}

// "הכנסה למאגר": חוק שניסחת הופך לחוק במאגר, עם עמוד, כתבה, תמונה ותיקים.
// פעולה לתמיד, ולכן שני שלבים: הסבר קצר, ואז אישור. המשפחה נלקחת מהחוק, או מהחוק הראשון שממנו נולד.
export default function PromoteButton({ id, family, parents }: Props) {
  usePromoted();
  const inherited = family ?? parents.map((p) => FAMILY_OF[p]).find(Boolean);
  const [stage, setStage] = useState<'idle' | 'confirm' | 'busy' | 'error'>('idle');
  const [chosen, setChosen] = useState<string>(inherited ?? '');

  if (isPromoted(id)) {
    return (
      <Link to={`/law/${id}`} className="btn-soft btn-sm">
        במאגר: לעמוד החוק
      </Link>
    );
  }

  if (stage === 'idle') {
    return (
      <button className="btn-primary btn-sm" onClick={() => setStage('confirm')}>
        הכנסה למאגר
      </button>
    );
  }

  const go = async () => {
    setStage('busy');
    try {
      await promoteLaw(id, chosen);
    } catch {
      setStage('error');
    }
  };

  return (
    <div className="w-full bg-white p-3 text-sm leading-relaxed" role="group" aria-label="הכנסה למאגר">
      <p>
        <b>החוק ייכנס למאגר לתמיד</b>, לצד {getLawById(parents[0])?.name ? `"${getLawById(parents[0])!.name}"` : 'החוקים שמהם נולד'}.
        <br />
        הוא יקבל עמוד, כתבה, תמונה ותיקים, וה-AI יכיר אותו. הוא יסומן <span className="marker">ניסחת</span>, בראיות "השערה".
      </p>
      {!inherited && (
        <label className="mt-2 block">
          <span className="meta">משפחת המנגנון, למיקום בטבלה</span>
          <select className="input mt-1" value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">בחרי משפחה</option>
            {FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {stage === 'error' && <p className="mt-2 font-bold text-red-700">ההכנסה לא הצליחה. החוק נשאר ברשימה שלך, ואפשר לנסות שוב.</p>}
      <div className="mt-3 flex gap-2">
        <button className="btn-primary btn-sm" disabled={!chosen || stage === 'busy'} onClick={go}>
          {stage === 'busy' ? 'מכניסה...' : 'כן, להכניס למאגר'}
        </button>
        <button className="btn-soft btn-sm" onClick={() => setStage('idle')}>
          ביטול
        </button>
      </div>
    </div>
  );
}
