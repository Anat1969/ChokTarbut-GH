import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { edgePath } from '../lib/graph';
import { useGraph, isMine, MINE_COLOR } from '../lib/mine';
import { domainColor } from './DomainBadge';
import type { Domain } from '../types';

interface Props {
  selectedId?: string | null;
  highlightIds?: string[]; // חוקים שסומנו מבחוץ, למשל תוצאת הסבר
  domain?: Domain | null;
  onSelect: (id: string) => void;
  className?: string;
  narrow?: boolean; // פריסה צרה גם במחשב, כשהמפה מקבלת טור צר
}

// מפת הקשרים: כל חוק הוא נקודה בצבע התחום הראשי שלו, וכל קו הוא קורלציה.
export default function LawMap({ selectedId, highlightIds, domain, onSelect, className = '', narrow: forceNarrow = false }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { wide: WIDE, narrow: NARROW, edges: EDGES, neighbors: NEIGHBORS } = useGraph();
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const layout = narrow || forceNarrow ? NARROW : WIDE;
  const NODE_BY_ID = layout.byId;
  const focusId = hoverId ?? selectedId ?? null;
  const marked = new Set(highlightIds ?? []);

  const lit = new Set<string>();
  if (focusId) {
    lit.add(focusId);
    (NEIGHBORS[focusId] ?? []).forEach((id) => lit.add(id));
  }
  marked.forEach((id) => lit.add(id));
  const anyFocus = lit.size > 0;

  const nodeOn = (id: string) => {
    if (!NODE_BY_ID[id]) return false;
    const inDomain = !domain || NODE_BY_ID[id].law.domain.includes(domain);
    return inDomain && (!anyFocus || lit.has(id));
  };
  const edgeOn = (a: string, b: string) => {
    if (domain && !(NODE_BY_ID[a].law.domain.includes(domain) && NODE_BY_ID[b].law.domain.includes(domain))) return false;
    if (focusId) return a === focusId || b === focusId;
    if (marked.size > 0) return marked.has(a) && marked.has(b);
    return true;
  };

  const mineCount = layout.nodes.filter((n) => isMine(n.law)).length;

  return (
    <svg
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      className={className}
      style={{ direction: 'ltr' }}
      role="group"
      aria-label="מפת הקשרים בין החוקים"
      preserveAspectRatio="xMidYMid meet"
    >
      <g>
        {EDGES.map(({ a, b }) => {
          const on = edgeOn(a, b);
          const strong = on && (focusId !== null || marked.size > 0);
          return (
            <path
              key={`${a}|${b}`}
              d={edgePath(layout, NODE_BY_ID[a], NODE_BY_ID[b])}
              className={`map-edge ${on ? '' : 'is-dim'}`}
              style={strong ? { stroke: domainColor(NODE_BY_ID[focusId ?? a].law.domain[0]), strokeWidth: 2 } : undefined}
            />
          );
        })}
      </g>
      <g>
        {layout.nodes.map(({ law, x, y, side, degree }) => {
          const on = nodeOn(law.id);
          const mine = isMine(law);
          // חוק שענת ניסחה נפתח בחוקים שלה, כי אין לו עמוד במאגר
          const open = () => (mine ? navigate(`/my-laws?law=${law.id}`) : onSelect(law.id));
          const isFocus = law.id === focusId || marked.has(law.id);
          const r = 6 + degree;
          return (
            <g
              key={law.id}
              className={`map-node ${on ? '' : 'is-dim'} ${isFocus ? 'is-on' : ''}`}
              onMouseEnter={() => setHoverId(law.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={open}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${law.name}${mine ? ' (חוק שניסחת)' : ''}, ${law.domain.join(', ')}, ${degree} קשרים`}
              data-mine={mine || undefined}
              aria-pressed={law.id === selectedId}
            >
              {/* שטח לחיצה רחב, גם על השם */}
              <rect x={side === 'right' ? x - 16 : x - 244} y={y - 14} width={260} height={28} fill="transparent" />
              {isFocus && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#000" strokeWidth={1.5} />}
              {mine ? (
                // חוק שענת ניסחה: ריבוע בצהוב־תובנה, עם מסגרת בצבע התחום
                <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={MINE_COLOR} stroke={domainColor(law.domain[0])} strokeWidth={3} />
              ) : (
                <>
                  {/* חוק שענת ניסחה והכניסה למאגר: עיגול רגיל עם טבעת צהוב־תובנה */}
                  {law.created_by === 'anat' && <circle cx={x} cy={y} r={r + 3} fill={MINE_COLOR} />}
                  <circle cx={x} cy={y} r={r} fill={domainColor(law.domain[0])} />
                </>
              )}
              {!mine && law.domain[1] && <circle cx={x} cy={y} r={Math.max(2, r - 4)} fill={domainColor(law.domain[1])} stroke="#fff" strokeWidth={1} />}
              <text
                className="map-label"
                x={side === 'right' ? x + r + 9 : x - r - 9}
                y={y + 6}
                textAnchor={side === 'right' ? 'start' : 'end'}
              >
                {law.name}
              </text>
            </g>
          );
        })}
      </g>
      {mineCount > 0 && (
        // מקרא: מופיע רק כשיש ברשת חוקים שענת ניסחה
        <g aria-hidden="true">
          <rect x={layout.w - 26} y={layout.h - 26} width={14} height={14} fill={MINE_COLOR} stroke="#000" strokeWidth={1} />
          <text className="map-label" x={layout.w - 34} y={layout.h - 14} textAnchor="start" style={{ direction: 'rtl' }}>
            חוק שניסחת ({mineCount})
          </text>
        </g>
      )}
    </svg>
  );
}
