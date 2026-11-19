// חוזק ראיות כאורך: חמישה מקטעים, שהעין מודדת בדיוק
export default function Evidence({ value, showLabel = false }: { value: number; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`חוזק ראיות ${value} מתוך 5`}>
      <span className="flex gap-px" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-1.5 w-3 ${i <= value ? 'bg-black' : 'bg-zinc-200'}`} />
        ))}
      </span>
      {showLabel && <span className="meta">חוזק ראיות {value} מתוך 5</span>}
    </span>
  );
}
