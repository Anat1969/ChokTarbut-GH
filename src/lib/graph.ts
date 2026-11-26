// מפת הקשרים: פריסה קבועה של כל החוקים על שתי קשתות, מקובצים לפי תחום ראשי.
// לכל חוק שורה משלו, כך שהשמות אף פעם לא עולים זה על זה.
import { INITIAL_LAWS, ALL_DOMAINS } from '../data/laws';
import { EXTRA_LINKS } from '../data/families';
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

// הרשת נבנית מרשימת חוקים: המאגר, ובנוסף החוקים שענת ניסחה (useGraph ב-mine.ts).
export interface Graph {
  edges: MapEdge[];
  neighbors: Record<string, string[]>;
  ordered: Law[];
  wide: MapLayout;
  narrow: MapLayout;
}

export function buildGraph(laws: Law[]): Graph {
  // קשרים דו־כיווניים: מספיק שחוק אחד מצביע על השני
  const ids = new Set(laws.map((l) => l.id));
  const seen = new Set<string>();
  const edges: MapEdge[] = [];
  const pairs: Array<[string, string]> = [
    ...laws.flatMap((law) => law.correlations.map((other): [string, string] => [law.id, other])),
    ...EXTRA_LINKS,
  ];
  for (const [id, other] of pairs) {
    if (!ids.has(id) || !ids.has(other) || other === id) continue;
    const k = key(id, other);
    if (seen.has(k)) continue;
    seen.add(k);
    edges.push({ a: id, b: other });
  }
  const neighbors: Record<string, string[]> = {};
  for (const law of laws) neighbors[law.id] = [];
  for (const { a, b } of edges) {
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  const ordered = [...laws].sort((p, q) => ALL_DOMAINS.indexOf(p.domain[0]) - ALL_DOMAINS.indexOf(q.domain[0]));
  // שתי פריסות: רחבה למחשב, וצרה וגבוהה לנייד, כדי שהשמות יישארו קריאים
  const wide = buildLayout(ordered, neighbors, 1000, 860, 262, 400);
  const narrow = buildLayout(ordered, neighbors, 700, 820, 100, 385);
  return { edges, neighbors, ordered, wide, narrow };
}

function buildLayout(
  ordered: Law[],
  neighbors: Record<string, string[]>,
  w: number,
  h: number,
  rx: number,
  ry: number,
): MapLayout {
  const cx = w / 2;
  const cy = h / 2;
  const half = Math.ceil(ordered.length / 2);
  // הקשת הימנית יורדת מלמעלה, והשמאלית עולה מלמטה: התחומים רציפים סביב המעגל
  const right = ordered.slice(0, half);
  const left = ordered.slice(half).reverse();
  const place = (laws: Law[], side: 'right' | 'left'): MapNode[] =>
    laws.map((law, i) => {
      const t = laws.length === 1 ? 0 : (i / (laws.length - 1)) * 2 - 1; // מ־1- עד 1
      const y = cy + t * ry * 0.94;
      const dx = rx * Math.sqrt(Math.max(0, 1 - (t * 0.94) ** 2 * 0.9));
      return { law, x: side === 'right' ? cx + dx : cx - dx, y, side, degree: neighbors[law.id].length };
    });
  const nodes = [...place(right, 'right'), ...place(left, 'left')];
  return { w, h, rx, ry, nodes, byId: Object.fromEntries(nodes.map((n) => [n.law.id, n])) };
}

// הרשת של המאגר בלבד
export const BASE_GRAPH = buildGraph(INITIAL_LAWS);
export const EDGES = BASE_GRAPH.edges;
export const NEIGHBORS = BASE_GRAPH.neighbors;
export const ORDERED = BASE_GRAPH.ordered;
export const WIDE = BASE_GRAPH.wide;
export const NARROW = BASE_GRAPH.narrow;

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
