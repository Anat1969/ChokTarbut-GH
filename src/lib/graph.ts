// מפת הקשרים: פריסה קבועה של כל החוקים על שתי קשתות, מקובצים לפי תחום ראשי.
// לכל חוק שורה משלו, כך שהשמות אף פעם לא עולים זה על זה.
import { INITIAL_LAWS, ALL_DOMAINS } from '../data/laws';
import type { Law } from '../types';

export interface MapLayout {
  w: number;
  h: number;
  rx: number; // חצי רוחב העדשה
  ry: number; // חצי גובה
  nodes: MapNode[];
  byId: Record<string, MapNode>;
}

export interface MapNode {
  law: Law;
  x: number;
  y: number;
  side: 'right' | 'left';
  degree: number;
}

export interface MapEdge {
  a: string;
  b: string;
}

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// קשרים דו־כיווניים: מספיק שחוק אחד מצביע על השני
export const EDGES: MapEdge[] = (() => {
  const ids = new Set(INITIAL_LAWS.map((l) => l.id));
  const seen = new Set<string>();
  const out: MapEdge[] = [];
  for (const law of INITIAL_LAWS) {
    for (const other of law.correlations) {
      if (!ids.has(other) || other === law.id) continue;
      const k = key(law.id, other);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ a: law.id, b: other });
    }
  }
  return out;
})();

export const NEIGHBORS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const law of INITIAL_LAWS) map[law.id] = [];
  for (const { a, b } of EDGES) {
    map[a].push(b);
    map[b].push(a);
  }
  return map;
})();

export const ORDERED: Law[] = [...INITIAL_LAWS].sort(
  (p, q) => ALL_DOMAINS.indexOf(p.domain[0]) - ALL_DOMAINS.indexOf(q.domain[0]),
);

function buildLayout(w: number, h: number, rx: number, ry: number): MapLayout {
  const cx = w / 2;
  const cy = h / 2;
  const half = Math.ceil(ORDERED.length / 2);
  // הקשת הימנית יורדת מלמעלה, והשמאלית עולה מלמטה: התחומים רציפים סביב המעגל
  const right = ORDERED.slice(0, half);
  const left = ORDERED.slice(half).reverse();
  const place = (laws: Law[], side: 'right' | 'left'): MapNode[] =>
    laws.map((law, i) => {
      const t = laws.length === 1 ? 0 : (i / (laws.length - 1)) * 2 - 1; // מ־1- עד 1
      const y = cy + t * ry * 0.94;
      const dx = rx * Math.sqrt(Math.max(0, 1 - (t * 0.94) ** 2 * 0.9));
      return { law, x: side === 'right' ? cx + dx : cx - dx, y, side, degree: NEIGHBORS[law.id].length };
    });
  const nodes = [...place(right, 'right'), ...place(left, 'left')];
  return { w, h, rx, ry, nodes, byId: Object.fromEntries(nodes.map((n) => [n.law.id, n])) };
}

// שתי פריסות: רחבה למחשב, וצרה וגבוהה לנייד, כדי שהשמות יישארו קריאים
export const WIDE: MapLayout = buildLayout(1000, 860, 262, 400);
export const NARROW: MapLayout = buildLayout(700, 820, 100, 385);

// קשת שמתעקלת אל מרכז המפה
export function edgePath(layout: MapLayout, a: MapNode, b: MapNode): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const pull = a.side === b.side ? 0.55 : 0.25;
  const qx = mx + (layout.w / 2 - mx) * pull;
  const qy = my + (layout.h / 2 - my) * pull;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

// החוק המקושר ביותר, והזוג הבין־תחומי: משמשים לשורות הגילוי בדף הבית
export const HUB: MapNode = [...WIDE.nodes].sort((a, b) => b.degree - a.degree)[0];
export const CROSS_DOMAIN_EDGES = EDGES.filter(({ a, b }) => {
  const da = WIDE.byId[a].law.domain;
  const db = WIDE.byId[b].law.domain;
  return !da.some((d) => db.includes(d));
}).length;
