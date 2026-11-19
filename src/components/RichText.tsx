// מציג טקסט שה-AI כתב: **מילה** הופכת למרקר צהוב
export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="marker bg-transparent">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}
