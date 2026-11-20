import { FAMILY_OF } from '../data/families';
import { promptOf } from '../data/prompts';
import { useLawImage } from '../lib/images';
import { domainColor } from './DomainBadge';
import FamilyGlyph from './FamilyGlyph';
import type { Law } from '../types';

// תצוגה קטנה לדיוקן הקצר בדף הבית: הגרפיקה תמיד, והתמונה לידה אם כבר יש.
// המסך המלא של חוק משתמש ב-LawCover.
export default function LawImage({ law }: { law: Law }) {
  const image = useLawImage(law.id);
  return (
    <div className={`grid gap-2 ${image.url ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <div className="frame frame-static">
        <div className="frame-mat">
          <FamilyGlyph key={law.id} family={FAMILY_OF[law.id]} color={domainColor(law.domain[0])} animate className="h-full w-full" />
        </div>
      </div>
      {image.url && (
        <div className="frame frame-static">
          <img src={image.url} alt={promptOf(law.id)?.idea ?? law.name} loading="lazy" />
        </div>
      )}
    </div>
  );
}
