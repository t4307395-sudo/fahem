import { json, me, studentId, optionsJson } from './_shared.js';
export async function onRequestGet({ request, env }) {
  const user = await me(request, env), sid = await studentId(user, env); if (!sid) return json({ questions: [] });
  const rows = await env.DB.prepare('SELECT DISTINCT q.*,s.name subject,c.name chapter FROM attempt_answers aa JOIN attempts a ON a.id=aa.attempt_id JOIN questions q ON q.id=aa.question_id JOIN subjects s ON s.id=q.subject_id JOIN chapters c ON c.id=q.chapter_id WHERE a.student_id=? AND aa.automatic_correct=0 ORDER BY q.id DESC').bind(sid).all();
  return json({ questions: (rows.results || []).map(q => ({ ...q, options: optionsJson(q.options_json) })) });
}
