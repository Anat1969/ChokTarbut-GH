import { useRef, useState } from 'react';

interface Props {
  onText: (text: string) => void;
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

// הקלטה ותמלול בעברית, בדפדפנים שתומכים בכך. בדפדפן שלא תומך, הכפתור לא מוצג.
export default function Dictate({ onText }: Props) {
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const w = window as unknown as Record<string, new () => Recognition>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const toggle = () => {
    if (on) return rec.current?.stop();
    const r = new Ctor();
    r.lang = 'he-IL';
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0].transcript).join(' '));
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    setOn(true);
    r.start();
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={on} className={on ? 'btn btn-sm bg-red-600 text-white' : 'btn-soft btn-sm'}>
      {on ? 'מקליט. לעצירה' : 'הקלטה'}
    </button>
  );
}
