import type { Domain } from '../types';
import { DOMAIN_COLORS } from '../data/laws';

interface DomainBadgeProps {
  domain: Domain;
  size?: 'sm' | 'md';
}

export default function DomainBadge({ domain, size = 'sm' }: DomainBadgeProps) {
  const color = DOMAIN_COLORS[domain] ?? '#71717a';

  return (
    <span
      className={`domain-badge ${size === 'md' ? 'text-sm px-3 py-1' : ''}`}
      style={{ backgroundColor: color }}
    >
      {domain}
    </span>
  );
}
