import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLawById } from '../data/laws';
import LawPortrait from '../components/LawPortrait';
import LawMap from '../components/LawMap';
import LawCover from '../components/LawCover';
import { usePromoted } from '../lib/promoted';

export default function LawDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePromoted(); // חוק שהוכנס למאגר נמצא אחרי הסנכרון עם הענן
  const law = id ? getLawById(id) : undefined;

  if (!law) {
    return (
      <main className="page px-6 py-10">
        <h1 className="mb-2 text-2xl font-black">החוק הזה לא נמצא במאגר.</h1>
        <p className="mb-4 text-sm text-zinc-600">ייתכן שהקישור ישן. כל החוקים נמצאים בספרייה.</p>
        <Link to="/library" className="btn-primary">
          לספרייה
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <LawCover law={law} />
      <div className="grid gap-8 px-4 py-8 md:grid-cols-[38.2fr_61.8fr] md:px-9">
        <section>
          <LawPortrait law={law} afterCover />
          <Link to="/library" className="btn-soft btn-sm mt-8">
            לכל החוקים
          </Link>
        </section>
        <section className="hidden md:block" data-col="main">
          <p className="meta">
            <b className="text-black">{law.name}</b> ברשת הקשרים. לחיצה על חוק אחר עוברת אליו.
          </p>
          <LawMap selectedId={law.id} onSelect={(next) => navigate(`/law/${next}`)} className="sticky top-16 w-full" />
        </section>
      </div>
    </main>
  );
}
