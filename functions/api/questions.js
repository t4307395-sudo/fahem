import { json, body, me, requireTeacher } from './_shared.js';
export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare('SELECT q.*,s.name subject,c.name chapter FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN chapters c ON c.id=q.chapter_id ORDER BY q.id DESC').all();
  return json({ questions: (rows.results || []).map(q => ({ ...q, options: JSON.parse(q.options_json || '[]') })) });
}
export async function onRequestPost({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const x = await body(request);
  if (!x.subject || !x.chapter || !x.prompt || !['mcq','boolean','essay'].includes(x.type)) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const s = await env.DB.prepare('INSERT INTO subjects(name) VALUES(?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id').bind(x.subject.trim()).first();
  const c = await env.DB.prepare('INSERT INTO chapters(subject_id,name) VALUES(?,?) ON CONFLICT(subject_id,name) DO UPDATE SET name=name RETURNING id').bind(s.id, x.chapter.trim()).first();
  const q = await env.DB.prepare('INSERT INTO questions(subject_id,chapter_id,type,prompt,options_json,correct_answer,explanation) VALUES(?,?,?,?,?,?,?) RETURNING id').bind(s.id,c.id,x.type,x.prompt.trim(),JSON.stringify(x.options || []),x.correct_answer || null,x.explanation || null).first();
  return json({ id: q.id });
}
