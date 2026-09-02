import { json, body, me, requireTeacher, optionsJson, limitText, originGuard } from './_shared.js';
export async function onRequestGet({ request, env }) {
  const teacher = (await me(request, env))?.role === 'teacher';
  const columns = teacher ? 'q.*' : 'q.id,q.subject_id,q.chapter_id,q.type,q.prompt,q.options_json,q.explanation,q.difficulty,q.created_at,q.updated_at';
  const rows = await env.DB.prepare(`SELECT ${columns},s.name subject,c.name chapter FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN chapters c ON c.id=q.chapter_id ORDER BY q.id DESC`).all();
  return json({ questions: (rows.results || []).map(q => ({ ...q, options: optionsJson(q.options_json) })) });
}
export async function onRequestPost({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  const subject = limitText(x.subject, 160), chapter = limitText(x.chapter, 160), prompt = limitText(x.prompt, 20000);
  if (!subject || !chapter || !prompt || !['mcq','boolean','essay'].includes(x.type)) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const options = Array.isArray(x.options) ? x.options.map(v => limitText(v, 1000)).slice(0, 10) : [];
  const difficulty = ['easy','medium','hard'].includes(x.difficulty) ? x.difficulty : 'medium';
  const s = await env.DB.prepare('INSERT INTO subjects(name) VALUES(?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id').bind(subject).first();
  const c = await env.DB.prepare('INSERT INTO chapters(subject_id,name) VALUES(?,?) ON CONFLICT(subject_id,name) DO UPDATE SET name=name RETURNING id').bind(s.id, chapter).first();
  const q = await env.DB.prepare('INSERT INTO questions(subject_id,chapter_id,type,prompt,options_json,correct_answer,explanation,difficulty) VALUES(?,?,?,?,?,?,?,?) RETURNING id').bind(s.id,c.id,x.type,prompt,JSON.stringify(options),limitText(x.correct_answer, 1000) || null,limitText(x.explanation, 20000) || null,difficulty).first();
  return json({ id: q.id });
}
