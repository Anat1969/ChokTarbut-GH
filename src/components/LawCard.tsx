import { useNavigate } from 'react-router-dom';
import type { Law } from '../types';
import DomainBadge from './DomainBadge';

interface LawCardProps {
  law: Law;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (law: Law) => void;
}

// חמישה כוכבים לחוזק הראיות
function StrengthDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-black' : 'bg-zinc-200'}`}
        />
      ))}
    </div>
  );
}

export default function LawCard({ law, compact = false, selected = false, onSelect }: LawCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) {
      onSelect(law);
    } else {
      navigate(`/law/${law.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`law-card ${selected ? 'border-black shadow-sm' : ''} ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {/* תגי תחומים */}
      <div className="flex flex-wrap gap-1 mb-3">
        {law.domain.map((d) => (
          <DomainBadge key={d} domain={d} />
        ))}
      </div>

      {/* שם החוק */}
      <h3 className="font-bold text-base mb-1">{law.name}</h3>
      {law.name_en && (
        <p className="text-xs text-zinc-500 mb-2 font-normal" dir="ltr">
          {law.name_en}
        </p>
      )}

      {/* הגדרה */}
      <p className={`text-sm text-zinc-600 leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>
        {law.definition}
      </p>

      {!compact && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
          <StrengthDots value={law.evidence_strength} />
          <span className="text-xs text-zinc-400">{law.source}</span>
        </div>
      )}
    </div>
  );
}
