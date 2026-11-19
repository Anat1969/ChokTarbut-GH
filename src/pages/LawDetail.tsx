import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLawById } from '../data/laws';
import LawPortrait from '../components/LawPortrait';
import LawMap from '../components/LawMap';

export default function LawDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      <section className="scroll-y px-4 py-5 md:px-6">
        <Link to="/library" className="btn-soft btn-sm mb-4">
          לכל החוקים
        </Link>
        <LawPortrait law={law} />
      </section>
      <section className="hidden min-h-0 flex-col px-4 py-4 md:flex">
        <p className="meta px-2">
          <b className="text-black">{law.name}</b> בתוך מפת הקשרים. לחיצה על חוק אחר עוברת אליו.
        </p>
        <LawMap selectedId={law.id} onSelect={(next) => navigate(`/law/${next}`)} className="min-h-0 w-full flex-1" />
      </section>
    </main>
  );
}
