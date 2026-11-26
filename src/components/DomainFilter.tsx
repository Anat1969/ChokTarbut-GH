import { ALL_DOMAINS, getLawsByDomain, INITIAL_LAWS } from '../data/laws';
import { domainColor, domainInk } from './DomainBadge';
import type { Domain, Law } from '../types';

interface Props {
  value: Domain | null;
  onChange: (domain: Domain | null) => void;
  extra?: Law[]; // חוקים שענת ניסחה: נספרים יחד עם המאגר
}

// הסינון הוא גם המקרא. "הכול" נראה אחרת מהתחומים, ותמיד ראשון.
export default function DomainFilter({ value, onChange, extra = [] }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="סינון לפי תחום">
      <button
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={`btn btn-sm ${value === null ? 'bg-black text-white' : 'bg-zinc-100'}`}
      >
        הכול <span className="opacity-60">{INITIAL_LAWS.length + extra.length}</span>
      </button>
      {ALL_DOMAINS.map((d) => {
        const on = value === d;
        return (
          <button
            key={d}
            onClick={() => onChange(on ? null : d)}
            aria-pressed={on}
            className="btn btn-sm"
            style={
              on
                ? { backgroundColor: domainColor(d), color: domainInk(d) }
                : { backgroundColor: '#f4f4f5', boxShadow: `inset 0 -3px 0 ${domainColor(d)}, 0 1px 2px rgba(0,0,0,.12)` }
            }
          >
            {d} <span className="opacity-60">{getLawsByDomain(d).length + extra.filter((l) => l.domain.includes(d)).length}</span>
          </button>
        );
      })}
    </div>
  );
}
