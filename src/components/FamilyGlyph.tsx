import type { FamilyId } from '../data/families';

interface Props {
  family: FamilyId;
  color?: string; // צבע ההדגשה: צבע התחום של החוק
  animate?: boolean;
  className?: string;
}

// תרשים קו לכל משפחת מנגנון. כשהוא מונפש, התנועה מראה את המנגנון פעם אחת ונעצרת.
// שפה אחת לכל השישה: קו בעובי 1.75, שחור, וצבע אחד להדגשה.
export default function FamilyGlyph({ family, color = '#111', animate = false, className = '' }: Props) {
  const a = animate ? 'g-anim' : '';
  return (
    <svg
      viewBox="0 0 120 120"
      className={`glyph ${a} ${className}`}
      style={{ ['--accent' as string]: color, direction: 'ltr' }}
      fill="none"
      stroke="#111"
      strokeWidth={1.75}
      strokeLinecap="square"
      aria-hidden="true"
    >
      {family === 'contagion' &&
        // הדבקה וסף: גל שמתפשט מפינה אחת על פני רשת
        Array.from({ length: 25 }).map((_, i) => {
          const x = i % 5;
          const y = Math.floor(i / 5);
          const d = x + (4 - y);
          return (
            <rect
              key={i}
              x={18 + x * 18}
              y={18 + y * 18}
              width={12}
              height={12}
              stroke="none"
              className={d <= 5 ? 'g-fill' : 'g-off'}
              style={{ ['--d' as string]: d }}
            />
          );
        })}

      {family === 'swarm' &&
        // תיאום בלי מרכז: חיצים שמתיישרים לכיוון אחד
        Array.from({ length: 16 }).map((_, i) => {
          const x = 24 + (i % 4) * 24;
          const y = 24 + Math.floor(i / 4) * 24;
          const from = ((i * 67) % 300) - 150;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className="g-turn" style={{ ['--from' as string]: `${from}deg`, ['--d' as string]: i % 5 }}>
                <path d="M-8 3 L8 -3 M3 -6 L8 -3 L5 2" stroke={i % 5 === 0 ? 'var(--accent)' : '#111'} />
              </g>
            </g>
          );
        })}

      {family === 'scale' && (
        // גודל וסקייל: העקומה האמיתית מתחת לקו הישר
        <>
          <path d="M16 104 H108 M16 104 V14" />
          <path d="M16 104 L104 18" strokeDasharray="3 5" stroke="#a1a1aa" />
          <path d="M16 104 C40 62 70 44 104 36" stroke="var(--accent)" strokeWidth={3} pathLength={1} className="g-draw" />
          <rect x={100} y={32} width={8} height={8} fill="var(--accent)" stroke="none" className="g-pop" />
        </>
      )}

      {family === 'limit' && (
        // תקרה ותקציב: עמודות שמתקרבות לתקרה ולא עוברות אותה
        <>
          <path d="M12 22 H108" stroke="var(--accent)" strokeWidth={3} />
          <path d="M12 104 H108" />
          {[46, 64, 73, 77, 79].map((h, i) => (
            <rect
              key={i}
              x={18 + i * 18}
              y={104 - h}
              width={12}
              height={h}
              fill="#111"
              stroke="none"
              className="g-grow"
              style={{ ['--d' as string]: i }}
            />
          ))}
        </>
      )}

      {family === 'skew' && (
        // ריכוז ואי־שוויון: אחד גדול, והשאר יורדים מהר
        <>
          <path d="M12 104 H108" />
          {[84, 42, 28, 21, 17, 14, 12].map((h, i) => (
            <rect
              key={i}
              x={16 + i * 13}
              y={104 - h}
              width={9}
              height={h}
              fill={i === 0 ? 'var(--accent)' : '#111'}
              stroke="none"
              className="g-grow"
              style={{ ['--d' as string]: i }}
            />
          ))}
        </>
      )}

      {family === 'dilemma' && (
        // פרט מול כלל: שני מסלולים, וכולם נדחסים לאחד
        <>
          <path d="M18 60 C40 18 80 18 102 60" />
          <path d="M18 60 C40 102 80 102 102 60" stroke="var(--accent)" className="g-thick" />
          <rect x={12} y={54} width={12} height={12} fill="#111" stroke="none" />
          <rect x={96} y={54} width={12} height={12} fill="#111" stroke="none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={36 + i * 10} y={84 + Math.abs(2 - i) * -3} width={6} height={6} fill="var(--accent)" stroke="none" className="g-pop" style={{ ['--d' as string]: i + 2 }} />
          ))}
        </>
      )}
    </svg>
  );
}
