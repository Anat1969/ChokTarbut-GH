import { ALL_DOMAINS, INITIAL_LAWS } from '../data/laws';
import { FAMILIES, FAMILY_OF, SHORT_NAME, type FamilyId } from '../data/families';
import { NEIGHBORS } from '../lib/graph';
import { useSavedLaws } from '../lib/store';
import { domainColor, domainInk } from './DomainBadge';
import FamilyGlyph from './FamilyGlyph';
import type { Domain } from '../types';

export type Selection =
  | { type: 'law'; id: string }
  | { type: 'family'; id: FamilyId }
  | { type: 'cell'; family: FamilyId; domain: Domain }
  | null;

interface Props {
  selection: Selection;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (s: Selection) => void;
  domain: Domain | null;
  onDomain: (d: Domain | null) => void;
  highlightIds?: string[];
}

// כל המשבצות: משפחת מנגנון בשורה, תחום בטור. חוק מופיע בכל תחום שהוא נצפה בו.
export const CELLS = FAMILIES.map((f) =>
  ALL_DOMAINS.map((d) => INITIAL_LAWS.filter((l) => FAMILY_OF[l.id] === f.id && l.domain.includes(d))),
);
export const EMPTY_CELLS = CELLS.flat().filter((c) => c.length === 0).length;

// הטבלה המחזורית של ההתנהגות. בהשראת דמיטרי מנדלייב, 1869: גם המשבצות הריקות הן מידע.
export default function PeriodicTable({ selection, hoverId, onHover, onSelect, domain, onDomain, highlightIds }: Props) {
  const saved = useSavedLaws();
  const mine = saved.filter((l) => l.kind === 'created' && l.family);
  const focusId = hoverId ?? (selection?.type === 'law' ? selection.id : null);
  const lit = new Set<string>(highlightIds ?? []);
  if (focusId) {
    lit.add(focusId);
    (NEIGHBORS[focusId] ?? []).forEach((id) => lit.add(id));
  }
  const rowOn = selection?.type === 'family' ? selection.id : null;
  let i = 0;

  return (
    <div className="ptable" role="table" aria-label="הטבלה המחזורית של ההתנהגות">
      <div className="hidden items-end px-2 pb-1 text-[10px] leading-tight text-zinc-400 md:flex">
        מנגנון בשורה,
        <br />
        תחום בטור
      </div>
      {ALL_DOMAINS.map((d) => {
        const on = domain === d;
        return (
          <button
            key={d}
            className="pt-head"
            aria-pressed={on}
            onClick={() => onDomain(on ? null : d)}
            style={
              on
                ? { background: domainColor(d), color: domainInk(d) }
                : { boxShadow: `inset 0 -4px 0 ${domainColor(d)}` }
            }
          >
            {d}
          </button>
        );
      })}

      {FAMILIES.map((f, r) => (
        <div key={f.id} className="contents" role="row">
          <button
            className="pt-family"
            aria-pressed={rowOn === f.id}
            onClick={() => onSelect(rowOn === f.id ? null : { type: 'family', id: f.id })}
          >
            <span className="flex items-center gap-2">
              <FamilyGlyph family={f.id} className="pt-glyph h-7 w-7 shrink-0" />
              <span className="text-[13px] font-bold leading-tight">{f.name}</span>
            </span>
            <span className="mt-0.5 hidden text-[10px] leading-tight opacity-60 md:block">{f.short}</span>
          </button>
          {ALL_DOMAINS.map((d, c) => {
            const laws = CELLS[r][c];
            const own = mine.filter((l) => l.family === f.id && l.domain[0] === d);
            const colDim = domain !== null && domain !== d;
            const cellSel = selection?.type === 'cell' && selection.family === f.id && selection.domain === d;
            return (
              <div
                key={d}
                role="cell"
                className={`pt-cell ${rowOn === f.id ? 'is-row' : ''}`}
                style={colDim ? { opacity: 0.25 } : undefined}
              >
                {laws.map((law) => {
                  const home = law.domain[0] === d;
                  const dim = (lit.size > 0 && !lit.has(law.id)) || (rowOn !== null && rowOn !== f.id);
                  const sel = law.id === focusId;
                  return (
                    <button
                      key={law.id}
                      className={`tile ${dim ? 'is-dim' : ''} ${sel ? 'is-sel' : ''}`}
                      style={{
                        ['--i' as string]: i++,
                        ...(home
                          ? { background: domainColor(d), color: domainInk(d) }
                          : { boxShadow: `inset 0 3px 0 ${domainColor(d)}, 0 1px 2px rgba(0,0,0,.16)` }),
                      }}
                      title={law.name}
                      aria-label={`${law.name}, ${f.name}, ${d}`}
                      aria-pressed={selection?.type === 'law' && selection.id === law.id}
                      onMouseEnter={() => onHover(law.id)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(law.id)}
                      onBlur={() => onHover(null)}
                      onClick={() => onSelect({ type: 'law', id: law.id })}
                    >
                      {SHORT_NAME[law.id] ?? law.name}
                    </button>
                  );
                })}
                {own.map((l) => (
                  <span key={l.id} className="tile is-mine" title={`${l.name} (חוק שיצרת)`}>
                    {l.name}
                  </span>
                ))}
                {laws.length === 0 && own.length === 0 && (
                  <button
                    className="pt-empty"
                    aria-pressed={cellSel}
                    aria-label={`משבצת ריקה: ${f.name} ב${d}`}
                    onClick={() => onSelect({ type: 'cell', family: f.id, domain: d })}
                  >
                    ריקה
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
