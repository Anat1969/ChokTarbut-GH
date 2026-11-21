import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_DOMAINS, DOMAIN_COLORS, INITIAL_LAWS } from '../data/laws';

// הכריכה של האפליקציה: 47 חוקים נעים כלהקה, בלי שאיש מכוון אותם,
// ומתוך התנועה עולה צורה: קו רקיע של שבעה תחומים. אחר כך הלהקה מתפזרת, והכול מתחיל שוב.
// החזון והדרך לא נכתבים כאן. הם קורים על המסך.

const VERSES = [
  ['ציפור לא יודעת', 'את צורת הלהקה.'],
  ['נהג לא יודע', 'את צורת הפקק.'],
  ['ובכל זאת,', 'יש צורה.'],
];

// שלושה מצבים, במחזור: להקה חופשית, התכנסות, וקו הרקיע
const FLOCK = 9000;
const GATHER = 5000;
const HOLD = 6000;
const CYCLE = FLOCK + GATHER + HOLD;

interface Tile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  col: number; // הטור של התחום
  row: number; // הגובה בתוך הטור
  color: string;
}

// כל חוק הוא אריח, בצבע של תחום הבית שלו
function makeTiles(w: number, h: number): Tile[] {
  const heights = new Array(ALL_DOMAINS.length).fill(0);
  return INITIAL_LAWS.map((law) => {
    const col = ALL_DOMAINS.indexOf(law.domain[0]);
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * (w >= 768 ? w * 0.6 : w),
      y: Math.random() * h,
      vx: Math.cos(angle) * 1.2,
      vy: Math.sin(angle) * 1.2,
      col,
      row: heights[col]++,
      color: DOMAIN_COLORS[law.domain[0]],
    };
  });
}

export default function Cover() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [verse, setVerse] = useState(0);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let tiles: Tile[] = [];
    const pointer = { x: -999, y: -999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!tiles.length) tiles = makeTiles(w, h);
    };
    resize();
    window.addEventListener('resize', resize);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const leave = () => {
      pointer.x = -999;
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);

    // קו הרקיע: שבעה טורים, והאריחים נערמים מהקרקע. הוא יושב בצד שמאל, ב-61.8% מהרוחב
    const layout = () => {
      const wide = w >= 768;
      const areaW = wide ? w * 0.618 : w;
      // הטור הגבוה ביותר קובע את גודל האריח: בנייד קו הרקיע נשאר מתחת לטקסט ולכפתור
      const tallest = Math.max(...ALL_DOMAINS.map((d) => INITIAL_LAWS.filter((l) => l.domain[0] === d).length));
      const room = wide ? h * 0.66 : h - 150 - 290;
      const size = Math.max(10, Math.min(46, (areaW - 48) / (ALL_DOMAINS.length * 1.5), room / tallest - 3));
      const gap = size * 0.5;
      const total = ALL_DOMAINS.length * size + (ALL_DOMAINS.length - 1) * gap;
      const left = (areaW - total) / 2;
      const ground = h - (wide ? 86 : 150);
      return { size, gap, left, ground };
    };
    // העברית נקראת מימין, ולכן הטור הראשון הוא הימני
    const columnX = (col: number, L: ReturnType<typeof layout>) =>
      L.left + (ALL_DOMAINS.length - 1 - col) * (L.size + L.gap);

    let raf = 0;
    let shown = -1;
    const start = performance.now();

    const frame = (now: number) => {
      const t = still ? FLOCK + GATHER + 1 : (now - start) % CYCLE;
      const gathering = t > FLOCK;
      const held = t > FLOCK + GATHER;
      // כמה חזק האריח נמשך למקומו בקו הרקיע: 0 בלהקה, 1 כשהצורה שלמה
      const pull = !gathering ? 0 : held ? 1 : (t - FLOCK) / GATHER;
      const next = !gathering ? (Math.floor(t / (FLOCK / 2)) as 0 | 1) : 2;
      if (next !== shown) {
        shown = next;
        setVerse(next);
      }

      const L = layout();
      const near = L.size * 1.5;
      ctx.clearRect(0, 0, w, h);

      for (const a of tiles) {
        // כללי הלהקה: כל אריח רואה רק את שכניו. התרחקות, יישור כיוון, והתקרבות
        let ax = 0;
        let ay = 0;
        let mx = 0;
        let my = 0;
        let cx = 0;
        let cy = 0;
        let n = 0;
        for (const b of tiles) {
          if (a === b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > 110 || d === 0) continue;
          n++;
          mx += b.vx;
          my += b.vy;
          cx += dx;
          cy += dy;
          // מרחק ההתרחקות גדל עם האריח, כדי שהלהקה לא תיערם על עצמה
          if (d < near) {
            ax -= (dx / d) * (near - d) * 0.02;
            ay -= (dy / d) * (near - d) * 0.02;
          }
        }
        if (n) {
          ax += (mx / n - a.vx) * 0.04 + (cx / n) * 0.0006;
          ay += (my / n - a.vy) * 0.04 + (cy / n) * 0.0006;
        }
        // בלהקה האריחים נשארים בצד של הציור, ולא עוברים מעל הטקסט
        if (w >= 768 && a.x > w * 0.6) ax -= (a.x - w * 0.6) * 0.0009;
        // העכבר הוא טורף: הלהקה נפתחת סביבו
        const px = a.x - pointer.x;
        const py = a.y - pointer.y;
        const pd = Math.hypot(px, py);
        if (pd < 130 && pd > 0) {
          ax += (px / pd) * (130 - pd) * 0.012;
          ay += (py / pd) * (130 - pd) * 0.012;
        }
        const free = 1 - pull;
        a.vx += ax * free;
        a.vy += ay * free;
        const speed = Math.hypot(a.vx, a.vy) || 1;
        const want = 1.5;
        a.vx += (a.vx / speed) * (want - speed) * 0.05 * free;
        a.vy += (a.vy / speed) * (want - speed) * 0.05 * free;

        // המשיכה למקום בקו הרקיע
        const tx = columnX(a.col, L);
        const ty = L.ground - (a.row + 1) * (L.size + 3);
        if (pull > 0) {
          const k = 0.012 + pull * 0.06;
          a.vx = a.vx * (1 - pull * 0.12) + (tx - a.x) * k;
          a.vy = a.vy * (1 - pull * 0.12) + (ty - a.y) * k;
        }
        a.x += a.vx;
        a.y += a.vy;
        if (still) {
          a.x = tx;
          a.y = ty;
        }
        // בלהקה, מי שיוצא מצד אחד חוזר מהצד השני
        if (pull === 0) {
          if (w >= 768) {
            // במחשב האריחים חוזרים מהקצה השמאלי, כדי שלא יופיעו פתאום מעל הטקסט שמימין
            if (a.x < 0) a.vx = Math.abs(a.vx);
          } else {
            if (a.x < -L.size) a.x = w;
            if (a.x > w) a.x = -L.size;
          }
          if (a.y < -L.size) a.y = h;
          if (a.y > h) a.y = -L.size;
        }
        ctx.fillStyle = a.color;
        ctx.fillRect(a.x, a.y, L.size, L.size);
      }

      // המקרא עולה רק כשהצורה נוצרת: קו קרקע, ושם התחום מתחת לכל טור
      const ink = Math.max(0, (pull - 0.6) / 0.4);
      if (ink > 0) {
        ctx.globalAlpha = ink;
        ctx.fillStyle = '#111';
        ctx.fillRect(L.left - 12, L.ground + 2, ALL_DOMAINS.length * (L.size + L.gap) - L.gap + 24, 1);
        ctx.font = `500 ${w >= 768 ? 13 : 11}px "IBM Plex Sans Hebrew", sans-serif`;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ALL_DOMAINS.forEach((d, i) => ctx.fillText(d, columnX(i, L) + L.size / 2, L.ground + 22));
        ctx.globalAlpha = 1;
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <main className="page cover">
      <canvas ref={canvas} className="cover-canvas" aria-hidden="true" />
      <div className="cover-text">
        <h1 className="cover-verse" key={verse} aria-live="polite">
          <span className="block font-light">{VERSES[verse][0]}</span>
          <span className="block">
            <span className="marker">{VERSES[verse][1]}</span>
          </span>
        </h1>
        <p className="cover-count">
          <span className="num">{INITIAL_LAWS.length}</span> חוקים. <span className="num">{ALL_DOMAINS.length}</span> עולמות.
        </p>
        <Link to="/open" className="btn-primary mt-6">
          פתיחה
        </Link>
      </div>
    </main>
  );
}
