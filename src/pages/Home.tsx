import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_LAWS, getLawById } from '../data/laws';
import { EDGES, CROSS_DOMAIN_EDGES, HUB } from '../lib/graph';
import LawMap from '../components/LawMap';
import LawPortrait from '../components/LawPortrait';
import DomainFilter from '../components/DomainFilter';
import type { Domain } from '../types';

const ENGINES = [
  { to: '/library', label: 'גלה', text: 'כל החוקים, לפי תחום וקשר' },
  { to: '/explain', label: 'הסבר', text: 'תופעה נכנסת, חוק יוצא' },
  { to: '/create', label: 'צור', text: 'שני חוקים הופכים לחוק חדש' },
];

const randomId = () => INITIAL_LAWS[Math.floor(Math.random() * INITIAL_LAWS.length)].id;

export default function Home() {
  // דף הבית מתחלף: חוק אחר בכל כניסה, ומתחלף לבד עד שענת בוחרת
  const [selectedId, setSelectedId] = useState(randomId);
  const [touched, setTouched] = useState(false);
  const [domain, setDomain] = useState<Domain | null>(null);

  useEffect(() => {
    if (touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setSelectedId(randomId()), 7000);
    return () => clearInterval(timer);
  }, [touched]);

  const select = (id: string) => {
    setTouched(true);
    setSelectedId(id);
  };
  const law = getLawById(selectedId)!;

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      {/* טור הכניסה: המסר, שלושת המנועים, ודיוקן החוק שנבחר */}
      <section className="scroll-y flex flex-col gap-5 px-4 py-5 md:px-6">
        <div>
          <h1 className="text-3xl font-black leading-tight md:text-[2.6rem]">
            חוק אחד מסביר תופעות <mark className="marker bg-transparent">בעולמות רחוקים</mark>.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            <b className="text-black">{INITIAL_LAWS.length}</b> חוקים ו-<b className="text-black">{EDGES.length}</b> קשרים.{' '}
            <b className="text-black">{CROSS_DOMAIN_EDGES}</b> מהקשרים מחברים חוקים שאין להם תחום משותף.
            <br />
            החוק המקושר ביותר:{' '}
            <button className="font-bold underline decoration-2 underline-offset-2" onClick={() => select(HUB.law.id)}>
              {HUB.law.name}
            </button>
            , עם <b className="text-black">{HUB.degree}</b> קשרים.
          </p>
        </div>

        <nav className="grid grid-cols-3 gap-2" aria-label="שלושת המנועים">
          {ENGINES.map((e) => (
            <Link key={e.to} to={e.to} className="btn-primary flex-col !items-start !gap-0 !px-3 !py-3 text-right">
              <span className="text-2xl font-black leading-none">{e.label}</span>
              <span className="mt-1.5 text-[11px] font-normal leading-snug opacity-70">{e.text}</span>
            </Link>
          ))}
        </nav>

        <div className="bg-zinc-50 p-4" aria-live="polite">
          <LawPortrait law={law} onSelect={select} brief />
        </div>
      </section>

      {/* המוקד: מפת הקשרים */}
      <section className="flex min-h-0 flex-col px-2 pb-3 md:px-4 md:py-4">
        <div className="px-2">
          <DomainFilter value={domain} onChange={setDomain} />
          <p className="meta mt-1.5">
            כל נקודה היא חוק, בצבע התחום שלו. כל קו הוא קשר. נקודה גדולה: חוק עם הרבה קשרים. לחיצה בוחרת חוק.
          </p>
        </div>
        <LawMap selectedId={selectedId} domain={domain} onSelect={select} className="min-h-0 w-full md:flex-1" />
      </section>
    </main>
  );
}
