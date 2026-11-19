import { DOMAIN_COLORS } from '../data/laws';
import type { Domain } from '../types';

// צבע תחום הוא מידע: אותו צבע בתג, במפה, בסינון ובכותרת הקבוצה
export function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain as Domain] ?? '#71717a';
}

// כתום הכלכלה בהיר, ולכן הטקסט עליו שחור
export function domainInk(domain: string): string {
  return domain === 'כלכלה' ? '#000' : '#fff';
}

export default function DomainBadge({ domain }: { domain: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 text-[11px] font-medium leading-none"
      style={{ backgroundColor: domainColor(domain), color: domainInk(domain) }}
    >
      {domain}
    </span>
  );
}
