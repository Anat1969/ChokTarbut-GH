import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { INITIAL_LAWS, ALL_DOMAINS, getLawById } from '../data/laws';
import { useGraph, useMineLaws, isMine, MINE_COLOR, type MineLaw } from '../lib/mine';
import { usePromoted } from '../lib/promoted';
import MineLawCard from '../components/MineLawCard';
import DomainFilter from '../components/DomainFilter';
import { domainColor } from '../components/DomainBadge';
import Evidence from '../components/Evidence';
import LawPortrait from '../components/LawPortrait';
import LawCover from '../components/LawCover';
import { FAMILIES, FAMILY_OF } from '../data/families';
import type { Domain, Law } from '../types';

type Sort = 'family' | 'domain' | 'evidence' | 'links' | 'mine';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'family', label: 'לפי משפחת מנגנון' },
  { id: 'domain', label: 'לפי תחום' },
  { id: 'evidence', label: 'לפי חוזק ראיות' },
  { id: 'links', label: 'לפי מספר קשרים' },
  { id: 'mine', label: 'החוקים שלי' },
];

// מאילו חוקים נולד חוק שענת ניסחה: חוק במאגר שומר אותם בקשרים, וחוק שעוד לא נכנס שומר אותם בהורים
const parentsOf = (l: Law): string[] => (isMine(l) ? l.parents : l.correlations);
const originLine = (l: Law) =>
  parentsOf(l)
    .map((id) => getLawById(id)?.name)
    .filter(Boolean)
    .join(' + ');
const EVIDENCE_TITLES: Record<number, string> = {
  5: 'ראיות חזקות מאוד',
  4: 'ראיות חזקות',
  3: 'ראיות בינוניות',
  2: 'ראיות חלשות, שנוי במחלוקת',
  1: 'השערה',
};

export default function Library() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [sort, setSort] = useState<Sort>('family');
  const [query, setQuery] = useState('');
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState(params.get('law') ?? INITIAL_LAWS[0].id);
  const mine = useMineLaws();
  const promoted = usePromoted();
  const { neighbors: NEIGHBORS } = useGraph();
  const familyOf = (l: Law) => FAMILY_OF[l.id] ?? (isMine(l) ? l.family : undefined);
  const links = (id: string) => NEIGHBORS[id]?.length ?? 0;

  const groups = useMemo(() => {
    const q = query.trim();
    const laws = [...INITIAL_LAWS, ...promoted, ...mine].filter(
      (l) =>
        (!domain || l.domain.includes(domain)) &&
        (!q || [l.name, l.name_en ?? '', l.definition, ...l.tags].some((t) => t.toLowerCase().includes(q.toLowerCase()))),
    );
    const out: { title: string; note?: string; color?: string; laws: Law[] }[] = [];
    if (sort === 'family') {
      for (const f of FAMILIES) {
        const list = laws.filter((l) => familyOf(l) === f.id);
        if (list.length) out.push({ title: f.name, note: f.short, laws: list });
      }
      const loose = laws.filter((l) => !familyOf(l));
      if (loose.length) out.push({ title: 'חוקים שניסחת, בלי משפחה', note: 'עוד לא שויכו למנגנון', laws: loose });
    } else if (sort === 'domain') {
      for (const d of ALL_DOMAINS) {
        const list = laws.filter((l) => l.domain[0] === d);
        if (list.length) out.push({ title: d, color: domainColor(d), laws: list });
      }
    } else if (sort === 'evidence') {
      for (const v of [5, 4, 3, 2, 1]) {
        const list = laws.filter((l) => l.evidence_strength === v);
        if (list.length) out.push({ title: EVIDENCE_TITLES[v], laws: list });
      }
    } else if (sort === 'mine') {
      const own = laws.filter((l) => l.created_by === 'anat');
      const inside = own.filter((l) => !isMine(l));
      const waiting = own.filter((l) => isMine(l));
      if (inside.length) out.push({ title: 'במאגר', note: 'חוקים שלך, עם עמוד, כתבה ותמונה', laws: inside });
      if (waiting.length) out.push({ title: 'ממתינים להכנסה למאגר', note: 'השערות שעוד לא נכנסו', laws: waiting });
    } else {
      const sorted = [...laws].sort((a, b) => links(b.id) - links(a.id));
      const hubs = sorted.filter((l) => links(l.id) >= 5);
      const rest = sorted.filter((l) => links(l.id) < 5);
      if (hubs.length) out.push({ title: 'צמתים: חמישה קשרים ויותר', laws: hubs });
      if (rest.length) out.push({ title: 'פחות מחמישה קשרים', laws: rest });
    }
    return out;
  }, [domain, sort, query, mine, promoted, NEIGHBORS]);

  const count = groups.reduce((n, g) => n + g.laws.length, 0);
  const mineSel: MineLaw | undefined = mine.find((l) => l.id === selectedId);
  const law = mineSel ?? getLawById(selectedId) ?? INITIAL_LAWS[0];

  const pick = (id: string) => {
    // במחשב: הדיוקן נפתח במקום, והרשימה נשארת. בנייד: עוברים למסך החוק.
    if (window.matchMedia('(min-width: 768px)').matches) setSelectedId(id);
    else if (mine.some((l) => l.id === id)) navigate(`/my-laws?law=${id}`);
    else navigate(`/law/${id}`);
  };

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      <section className="flex min-h-0 flex-col px-4 py-4 md:px-6">
        <h1 className="h2">
          {sort === 'mine' ? (
            <>
              <span className="marker">{count}</span> חוקים שניסחת.
            </>
          ) : (
            <>
              <span className="marker">{count}</span> חוקים, מקובצים {SORTS.find((s) => s.id === sort)!.label}.
            </>
          )}
        </h1>
        <div className="mt-3 space-y-2">
          <input
            className="input"
            type="search"
            placeholder="חיפוש לפי שם, מושג או תגית"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש חוק"
          />
          <DomainFilter value={domain} onChange={setDomain} extra={[...promoted, ...mine]} />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="מיון">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSort(s.id);
                  // "החוקים שלי": הדיוקן נפתח על החוק הראשון שלך
                  const first = [...promoted, ...mine][0];
                  if (s.id === 'mine' && first) setSelectedId(first.id);
                }}
                aria-pressed={sort === s.id}
                className={`btn btn-sm ${sort === s.id ? 'bg-black text-white' : 'bg-zinc-100'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-y -mx-1 mt-3 flex-1 px-1">
          {count === 0 && sort === 'mine' && (
            <p className="py-6 text-sm text-zinc-500">
              עוד לא ניסחת חוק.{' '}
              <button className="font-bold underline" onClick={() => navigate('/create')}>
                למחולל החוקים
              </button>
              .
            </p>
          )}
          {count === 0 && sort !== 'mine' && (
            <p className="py-6 text-sm text-zinc-500">
              לא נמצא חוק שמתאים לחיפוש. נסי מילה אחרת, או{' '}
              <button
                className="font-bold underline"
                onClick={() => {
                  setQuery('');
                  setDomain(null);
                }}
              >
                נקי את הסינון
              </button>
              .
            </p>
          )}
          {groups.map((g) => (
            <div key={g.title} className="mb-3">
              <h2 className="sticky top-0 z-10 flex items-center gap-2 bg-white py-1.5 text-xs font-bold">
                {g.color && <span className="h-3 w-3" style={{ backgroundColor: g.color }} />}
                {g.title}
                <span className="meta font-normal">{g.laws.length}</span>
                {g.note && <span className="meta font-normal">· {g.note}</span>}
              </h2>
              <ul>
                {g.laws.map((l) => (
                  <li key={l.id}>
                    <button className="row" aria-current={l.id === selectedId} onClick={() => pick(l.id)}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex items-baseline gap-2">
                          <span
                            className="h-2 w-2 shrink-0 self-center"
                            style={isMine(l) ? { backgroundColor: MINE_COLOR, boxShadow: `0 0 0 1.5px ${domainColor(l.domain[0])}` } : { backgroundColor: domainColor(l.domain[0]) }}
                          />
                          <span className="text-sm font-bold">{l.name}</span>
                          {l.created_by === 'anat' && <span className="marker shrink-0 text-[11px]">ניסחת</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="meta">{links(l.id)} קשרים</span>
                          {isMine(l) ? <span className="meta">לא אומת</span> : <Evidence value={l.evidence_strength} />}
                        </span>
                      </span>
                      {l.created_by === 'anat' && originLine(l) ? (
                        <span className="mt-0.5 block pr-4 text-xs text-zinc-600">
                          <b className="text-black">חוק שלך</b>, נוצר מ: {originLine(l)}
                        </span>
                      ) : (
                        <span className="mt-0.5 line-clamp-1 block pr-4 text-xs text-zinc-500">{l.definition}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-y hidden md:block" style={{ ['--cover-h' as string]: 'min(64vh, 620px)' }}>
        {mineSel ? (
          <div className="max-w-3xl px-9 py-7">
            <MineLawCard law={mineSel} onSelect={setSelectedId} />
          </div>
        ) : (
          <>
            <LawCover key={law.id} law={law} />
            <div className="max-w-3xl px-9 py-7">
              <LawPortrait law={law} onSelect={setSelectedId} afterCover />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
