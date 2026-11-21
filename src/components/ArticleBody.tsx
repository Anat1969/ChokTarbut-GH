import RichText from './RichText';

// כתבה היא טקסט פשוט: שורת כותרת, "## " פותח פרק, ושורה שכולה **מודגשת** היא תובנת הפרק.
export interface Chapter {
  heading?: string;
  blocks: { insight: boolean; lines: string[] }[];
}
export interface ParsedArticle {
  title: string;
  chapters: Chapter[];
  insights: string[];
  minutes: number;
}

const INSIGHT = /^\*\*([^*]+)\*\*$/;

export function parseArticle(text: string): ParsedArticle {
  const blocks = text
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const title = (blocks.shift() ?? '').replace(/^#+\s*/, '');
  const chapters: Chapter[] = [];
  const insights: string[] = [];
  let current: Chapter | null = null;
  for (const block of blocks) {
    let lines = block.split('\n').map((l) => l.trim());
    if (lines[0].startsWith('## ')) {
      current = { heading: lines[0].slice(3), blocks: [] };
      chapters.push(current);
      lines = lines.slice(1);
      if (!lines.length) continue;
    }
    if (!current) {
      current = { blocks: [] };
      chapters.push(current);
    }
    const m = lines.length === 1 ? lines[0].match(INSIGHT) : null;
    if (m) insights.push(m[1]);
    current.blocks.push({ insight: Boolean(m), lines: m ? [m[1]] : lines });
  }
  const words = text.split(/\s+/).length;
  return { title, chapters, insights, minutes: Math.max(1, Math.round(words / 180)) };
}

// גוף הכתבה: פרקים ממוספרים, כל משפט בשורה שלו, ותובנה במרקר בסוף כל פרק
export default function ArticleBody({ article }: { article: ParsedArticle }) {
  const numbered = article.chapters.filter((c) => c.heading).length > 1;
  let n = 0;
  return (
    <div className="article-read">
      {article.chapters.map((chapter, i) => (
        <section key={i} className="article-chapter">
          {chapter.heading && (
            <h3 className="article-chapter-head">
              {numbered && <span className="num article-chapter-num">{String(++n).padStart(2, '0')}</span>}
              {chapter.heading}
            </h3>
          )}
          {chapter.blocks.map((block, j) =>
            block.insight ? (
              <p key={j} className="article-insight">
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
  );
}
