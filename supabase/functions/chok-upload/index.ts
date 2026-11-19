// chok-upload: שומר את התמונות של החוקים לתמיד, בדלי chok-images של פרויקט cultura-GH.
// שום קובץ לא נמחק ולא נדרס: כל תמונה נשמרת בשם חדש, והיומן chok_images רק גדל.
//   upload   { law_id, image: base64 של JPEG }  -> שומר קובץ ומוסיף שורה ליומן
//   clear    { law_id }                          -> מוסיף שורה ריקה: המסגרת מתרוקנת, הקובץ נשאר
//   restore  { law_id, path }                    -> מחזיר למסגרת תמונה שכבר נשמרה לחוק הזה
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const BUCKET = 'chok-images'
const MAX_BYTES = 900_000
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// מגבלת קצב לכל מופע: עד 20 פעולות בדקה
const hits: number[] = []

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST בלבד' }, 405)
  const now = Date.now()
  while (hits.length && now - hits[0] > 60000) hits.shift()
  if (hits.length >= 20) return json({ error: 'יותר מדי פעולות, נסו שוב בעוד דקה' }, 429)
  hits.push(now)

  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return json({ error: 'גוף בקשה לא תקין' }, 400)
  }

  const lawId = String(b.law_id ?? '')
  if (!/^[a-z0-9-]{2,60}$/.test(lawId)) return json({ error: 'מזהה חוק לא תקין' }, 400)
  // רק לחוק שקיים במאגר
  const { data: law } = await db.from('chok_laws').select('id').eq('id', lawId).maybeSingle()
  if (!law) return json({ error: 'החוק לא נמצא במאגר' }, 404)

  try {
    if (b.mode === 'upload') {
      const raw = String(b.image ?? '')
      if (!raw || raw.length > MAX_BYTES * 1.4) return json({ error: 'התמונה חסרה או גדולה מדי' }, 413)
      let bytes: Uint8Array
      try {
        bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
      } catch {
        return json({ error: 'קידוד התמונה לא תקין' }, 400)
      }
      if (bytes.length > MAX_BYTES) return json({ error: 'התמונה גדולה מדי' }, 413)
      // רק JPEG אמיתי: שלושת הבייטים הראשונים
      if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return json({ error: 'רק תמונת JPEG' }, 415)
      const path = `${lawId}/${now}-${crypto.randomUUID().slice(0, 8)}.jpg`
      const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' })
      if (up.error) throw up.error
      const ins = await db.from('chok_images').insert({ law_id: lawId, path })
      if (ins.error) throw ins.error
      return json({ law_id: lawId, path })
    }

    if (b.mode === 'clear') {
      const ins = await db.from('chok_images').insert({ law_id: lawId, path: null })
      if (ins.error) throw ins.error
      return json({ law_id: lawId, path: null })
    }

    if (b.mode === 'restore') {
      const path = String(b.path ?? '')
      const { data: known } = await db.from('chok_images').select('id').eq('law_id', lawId).eq('path', path).limit(1)
      if (!known?.length) return json({ error: 'התמונה הזו לא נשמרה לחוק הזה' }, 404)
      const ins = await db.from('chok_images').insert({ law_id: lawId, path })
      if (ins.error) throw ins.error
      return json({ law_id: lawId, path })
    }

    return json({ error: 'mode לא מוכר' }, 400)
  } catch (err) {
    return json({ error: String((err as Error).message ?? err) }, 502)
  }
})
