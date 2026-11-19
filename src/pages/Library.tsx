import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_LAWS, ALL_DOMAINS, getLawById } from '../data/laws';
import { NEIGHBORS } from '../lib/graph';
import DomainFilter from '../components/DomainFilter';
import { domainColor } from '../components/DomainBadge';
import Evidence from '../components/Evidence';
import LawPortrait from '../components/LawPortrait';
import type { Domain, Law } from '../types';

type Sort = 'domain' | 'evidence' | 'links';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'domain', label: 'לפי תחום' },
  { id: 'evidence', label: 'לפי חוזק ראיות' },
  { id: 'links', label: 'לפי מספר קשרים' },
];
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
  const [sort, setSort] = useState<Sort>('domain');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(INITIAL_LAWS[0].id);

  const groups = useMemo(() => {
    const q = query.trim();
    const laws = INITIAL_LAWS.filter(
      (l) =>
        (!domain || l.domain.includes(domain)) &&
        (!q || [l.name, l.name_en ?? '', l.definition, ...l.tags].some((t) => t.toLowerCase().includes(q.toLowerCase()))),
    );
    const out: { title: string; color?: string; laws: Law[] }[] = [];
    if (sort === 'domain') {
      for (const d of ALL_DOMAINS) {
        const list = laws.filter((l) => l.domain[0] === d);
        if (list.length) out.push({ title: d, color: domainColor(d), laws: list });
      }
    } else if (sort === 'evidence') {
      for (const v of [5, 4, 3, 2, 1]) {
        const list = laws.filter((l) => l.evidence_strength === v);
        if (list.length) out.push({ title: EVIDENCE_TITLES[v], laws: list });
      }
    } else {
      const sorted = [...laws].sort((a, b) => NEIGHBORS[b.id].length - NEIGHBORS[a.id].length);
      const hubs = sorted.filter((l) => NEIGHBORS[l.id].length >= 5);
      const rest = sorted.filter((l) => NEIGHBORS[l.id].length < 5);
      if (hubs.length) out.push({ title: 'צמתים: חמישה קשרים ויותר', laws: hubs });
      if (rest.length) out.push({ title: 'פחות מחמישה קשרים', laws: rest });
    }
    return out;
  }, [domain, sort, query]);

  const count = groups.reduce((n, g) => n + g.laws.length, 0);
  const law = getLawById(selectedId)!;

  const pick = (id: string) => {
    // במחשב: הדיוקן נפתח במקום, והרשימה נשארת. בנייד: עוברים למסך החוק.
    if (window.matchMedia('(min-width: 768px)').matches) setSelectedId(id);
    else navigate(`/law/${id}`);
  };

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      <section className="flex min-h-0 flex-col px-4 py-4 md:px-6">
        <h1 className="text-2xl font-black leading-tight">
          <span className="marker">{count}</span> חוקים, מקובצים {SORTS.find((s) => s.id === sort)!.label}.
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
          <DomainFilter value={domain} onChange={setDomain} />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="מיון">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                aria-pressed={sort === s.id}
                className={`btn btn-sm ${sort === s.id ? 'bg-black text-white' : 'bg-zinc-100'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-y -mx-1 mt-3 flex-1 px-1">
          {count === 0 && (
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
              </h2>
              <ul>
                {g.laws.map((l) => (
                  <li key={l.id}>
                    <button className="row" aria-current={l.id === selectedId} onClick={() => pick(l.id)}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex items-baseline gap-2">
                          <span className="h-2 w-2 shrink-0 self-center" style={{ backgroundColor: domainColor(l.domain[0]) }} />
                          <span className="text-sm font-bold">{l.name}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="meta">{NEIGHBORS[l.id].length} קשרים</span>
                          <Evidence value={l.evidence_strength} />
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 block pr-4 text-xs text-zinc-500">{l.definition}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-y hidden bg-zinc-50 px-8 py-6 md:block">
        <div className="max-w-2xl">
          <LawPortrait law={law} onSelect={setSelectedId} />
        </div>
      </section>
    </main>
  );
}
