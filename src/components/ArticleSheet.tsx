import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { promptOf } from '../data/prompts';
import { useLawImage } from '../lib/images';
import { domainColor } from './DomainBadge';
import RichText from './RichText';
import type { ParsedArticle } from './ArticleBody';
import type { Law } from '../types';

// גיליון ההדפסה של כתבה: דף A4 אחד, תמיד.
// הגיליון נבנה בגודל הדף, והגופן קטן צעד אחר צעד עד שכל הכתבה נכנסת בו. רק אז נפתחת ההדפסה.
export default function ArticleSheet({ law, article, onDone }: { law: Law; article: ParsedArticle; onDone: () => void }) {
  const sheet = useRef<HTMLDivElement>(null);
  const image = useLawImage(law.id);
  const domain = law.domain[0];

  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    let cancelled = false;
    // מתחילים מגופן גדול ומקטינים עד שהכתבה נכנסת: כתבה קצרה ממלאת את הדף, וארוכה לא גולשת ממנו.
    // טורים שגולשים נפתחים לרוחב, ולכן בודקים גם את רוחב גוף הכתבה
    const fit = () => {
      const body = el.querySelector<HTMLElement>('.a4-body')!;
      const over = () => el.scrollHeight > el.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1;
      let size = 16; // נקודות
      el.style.fontSize = `${size}pt`;
      while (over() && size > 5) {
        size -= 0.25;
        el.style.fontSize = `${size}pt`;
      }
    };
    const img = el.querySelector('img');
    const ready = img && !img.complete ? new Promise((r) => img.addEventListener('load', r, { once: true })).then(() => undefined) : Promise.resolve();
    const done = () => onDone();
    Promise.all([document.fonts.ready, Promise.race([ready, new Promise((r) => setTimeout(r, 2500))])]).then(() => {
      if (cancelled) return;
      fit();
      window.addEventListener('afterprint', done, { once: true });
      window.print();
    });
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', done);
    };
  }, [law.id, onDone]);

  let n = 0;
  return createPortal(
    <div className="a4-sheet" ref={sheet} dir="rtl">
      <header className="a4-head">
        <div>
          <p className="a4-kicker">
            <span style={{ backgroundColor: domainColor(domain) }} />
            {domain} · {law.name}
          </p>
          <h1>{article.title}</h1>
          <p className="a4-lead">{law.definition}</p>
        </div>
        {image.url && (
          <figure>
            <img src={image.url} alt={promptOf(law.id)?.idea ?? law.name} />
            <figcaption>הדמיה</figcaption>
          </figure>
        )}
      </header>
      <div className="a4-body">
        {article.chapters.map((chapter, i) => (
          <section key={i}>
            {chapter.heading && (
              <h2>
                <span className="num">{String(++n).padStart(2, '0')}</span>
                {chapter.heading}
              </h2>
            )}
            {chapter.blocks.map((block, j) =>
              block.insight ? (
                <p key={j} className="a4-insight">
                  <span className="marker">{block.lines[0]}</span>
                </p>
              ) : (
                <p key={j}>
                  {block.lines.map((line, k) => (
                    <span key={k} className="block">
                      <RichText text={line} />
                    </span>
                  ))}
                </p>
              ),
            )}
          </section>
        ))}
      </div>
      <footer className="a4-foot">
        <span>חוקי התנהגות · אד' ענת דוד שטיבלמן</span>
        <span>
          מקור החוק: <bdi>{law.source}</bdi>
        </span>
      </footer>
    </div>,
    document.body,
  );
}
