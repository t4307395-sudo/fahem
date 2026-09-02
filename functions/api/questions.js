import { json, body, me, requireTeacher, optionsJson, limitText, originGuard } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const teacher = ['admin','teacher'].includes((await me(request, env))?.role);
  const columns = teacher ? 'q.*' : 'q.id,q.subject,q.lesson,q.school_year,q.type,q.prompt,q.options_json,q.explanation,q.difficulty,q.created_at,q.updated_at';
  const rows = await env.DB.prepare(`SELECT ${columns},q.lesson AS chapter FROM questions q ORDER BY q.id DESC`).all();
  return json({ questions: (rows.results || []).map(q => ({ ...q, options: optionsJson(q.options_json) })) });
}

export async function onRequestPost({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  const subject = limitText(x.subject, 160), lesson = limitText(x.chapter || x.lesson, 160), prompt = limitText(x.prompt, 20000);
  if (!subject || !lesson || !prompt || !['mcq','boolean','essay'].includes(x.type)) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const options = Array.isArray(x.options) ? x.options.map(v => limitText(v, 1000)).filter(Boolean).slice(0, 10) : [];
  const difficulty = ['easy','medium','hard'].includes(x.difficulty) ? x.difficulty : 'medium';
  const q = await env.DB.prepare('INSERT INTO questions(subject,lesson,school_year,type,prompt,options_json,correct_answer,explanation,difficulty) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id').bind(subject, lesson, limitText(x.school_year, 80) || null, x.type, prompt, JSON.stringify(options), limitText(x.correct_answer, 1000) || null, limitText(x.explanation, 20000) || null, difficulty).first();
  return json({ id: q.id });
}
